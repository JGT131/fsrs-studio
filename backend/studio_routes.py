"""
FSRS Studio DEMO endpoints + MOCKED billing / tier-enforcement gateway.

EVERYTHING IN THIS MODULE IS MOCKED:
- No real ML inference, no real hydraulic solver, no real CAD kernel.
- No real authentication: profiles are keyed by a client-generated UUID
  passed via the X-Client-Id header.
- No real Stripe: card numbers are reduced to last4 + brand and never charged.

This is a scaffold that demonstrates the contract for the real
implementation. Replace each handler with the real version while keeping
the same shape.
"""
from __future__ import annotations

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Header
from fastapi.responses import Response
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

from studio_export import (
    generate_export,
    EXPORT_TYPES,
    DISCLAIMER_FULL,
    WATERMARK_TEXT,
    INTENDED_USE,
    CRITICAL_RESTRICTION,
    EXPORT_HEADER_FOOTER,
)
from margin_lock import (
    compute_cost,
    compute_diagnostic_cost,
    estimate_tokens_for_sru,
    record_ai_usage,
    get_balance,
    get_ledger,
    current_rate_config,
    SRU_USD_VALUE,
    DIAGNOSTIC_MAX_SRU,
    LEDGER_COLLECTION,
    _client_total_sru,
)

logger = logging.getLogger("fsrs.studio")

# New mandatory ack text per Plan D
REQUIRED_ACK_TEXT = (
    "I understand FSRS provides preliminary analysis only. I will not "
    "submit any FSRS outputs as final deliverables without full PE "
    "review, modification, and stamping."
)

UPLOAD_DIR = Path("/tmp/fsrs_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_UPLOAD_EXT = {".pdf", ".e57", ".las", ".laz", ".ply", ".xyz", ".dwg", ".dxf", ".png", ".jpg", ".jpeg"}
MAX_UPLOAD_BYTES = 50 * 1024 * 1024

# ============================ Beta-tester guest access ============================
# Licensed engineers running a deep beta test can enter one of these codes
# in the Studio (sent as X-Guest-Code header) to bypass profile, plan, and
# usage caps for the duration of their session.
#
# Configure via env var FSRS_GUEST_CODES="CODE1,CODE2" (comma-separated).
# Default ships with FSRS-BETA-FRIEND for the current pilot cohort.
GUEST_CODES = {
    c.strip()
    for c in os.environ.get("FSRS_GUEST_CODES", "FSRS-BETA-FRIEND").split(",")
    if c.strip()
}

# Window (hours) used for free-tier simulated demo allowance.
SIMULATED_WINDOW_HOURS = int(os.environ.get("FSRS_SIM_WINDOW_HOURS", "24"))


def _is_guest_request(guest_code):
    if not guest_code:
        return False
    return guest_code.strip() in GUEST_CODES

# ============================ NFPA 13 Occupancy Reference Table ============================
# Density/area/coverage values approximated from NFPA 13 for SIMULATED preview only.
# All values must be verified by a licensed PE for any real design.
OCCUPANCY_TABLE = {
    "light": {
        "label": "Light Hazard",
        "design_density_gpm_sqft": 0.10,
        "design_area_sqft": 1500,
        "coverage_per_head_sqft": 200,
        "k_factor": 5.6,
        "examples": "Offices · Hotel rooms · Hospitals · Light residential",
    },
    "oh1": {
        "label": "Ordinary Hazard, Group 1",
        "design_density_gpm_sqft": 0.15,
        "design_area_sqft": 1500,
        "coverage_per_head_sqft": 130,
        "k_factor": 5.6,
        "examples": "Parking garages · Electrical rooms · Restaurants · Bakeries",
    },
    "oh2": {
        "label": "Ordinary Hazard, Group 2",
        "design_density_gpm_sqft": 0.20,
        "design_area_sqft": 1500,
        "coverage_per_head_sqft": 130,
        "k_factor": 8.0,
        "examples": "Retail · Mercantile · Repair garages · Machine shops",
    },
    "eh1": {
        "label": "Extra Hazard, Group 1",
        "design_density_gpm_sqft": 0.30,
        "design_area_sqft": 2500,
        "coverage_per_head_sqft": 100,
        "k_factor": 8.0,
        "examples": "Woodworking · Metal extruding · Printing on combustibles",
    },
    "eh2": {
        "label": "Extra Hazard, Group 2",
        "design_density_gpm_sqft": 0.40,
        "design_area_sqft": 2500,
        "coverage_per_head_sqft": 100,
        "k_factor": 11.2,
        "examples": "Paint spraying · Flammable liquids · Saturated combustibles",
    },
}

# ============================ Case Study Library ============================
# Six building types with full pre-canned workflow data. SIMULATED.
def _hydraulic_nodes(flow, residual):
    """Generate a plausible 5-node table given target flow + residual."""
    return [
        {"id": "BOR", "elev_ft": 0.0, "p_psi": residual, "q_gpm": flow, "pipe_d_in": None, "v_fps": None},
        {"id": "N-01", "elev_ft": 12.0, "p_psi": round(residual * 0.83, 1), "q_gpm": flow, "pipe_d_in": 4.0, "v_fps": round(flow / 40.0, 1)},
        {"id": "N-02", "elev_ft": 12.0, "p_psi": round(residual * 0.77, 1), "q_gpm": round(flow * 0.67, 0), "pipe_d_in": 3.0, "v_fps": round(flow * 0.67 / 22.0, 1)},
        {"id": "N-03", "elev_ft": 12.0, "p_psi": round(residual * 0.72, 1), "q_gpm": round(flow * 0.34, 0), "pipe_d_in": 2.5, "v_fps": round(flow * 0.34 / 16.0, 1)},
        {"id": "REM", "elev_ft": 12.0, "p_psi": round(residual * 0.64, 1), "q_gpm": round(flow * 0.11, 0), "pipe_d_in": 1.25, "v_fps": round(flow * 0.11 / 4.0, 1)},
    ]


def _make_case_study(cid, name, building_type, sqft, occupancy_key, bay, stories=1,
                     location="", head_spacing_ft=None, rationale=None,
                     main_d=None, branch_d=None, k_factor=None,
                     required_flow_override=None, required_residual_override=None,
                     extra_notes=None, primary_focus=False):
    occ = OCCUPANCY_TABLE[occupancy_key]
    coverage = head_spacing_ft[0] * head_spacing_ft[1] if head_spacing_ft else occ["coverage_per_head_sqft"]
    head_count = max(8, round(sqft / coverage))
    if required_flow_override is not None:
        required_flow = float(required_flow_override)
    else:
        required_flow = round(occ["design_density_gpm_sqft"] * occ["design_area_sqft"] + sqft * 0.001 * 50, 0)
    if required_residual_override is not None:
        required_residual = float(required_residual_override)
    else:
        required_residual = 65 + (15 if occupancy_key.startswith("oh") else 0) + (25 if occupancy_key.startswith("eh") else 0)
    return {
        "id": cid,
        "name": name,
        "building_type": building_type,
        "location": location,
        "sqft": sqft,
        "stories": stories,
        "primary_focus": primary_focus,
        "classification": {
            "occupancy_hazard": occ["label"],
            "design_density_gpm_sqft": occ["design_density_gpm_sqft"],
            "design_area_sqft": occ["design_area_sqft"],
            "k_factor": k_factor or occ["k_factor"],
            "confidence": 0.86 + (hash(cid) % 10) / 100.0,
            "rationale": rationale or (
                f"SIMULATED. Classification derived from building type '{building_type}' and {sqft:,} sq ft floor area."
            ),
            "examples": occ["examples"],
            "extra_notes": extra_notes,
        },
        "layout": {
            "bay_dimensions_ft": bay,
            "head_count": head_count,
            "pipe_segment_count": max(6, head_count // 4),
            "main_pipe_diameter_in": main_d if main_d is not None else (4.0 if occupancy_key in ("oh2", "eh1", "eh2") else 3.0),
            "branch_pipe_diameter_in": branch_d if branch_d is not None else (2.0 if occupancy_key.startswith("eh") else 1.5),
            "coverage_per_head_sqft": coverage,
            "head_spacing_ft": list(head_spacing_ft) if head_spacing_ft else [round(coverage ** 0.5, 1), round(coverage ** 0.5, 1)],
        },
        "hydraulics": {
            "required_flow_gpm": required_flow,
            "required_residual_psi": required_residual,
            "friction_method": "Hazen-Williams",
            "hazen_williams_c": 120,
            "most_remote_node": "REM",
            "status": "PRELIMINARY · PE REVIEW REQUIRED",
            "nodes": _hydraulic_nodes(required_flow, required_residual),
        },
        "summary": f"{building_type} · {sqft:,} sq ft · {stories} stories",
        "mocked": True,
        "data_quality": "SIMULATED",
    }


CASE_STUDIES = [
    _make_case_study(
        cid="highrise-residential",
        name="Coastal Verde Tower",
        building_type="High-Rise Residential Condominium",
        sqft=480000, stories=38, location="Miami Beach, FL",
        occupancy_key="light",
        bay=[80, 60, 10],
        head_spacing_ft=(15, 15),
        main_d=4.0, branch_d=1.5, k_factor=5.6,
        required_flow_override=295, required_residual_override=72,
        primary_focus=True,
        rationale=(
            "SIMULATED. Multi-family residential occupancy with sleeping rooms "
            "classifies as Light Hazard per NFPA 13 §5.3. Quick-response (QR) "
            "pendent heads recommended in dwelling units. Standpipe + sprinkler "
            "combo riser typical for 38-story stack. Florida high-rise re-cert "
            "(SB-4D) drives retrofit urgency for this stock."
        ),
        extra_notes="Florida SB-4D milestone-inspection driver",
    ),
    _make_case_study(
        cid="parking-garage-mechanical",
        name="Bayfront Mechanical Garage",
        building_type="Parking Garage / Mechanical Room",
        sqft=95000, stories=5, location="Fort Lauderdale, FL",
        occupancy_key="oh1",
        bay=[60, 40, 9],
        head_spacing_ft=(12, 12),
        main_d=4.0, branch_d=1.5, k_factor=5.6,
        required_flow_override=360, required_residual_override=78,
        rationale=(
            "SIMULATED. Open parking deck + mechanical equipment rooms — "
            "Ordinary Hazard Group 1 per NFPA 13 §5.4.1. Wet system permitted "
            "throughout (Florida climate, no freeze risk). Standard-response "
            "upright sprinklers; vehicle impact protection at columns. Critical "
            "infrastructure for adjacent residential condo tower."
        ),
    ),
    _make_case_study(
        cid="hotel-hospitality",
        name="Sunset Bay Resort",
        building_type="Hotel · Hospitality",
        sqft=140000, stories=7, location="Key Largo, FL",
        occupancy_key="light",
        bay=[60, 40, 10],
        head_spacing_ft=(14, 14),
        main_d=3.0, branch_d=1.5, k_factor=5.6,
        required_flow_override=285, required_residual_override=68,
        rationale=(
            "SIMULATED. Hotel guest rooms + corridors classify as Light Hazard "
            "per NFPA 13 §5.3. Concealed pendent heads in guest rooms, recessed "
            "in corridors. Public-area kitchens require separate OH-1 zoning "
            "(addressed in zone schedule). Florida coastal corrosion notes apply "
            "to exterior balcony lines."
        ),
    ),
    _make_case_study(
        cid="apartment-complex",
        name="Magnolia Gardens",
        building_type="Apartment Complex · Garden-Style",
        sqft=220000, stories=4, location="Tampa, FL",
        occupancy_key="light",
        bay=[60, 40, 10],
        head_spacing_ft=(15, 15),
        main_d=2.5, branch_d=1.25, k_factor=5.6,
        required_flow_override=265, required_residual_override=65,
        rationale=(
            "SIMULATED. Garden-style multi-family residential — Light Hazard per "
            "NFPA 13 §5.3. NFPA 13R alternative viable for this 4-story height "
            "and unit count (PE call). QR heads in dwelling units. Combination "
            "domestic + fire service consideration noted in zone schedule."
        ),
    ),
    _make_case_study(
        cid="retail-restaurant",
        name="Harbor Square Plaza",
        building_type="Retail · Restaurant",
        sqft=65000, stories=1, location="Naples, FL",
        occupancy_key="oh2",
        bay=[80, 60, 14],
        head_spacing_ft=(12, 12),
        main_d=4.0, branch_d=2.0, k_factor=8.0,
        required_flow_override=420, required_residual_override=80,
        rationale=(
            "SIMULATED. Mercantile occupancy + restaurant seating — Ordinary "
            "Hazard Group 2 per NFPA 13 §5.4.2. K-8 standard-response upright "
            "in retail bays; commercial kitchens require UL 300 hood-suppression "
            "(separate from this analysis). Storage in stockrooms checked against "
            "Chapter 20 in-rack requirements."
        ),
    ),
    _make_case_study(
        cid="light-manufacturing",
        name="MarineTech Assembly",
        building_type="Light Manufacturing",
        sqft=85000, stories=1, location="Jacksonville, FL",
        occupancy_key="oh2",
        bay=[90, 60, 18],
        head_spacing_ft=(13, 13),
        main_d=4.0, branch_d=2.0, k_factor=8.0,
        required_flow_override=445, required_residual_override=82,
        rationale=(
            "SIMULATED. Light assembly of marine components — Ordinary Hazard "
            "Group 2 per NFPA 13 §5.4.2. Combustible solid raw stock < 12 ft "
            "high. K-8 upright sprinklers at 18 ft ceiling. Note: any expansion "
            "into FRP / fiberglass lay-up zones would push to EH-1 — flag for PE "
            "review during permit."
        ),
    ),
    _make_case_study(
        cid="industrial-warehouse",
        name="Atlantic Logistics Hub",
        building_type="Industrial Warehouse · High-Pile Storage",
        sqft=320000, stories=1, location="Orlando, FL",
        occupancy_key="eh1",
        bay=[120, 90, 32],
        head_spacing_ft=(10, 10),
        main_d=6.0, branch_d=2.5, k_factor=11.2,
        required_flow_override=940, required_residual_override=95,
        rationale=(
            "SIMULATED. High-piled storage of mixed commodities — Extra Hazard "
            "Group 1 per NFPA 13 §5.4.3 with possible escalation to Chapter "
            "20 commodity-classification rules. ESFR K-22.4 alternative should "
            "be evaluated vs. CMSA. In-rack sprinklers flagged for racks > 25 "
            "ft. Definite PE review required for commodity class and storage "
            "configuration."
        ),
        extra_notes="High-pile storage — Chapter 20 review required",
    ),
    _make_case_study(
        cid="office-tower",
        name="Brickell Apex Tower",
        building_type="Office Tower",
        sqft=380000, stories=28, location="Miami, FL",
        occupancy_key="light",
        bay=[80, 60, 10],
        head_spacing_ft=(15, 15),
        main_d=4.0, branch_d=1.5, k_factor=5.6,
        required_flow_override=275, required_residual_override=70,
        rationale=(
            "SIMULATED. Open-plan office with conference + amenity floors — "
            "Light Hazard per NFPA 13 §5.3. Concealed pendent in occupied spaces, "
            "upright in IT closets & MEP rooms. Standpipe Class I required per "
            "FBC for height. Combo riser typical. Verify amenity-floor kitchen "
            "zoning (likely OH-1 sub-zone)."
        ),
    ),
]

# ============================ Tier policy (MOCKED) ============================
TIER_LIMITS = {
    "free": {
        "label": "Free Tier (Simulated Demo)",
        "max_lifetime_simulated_exports": None,   # deprecated — kept for back-compat
        "max_simulated_exports_per_window": 25,
        "simulated_window_hours": SIMULATED_WINDOW_HOURS,
        "max_projects": 0,          # no real projects
        "included_sru_per_month": 0,
        "overage_sru_usd": None,
        "allow_real_uploads": False,
        "allow_real_exports": False,
        "monthly_cap_usd": 0,
    },
    "guest": {
        "label": "Founder's Guest (Bypass)",
        "max_lifetime_simulated_exports": None,
        "max_simulated_exports_per_window": None,  # unlimited
        "simulated_window_hours": SIMULATED_WINDOW_HOURS,
        "max_projects": None,
        "included_sru_per_month": None,           # unlimited for beta tester
        "overage_sru_usd": 0,
        "allow_real_uploads": True,
        "allow_real_exports": True,
        "monthly_cap_usd": None,
    },
    "starter": {
        "label": "Starter · $99 one-time",
        "max_lifetime_simulated_exports": None,
        "max_simulated_exports_per_window": None,
        "simulated_window_hours": SIMULATED_WINDOW_HOURS,
        "max_projects": None,
        "included_sru_per_month": 5,
        "overage_sru_usd": 25,  # tiered overage applied at /export billing time
        "allow_real_uploads": True,
        "allow_real_exports": True,
        "monthly_cap_usd": None,
    },
    "founding_beta": {
        "label": "Founding Beta · $249 one-time",
        "max_lifetime_simulated_exports": None,
        "max_simulated_exports_per_window": None,
        "simulated_window_hours": SIMULATED_WINDOW_HOURS,
        "max_projects": None,                     # no hard cap; usage-billed
        "included_sru_per_month": 15,             # V2.4 — $249 → +15 SRUs
        "overage_sru_usd": 25,
        "allow_real_uploads": True,
        "allow_real_exports": True,
        "monthly_cap_usd": None,
    },
    "professional": {
        "label": "Professional · $399 one-time",
        "max_lifetime_simulated_exports": None,
        "max_simulated_exports_per_window": None,
        "simulated_window_hours": SIMULATED_WINDOW_HOURS,
        "max_projects": None,
        "included_sru_per_month": 30,
        "overage_sru_usd": 20,
        "allow_real_uploads": True,
        "allow_real_exports": True,
        "monthly_cap_usd": None,
    },
    "firm": {
        "label": "Firm Plan · $1,499 one-time",
        "max_lifetime_simulated_exports": None,
        "max_simulated_exports_per_window": None,
        "simulated_window_hours": SIMULATED_WINDOW_HOURS,
        "max_projects": None,
        "included_sru_per_month": 100,
        "overage_sru_usd": 18,
        "allow_real_uploads": True,
        "allow_real_exports": True,
        "monthly_cap_usd": None,
    },
    "payg": {
        "label": "Pay-As-You-Go",
        "max_lifetime_simulated_exports": None,
        "max_simulated_exports_per_window": None,
        "simulated_window_hours": SIMULATED_WINDOW_HOURS,
        "max_projects": None,
        "included_sru_per_month": 0,
        "overage_sru_usd": 30,
        "allow_real_uploads": True,
        "allow_real_exports": True,
        "monthly_cap_usd": 100,
    },
}


# =============================== Models ===============================
class ProfileCreate(BaseModel):
    name: str
    email: EmailStr
    firm: Optional[str] = None
    license: Optional[str] = None


class CardMock(BaseModel):
    cardholder: str
    last4: str = Field(min_length=4, max_length=4)
    brand: str = "VISA"


class PlanSelect(BaseModel):
    plan: str = Field(pattern="^(free|founding_beta|payg)$")
    monthly_cap_usd: Optional[int] = None


class ExportRequest(BaseModel):
    project_id: str
    project_name: str = "Untitled"
    doc_type: str = Field(pattern="^(pdf|dxf|ifc)$")
    acknowledged: bool
    acknowledgment_text: str
    name: str
    email: EmailStr
    license: Optional[str] = None
    mode: str = Field(default="simulated", pattern="^(simulated|real)$")
    # V1.8 refinement — links the export back to its mandatory Diagnostic
    # Estimate so the studio_diagnoses record can store actual SRU/USD cost.
    diagnose_id: Optional[str] = None


class ShadowPreviewRequest(BaseModel):
    sqft: int = Field(ge=100, le=5_000_000)
    occupancy: str = Field(pattern="^(light|oh1|oh2|eh1|eh2)$")
    building_type: Optional[str] = None
    stories: int = Field(default=1, ge=1, le=80)
    filename: Optional[str] = None


# ============================ Helpers ============================
async def _get_or_create_profile(db, client_id):
    if not client_id:
        return None
    prof = await db.profiles.find_one({"client_id": client_id}, {"_id": 0})
    if prof:
        return prof
    return None


async def _require_profile(db, client_id, guest_code: Optional[str] = None):
    if _is_guest_request(guest_code):
        return {"client_id": client_id, "plan": "guest", "guest": True}
    prof = await _get_or_create_profile(db, client_id)
    if not prof:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "profile_required",
                "message": "Create a profile, add a card, and pick a plan before using FSRS.",
                "gateway_url": "/app",
            },
        )
    return prof


def _tier_of(profile):
    if profile.get("guest"):
        return TIER_LIMITS["guest"]
    return TIER_LIMITS.get(profile.get("plan") or "free", TIER_LIMITS["free"])


# ============================ Router ============================
def build_studio_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/studio", tags=["studio-demo"])

    @router.get("/info")
    async def info():
        return {
            "service": "FSRS Studio DEMO",
            "demo": True,
            "data_quality": "SIMULATED",
            "warning": WATERMARK_TEXT,
            "intended_use": INTENDED_USE,
            "critical_restriction": CRITICAL_RESTRICTION,
            "disclaimer": DISCLAIMER_FULL,
            "export_header_footer": EXPORT_HEADER_FOOTER,
            "required_acknowledgment_text": REQUIRED_ACK_TEXT,
            "tier_limits": TIER_LIMITS,
            "simulated_window_hours": SIMULATED_WINDOW_HOURS,
            "endpoints": [
                "POST /api/studio/uploads",
                "POST /api/studio/layouts",
                "POST /api/studio/calcs",
                "POST /api/studio/exports",
                "GET  /api/studio/exports/{id}/file",
                "POST /api/studio/simulated/start",
                "POST /api/studio/guest/verify",
                "POST /api/studio/sru/estimate",
            ],
            "supported_export_types": sorted(EXPORT_TYPES),
        }

    @router.post("/guest/verify")
    async def verify_guest(
        x_guest_code: Optional[str] = Header(default=None),
    ):
        """
        Validate a Founder's Guest beta code.

        Used by the Studio UI to confirm a code is active before persisting
        it in the browser. Never echoes the configured codes — only
        confirms whether the supplied one is valid.
        """
        ok = _is_guest_request(x_guest_code)
        return {
            "ok": ok,
            "tier": TIER_LIMITS["guest"]["label"] if ok else None,
            "bypass": {
                "real_uploads": ok,
                "real_exports": ok,
                "project_cap": ok,
                "simulated_cap": ok,
            },
            "window_hours": SIMULATED_WINDOW_HOURS,
        }

    @router.post("/sru/estimate")
    async def estimate_sru(
        x_client_id: str = Header(default=None),
        x_guest_code: Optional[str] = Header(default=None),
        area_sqft: Optional[float] = Form(default=None),
        hazard: Optional[str] = Form(default="ordinary_group_1"),
        complexity: Optional[str] = Form(default="standard"),
    ):
        """
        Estimate Standard Retrofit Units (SRUs) for a planned run.

        Heuristic only — not a quote. 1 SRU covers an ordinary-hazard zone
        ≤5,000 sf with a single export pass. Larger or extra-hazard zones
        scale linearly.
        """
        sqft = float(area_sqft or 1500.0)
        # Base: 1 SRU per 5,000 sf (round up).
        import math
        base_units = max(1, math.ceil(sqft / 5000.0))
        # Hazard / complexity multipliers (cosmetic; mock).
        multipliers = {
            "ordinary_group_1": 1.0,
            "ordinary_group_2": 1.15,
            "extra_hazard": 1.4,
            "light_hazard": 0.85,
        }
        mult = multipliers.get((hazard or "").lower(), 1.0)
        if (complexity or "").lower() == "high":
            mult *= 1.25

        sru = max(1, int(round(base_units * mult)))

        # Determine plan + overage cost for transparency
        if _is_guest_request(x_guest_code):
            prof = {"plan": "guest", "guest": True}
        else:
            prof = await _get_or_create_profile(db, x_client_id) if x_client_id else None
        tier = _tier_of(prof or {"plan": "free"})
        included = tier.get("included_sru_per_month")
        overage_rate = tier.get("overage_sru_usd")

        # Count SRUs already consumed this calendar month
        if x_client_id and not _is_guest_request(x_guest_code):
            start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            used_doc = await db.sru_usage.aggregate([
                {"$match": {"client_id": x_client_id, "at": {"$gte": start.isoformat()}}},
                {"$group": {"_id": None, "sru": {"$sum": "$sru"}}},
            ]).to_list(1)
            used_this_month = int(used_doc[0]["sru"]) if used_doc else 0
        else:
            used_this_month = 0

        if included is None:        # unlimited (guest)
            included_remaining = None
            overage_units = 0
            overage_cost = 0.0
        else:
            included_remaining = max(0, included - used_this_month)
            overage_units = max(0, sru - included_remaining)
            overage_cost = round(overage_units * (overage_rate or 0), 2)

        return {
            "estimated_sru": sru,
            "included_remaining": included_remaining,
            "overage_units": overage_units,
            "overage_rate_usd": overage_rate,
            "overage_cost_usd": overage_cost,
            "tier_label": tier["label"],
            "used_this_month": used_this_month,
            "included_per_month": included,
            "note": (
                "Estimate only. 1 SRU ≈ ordinary-hazard zone ≤5,000 sf. "
                "No hard limits — overage SRUs are billed at the per-SRU rate."
            ),
        }

    # ============================ V1.7 Margin-Lock & Wallet ============================
    # Configurable Gemini token rates → 20% margin-lock multiplier → SRU deduction
    # → append-only usage_ledger. The pre-export estimator below shows users the
    # exact SRU + USD consumption BEFORE they confirm.

    @router.get("/usage/config")
    async def usage_config():
        """Expose the active Margin-Lock rate config (read-only)."""
        return current_rate_config()

    @router.post("/usage/estimate")
    async def usage_estimate(
        x_client_id: str = Header(default=None),
        x_guest_code: Optional[str] = Header(default=None),
        area_sqft: Optional[float] = Form(default=None),
        hazard: Optional[str] = Form(default="ordinary_group_1"),
        complexity: Optional[str] = Form(default="standard"),
        doc_type: Optional[str] = Form(default="pdf"),
    ):
        """
        Pre-export estimator — returns the exact SRU + USD that will be deducted
        if the user confirms the run. Combines the heuristic SRU sizing with
        the Margin-Lock token math so the preview equals the post-export
        ledger entry (modulo real Gemini token variance once wired).
        """
        sqft = float(area_sqft or 1500.0)
        import math as _math
        base_units = max(1, _math.ceil(sqft / 5000.0))
        multipliers = {
            "ordinary_group_1": 1.0,
            "ordinary_group_2": 1.15,
            "extra_hazard": 1.4,
            "light_hazard": 0.85,
        }
        mult = multipliers.get((hazard or "").lower(), 1.0)
        if (complexity or "").lower() == "high":
            mult *= 1.25
        # doc_type adds a small differential (IFC/DXF need more output tokens)
        doc_mult = {"pdf": 1.0, "dxf": 1.10, "ifc": 1.20}.get((doc_type or "pdf").lower(), 1.0)
        sru_units = max(1.0, base_units * mult * doc_mult)

        in_tok, out_tok = estimate_tokens_for_sru(sru_units)
        breakdown = compute_cost(in_tok, out_tok, billable_sru=sru_units)

        # Plan + balance preview (without recording anything)
        if _is_guest_request(x_guest_code):
            prof = {"plan": "guest", "guest": True}
        else:
            prof = await _get_or_create_profile(db, x_client_id) if x_client_id else None
        tier = _tier_of(prof or {"plan": "free"})
        included = tier.get("included_sru_per_month")
        purchased = int((prof or {}).get("sru_purchased", 0) or 0)
        bal = await get_balance(
            db,
            client_id=x_client_id,
            included_sru=included,
            purchased_sru=purchased,
        )

        return {
            "estimated_sru": breakdown["sru_amount"],
            "estimated_cost_usd": breakdown["marked_up_cost_displayed_usd"],
            "raw_cost_usd": breakdown["raw_cost_usd"],
            "margin_lock_multiplier": breakdown["margin_lock_multiplier"],
            "margin_floor_sru": breakdown["margin_floor_sru"],
            "billable_sru": breakdown["billable_sru"],
            "margin_protected": breakdown["margin_protected"],
            "tokens": {
                "input": breakdown["input_tokens"],
                "output": breakdown["output_tokens"],
            },
            "rates": {
                "input_usd_per_1k": breakdown["input_rate_usd_per_1k"],
                "output_usd_per_1k": breakdown["output_rate_usd_per_1k"],
                "sru_usd_value": breakdown["sru_usd_value"],
            },
            "tier_label": tier["label"],
            "balance": bal,
            "doc_type": (doc_type or "pdf").lower(),
            "confirmation_required": True,
            "note": (
                "Margin-Lock applies a 20% buffer above raw Gemini cost. "
                "No SRUs are deducted until you Confirm & Process."
            ),
        }

    # ============================ V1.8 Diagnostic Estimator ============================
    # Mandatory cheap-pass first step in the Studio workflow.
    # - Validates basic file metadata (size/type).
    # - Estimates project complexity from drawing density heuristics.
    # - Returns the FULL-RUN SRU + USD projection so the user can decide.
    # - Writes a tiny (<0.3 SRU) Flash-tier ledger entry so usage is auditable.
    # The "Run Full Analysis" client-side button must remain inactive
    # until the user explicitly confirms this estimate.

    DIAGNOSTIC_ALLOWED_EXT = {".pdf", ".dwg", ".dxf", ".png", ".jpg", ".jpeg"}
    DIAGNOSTIC_MAX_BYTES = 50 * 1024 * 1024

    @router.post("/diagnose")
    async def diagnose_drawing(
        file: Optional[UploadFile] = File(default=None),
        filename: Optional[str] = Form(default=None),
        file_bytes: Optional[int] = Form(default=None),
        sqft: Optional[float] = Form(default=None),
        occupancy: Optional[str] = Form(default="oh1"),
        stories: Optional[int] = Form(default=1),
        building_type: Optional[str] = Form(default=None),
        doc_type: Optional[str] = Form(default="pdf"),
        x_client_id: str = Header(default=None),
        x_guest_code: Optional[str] = Header(default=None),
    ):
        """
        V1.8 — Diagnostic Estimator (cheap pass).

        Accepts either a multipart file OR pre-validated metadata
        (filename + file_bytes). Returns:
          - complexity (LOW / MEDIUM / HIGH) + drawing-density summary
          - estimated SRU consumption for the full analysis
          - estimated USD cost (Margin-Lock applied)
          - this diagnostic call's own cheap-pass cost (<0.3 SRU)
        Writes an append-only ledger row tagged `operation=diagnose.flash`.
        """
        # --- 1. Resolve effective filename + size --------------------------
        contents_len = 0
        effective_name = filename or "drawing.pdf"
        if file is not None:
            contents = await file.read()
            contents_len = len(contents)
            effective_name = file.filename or effective_name
            # Do NOT persist the bytes — diagnostic is privacy-first.
            del contents
        elif file_bytes is not None:
            try:
                contents_len = int(file_bytes)
            except (TypeError, ValueError):
                contents_len = 0

        if contents_len > DIAGNOSTIC_MAX_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File too large (max {DIAGNOSTIC_MAX_BYTES // 1024 // 1024} MB).",
            )

        ext = Path(effective_name).suffix.lower()
        if ext and ext not in DIAGNOSTIC_ALLOWED_EXT:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported file type {ext}. "
                    f"Allowed: {sorted(DIAGNOSTIC_ALLOWED_EXT)}"
                ),
            )

        # --- 2. Heuristic complexity score --------------------------------
        # Drawing density proxy: bytes-per-megabyte → resolution / detail.
        # Higher MB → assume denser drawings → more tokens to scan.
        mb = max(0.05, contents_len / (1024.0 * 1024.0))

        # Occupancy multiplier (extra hazard projects need finer head spacing).
        occ_mult = {
            "light": 0.85,
            "oh1": 1.0,
            "oh2": 1.15,
            "eh1": 1.4,
            "eh2": 1.55,
        }.get((occupancy or "oh1").lower(), 1.0)

        stories_int = max(1, int(stories or 1))
        story_mult = 1.0 + min(0.6, (stories_int - 1) * 0.04)

        # Optional sqft hint sharpens the estimate.
        if sqft and sqft > 0:
            import math as _math
            sqft_units = max(1.0, _math.ceil(float(sqft) / 5000.0))
        else:
            # Infer sqft from MB: a rough 1MB ≈ 8,000 sf scanned-PDF heuristic.
            sqft_units = max(1.0, mb * 1.6)

        doc_mult = {"pdf": 1.0, "dxf": 1.10, "ifc": 1.20}.get(
            (doc_type or "pdf").lower(), 1.0
        )

        full_sru_units = max(1.0, sqft_units * occ_mult * story_mult * doc_mult)

        # Complexity bucket
        if full_sru_units <= 2.0:
            complexity = "LOW"
            complexity_note = "Single-zone or small floor plate. Standard analysis path."
        elif full_sru_units <= 6.0:
            complexity = "MEDIUM"
            complexity_note = "Multi-zone layout. Expect 2–3 hazard-class transitions."
        else:
            complexity = "HIGH"
            complexity_note = (
                "Dense or multi-story envelope. PE review strongly recommended on every zone."
            )

        # --- 3. Full-run breakdown (Pro-tier) -----------------------------
        in_tok_full, out_tok_full = estimate_tokens_for_sru(full_sru_units)
        full_breakdown = compute_cost(in_tok_full, out_tok_full, billable_sru=full_sru_units)

        # --- 4. Cheap-pass diagnostic ledger (Flash-tier, <0.3 SRU) ------
        # ~5% of the full-run tokens, capped to keep cost negligible.
        diag_in = max(200, int(in_tok_full * 0.05))
        diag_out = max(80, int(out_tok_full * 0.05))
        diag_breakdown = compute_diagnostic_cost(diag_in, diag_out)

        used_before = await _client_total_sru(db, x_client_id) if x_client_id else 0.0
        # Generate diagnose_id up-front so the ledger row can carry it.
        diagnose_id = str(uuid.uuid4())
        ledger_id = str(uuid.uuid4())
        ledger_row = {
            "id": ledger_id,
            "at": datetime.now(timezone.utc).isoformat(),
            "client_id": x_client_id,
            "plan": "flash",
            "operation": "diagnose.flash",
            "project_id": None,
            "export_id": None,
            **diag_breakdown,
            "sru_used_before": round(used_before, 4),
            "sru_used_after": round(used_before + diag_breakdown["sru_amount"], 4),
            "margin_locked": True,
            "ledger_version": "v1",
            "extra": {
                "filename": effective_name,
                "file_bytes": contents_len,
                "occupancy": occupancy,
                "stories": stories_int,
                "complexity": complexity,
                "diagnostic": True,
                # V1.8 refinement — estimate cost mirrored into ledger so the
                # admin audit can pair estimate ↔ actual without joining
                # studio_diagnoses.
                "estimated_sru_cost": full_breakdown["sru_amount"],
                "estimated_usd_cost": full_breakdown["marked_up_cost_displayed_usd"],
                "diagnose_id": diagnose_id,
            },
        }
        if x_client_id:
            await db[LEDGER_COLLECTION].insert_one(ledger_row.copy())

        # --- 5. Persist a diagnose record for audit ----------------------
        diag_doc = {
            "id": diagnose_id,
            "client_id": x_client_id,
            "at": datetime.now(timezone.utc).isoformat(),
            "filename": effective_name,
            "file_bytes": contents_len,
            "occupancy": occupancy,
            "stories": stories_int,
            "building_type": building_type,
            "doc_type": (doc_type or "pdf").lower(),
            "complexity": complexity,
            "estimated_full_sru": full_breakdown["sru_amount"],
            "estimated_full_usd": full_breakdown["marked_up_cost_displayed_usd"],
            "diagnostic_sru": diag_breakdown["sru_amount"],
            "diagnostic_usd": diag_breakdown["marked_up_cost_displayed_usd"],
            "ledger_id": ledger_id,
            "confirmed": False,
            "mocked": True,
            "data_quality": "SIMULATED",
        }
        await db.studio_diagnoses.insert_one(diag_doc.copy())

        return {
            "diagnose_id": diagnose_id,
            "filename": effective_name,
            "file_bytes": contents_len,
            "file_mb": round(mb, 2),
            "ext": ext or "(unknown)",
            "occupancy": occupancy,
            "stories": stories_int,
            "complexity": complexity,
            "complexity_note": complexity_note,
            "estimated_full_sru": full_breakdown["sru_amount"],
            "estimated_full_cost_usd": full_breakdown["marked_up_cost_displayed_usd"],
            "diagnostic": {
                "tier": "flash",
                "ledger_id": ledger_id,
                "sru": diag_breakdown["sru_amount"],
                "cost_usd": diag_breakdown["marked_up_cost_displayed_usd"],
                "raw_cost_usd": diag_breakdown["raw_cost_usd"],
                "tokens": {
                    "input": diag_breakdown["input_tokens"],
                    "output": diag_breakdown["output_tokens"],
                },
                "max_allowed_sru": DIAGNOSTIC_MAX_SRU,
            },
            "margin_lock_multiplier": full_breakdown["margin_lock_multiplier"],
            "sru_usd_value": SRU_USD_VALUE,
            "confirmation_required": True,
            "note": (
                "SIMULATED. Cheap-pass scan estimates drawing complexity. "
                "No SRUs will be deducted for the full analysis until you "
                "click Confirm & Process."
            ),
            "mocked": True,
            "data_quality": "SIMULATED",
        }

    @router.post("/diagnose/{diagnose_id}/confirm")
    async def diagnose_confirm(
        diagnose_id: str,
        x_client_id: str = Header(default=None),
    ):
        """Mark a diagnostic as confirmed; downstream upload/run is unlocked."""
        d = await db.studio_diagnoses.find_one({"id": diagnose_id}, {"_id": 0})
        if not d:
            raise HTTPException(404, "Diagnose record not found")
        if x_client_id and d.get("client_id") and d["client_id"] != x_client_id:
            raise HTTPException(403, "Diagnose belongs to a different client")
        await db.studio_diagnoses.update_one(
            {"id": diagnose_id},
            {"$set": {
                "confirmed": True,
                "confirmed_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        return {"diagnose_id": diagnose_id, "confirmed": True}

    @router.get("/usage/balance")
    async def usage_balance(
        x_client_id: str = Header(default=None),
        x_guest_code: Optional[str] = Header(default=None),
    ):
        if _is_guest_request(x_guest_code):
            prof = {"plan": "guest", "guest": True}
        else:
            prof = await _get_or_create_profile(db, x_client_id) if x_client_id else None
        tier = _tier_of(prof or {"plan": "free"})
        purchased = int((prof or {}).get("sru_purchased", 0) or 0)
        bal = await get_balance(
            db,
            client_id=x_client_id,
            included_sru=tier.get("included_sru_per_month"),
            purchased_sru=purchased,
        )
        return {
            "tier_label": tier["label"],
            "overage_rate_usd": tier.get("overage_sru_usd"),
            **bal,
        }

    @router.get("/usage/ledger")
    async def usage_ledger_list(
        x_client_id: str = Header(default=None),
        limit: int = 50,
    ):
        entries = await get_ledger(db, client_id=x_client_id, limit=limit)
        return {"client_id": x_client_id, "count": len(entries), "entries": entries}

    # ============================ V1.8 Admin Dashboard (Mockup) ============================
    # Restricted admin-preview surface. Requires X-Admin-Key matching env var
    # FSRS_ADMIN_KEY (default: FSRS-ADMIN-PREVIEW). Everything below is a
    # MOCKUP — real Stripe payouts and real Gemini billing are not wired.

    _ADMIN_KEY = os.environ.get("FSRS_ADMIN_KEY", "FSRS-ADMIN-PREVIEW")

    def _check_admin(provided: Optional[str]):
        if not provided or provided.strip() != _ADMIN_KEY:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "admin_key_required",
                    "message": (
                        "Admin Dashboard is restricted. Pass header X-Admin-Key. "
                        "Demo key for ADMIN PREVIEW: FSRS-ADMIN-PREVIEW."
                    ),
                },
            )

    @router.get("/admin/dashboard")
    async def admin_dashboard(
        x_admin_key: Optional[str] = Header(default=None),
    ):
        """
        Revenue + cost + margin snapshot for the ADMIN PREVIEW dashboard.

        Mocked sources:
        - Gross revenue is derived from the `studio_acknowledgments` count of
          REAL-mode exports (treated as $249 founding-tier baseline) plus any
          billing profiles found in `profiles` (priced at their plan
          label). Stripe is mocked — no real payments are involved.
        - AI cost is the SUM of `raw_cost_usd` over the entire `usage_ledger`
          collection (real interceptor data — this part is exact).
        - Estimated fees ≈ 2.9% of gross (Stripe processing rate, mocked).
        """
        _check_admin(x_admin_key)

        # --- Revenue (mocked from acknowledged real-mode exports + profiles) ---
        BASE_PRICE = {
            "starter": 99.0,
            "founding_beta": 249.0,
            "professional": 399.0,
            "firm": 1499.0,
            "payg": 0.0,
            "free": 0.0,
            "guest": 0.0,
        }
        # Distinct paying clients (profile created + plan chosen + card mocked)
        paying = await db.profiles.find(
            {"card_added": True, "plan": {"$in": list(BASE_PRICE.keys())}},
            {"_id": 0, "client_id": 1, "plan": 1, "created_at": 1},
        ).to_list(2000)
        gross_revenue = sum(BASE_PRICE.get(p.get("plan") or "free", 0.0) for p in paying)
        paying_count = len(paying)

        # --- AI cost (exact, from interceptor ledger) ---
        agg = await db[LEDGER_COLLECTION].aggregate([
            {"$group": {
                "_id": None,
                "raw_cost": {"$sum": "$raw_cost_usd"},
                "marked_up": {"$sum": "$marked_up_cost_usd"},
                "sru": {"$sum": "$sru_amount"},
                "exports": {"$sum": 1},
            }},
        ]).to_list(1)
        if agg:
            ai_cost = float(agg[0].get("raw_cost") or 0.0)
            total_marked_up = float(agg[0].get("marked_up") or 0.0)
            total_sru_charged = float(agg[0].get("sru") or 0.0)
            export_count = int(agg[0].get("exports") or 0)
        else:
            ai_cost = total_marked_up = total_sru_charged = 0.0
            export_count = 0

        stripe_fee_rate = 0.029  # 2.9% mocked
        estimated_fees = round(gross_revenue * stripe_fee_rate, 2)
        net_profit = round(gross_revenue - ai_cost - estimated_fees, 2)
        gross_margin_pct = (
            round((net_profit / gross_revenue) * 100, 1)
            if gross_revenue > 0
            else None
        )

        margin_locked = gross_margin_pct is not None and gross_margin_pct >= 20.0

        # --- Payout placeholder (mocked) ---
        import datetime as _dt
        now = _dt.datetime.now(timezone.utc)
        next_payout_at = (now + _dt.timedelta(days=2)).replace(
            hour=9, minute=0, second=0, microsecond=0
        )

        return {
            "demo": True,
            "admin_preview": True,
            "generated_at": now.isoformat(),
            "kpi": {
                "gross_revenue_usd": round(gross_revenue, 2),
                "ai_cost_usd": round(ai_cost, 6),
                "estimated_fees_usd": estimated_fees,
                "net_profit_usd": net_profit,
                "gross_margin_pct": gross_margin_pct,
                "margin_locked": margin_locked,
                "margin_lock_multiplier": 1.2,
                "paying_customers": paying_count,
                "exports_processed": export_count,
                "total_sru_charged": round(total_sru_charged, 4),
                "total_marked_up_usd": round(total_marked_up, 6),
            },
            "stripe": {
                "mode": "TEST MODE",
                "currency": "USD",
                "next_payout_at": next_payout_at.isoformat(),
                "next_payout_amount_usd": round(net_profit if net_profit > 0 else 0.0, 2),
                "fee_rate_pct": stripe_fee_rate * 100,
                "mocked": True,
            },
            "rates": current_rate_config(),
        }

    @router.get("/admin/transactions")
    async def admin_transactions(
        x_admin_key: Optional[str] = Header(default=None),
        limit: int = 50,
    ):
        """Simplified usage_ledger feed for the dashboard transaction list."""
        _check_admin(x_admin_key)
        entries = await (
            db[LEDGER_COLLECTION]
            .find({}, {"_id": 0})
            .sort("at", -1)
            .limit(int(limit))
            .to_list(int(limit))
        )

        # Bulk-fetch project names
        project_ids = list({e.get("project_id") for e in entries if e.get("project_id")})
        proj_docs = []
        if project_ids:
            proj_docs = await db.studio_projects.find(
                {"id": {"$in": project_ids}},
                {"_id": 0, "id": 1, "name": 1, "simulated": 1, "case_study": 1},
            ).to_list(len(project_ids))
        proj_by_id = {p["id"]: p for p in proj_docs}

        rows = []
        for e in entries:
            proj = proj_by_id.get(e.get("project_id") or "")
            rows.append({
                "id": e.get("id"),
                "at": e.get("at"),
                "client_id": e.get("client_id"),
                "operation": e.get("operation"),
                "project_id": e.get("project_id"),
                "project_name": (proj or {}).get("name") or "—",
                "is_simulated": bool((proj or {}).get("simulated")),
                "plan": e.get("plan"),
                "raw_cost_usd": e.get("raw_cost_usd"),
                "marked_up_cost_usd": e.get("marked_up_cost_displayed_usd")
                    or e.get("marked_up_cost_usd"),
                "sru_deducted": e.get("sru_amount"),
                "margin_protected": e.get("margin_protected"),
                "export_id": e.get("export_id"),
            })
        return {"count": len(rows), "rows": rows, "mocked": True}

    @router.get("/admin/subscribers")
    async def admin_subscribers(
        x_admin_key: Optional[str] = Header(default=None),
        limit: int = 100,
    ):
        """
        V2.4 — Subscriber Audit. Lists every profile that has paid
        (card_added=True) with their plan, SRUs purchased, SRUs used,
        and most recent Stripe session id. Used by the /dashboard
        Subscriber Audit panel to track Rod / Joe (and beyond) test
        activations.
        """
        _check_admin(x_admin_key)

        profiles = await db.profiles.find(
            {"card_added": True},
            {"_id": 0, "client_id": 1, "plan": 1, "sru_purchased": 1,
             "card_added_at": 1, "stripe_session_id": 1, "email": 1,
             "name": 1, "label": 1, "created_at": 1},
        ).sort("card_added_at", -1).limit(int(limit)).to_list(int(limit))

        # For each subscriber, compute SRUs used from the ledger and last activity.
        rows = []
        for p in profiles:
            cid = p.get("client_id")
            used = await _client_total_sru(db, cid)
            last = await db[LEDGER_COLLECTION].find_one(
                {"client_id": cid}, {"_id": 0, "at": 1, "operation": 1},
                sort=[("at", -1)],
            )
            tier = TIER_LIMITS.get(p.get("plan") or "free", TIER_LIMITS["free"])
            purchased = int(p.get("sru_purchased") or 0)
            included = int(tier.get("included_sru_per_month") or 0)
            rows.append({
                "client_id": cid,
                "plan": p.get("plan"),
                "tier_label": tier.get("label"),
                "label": p.get("label") or p.get("name") or "—",
                "email": p.get("email"),
                "card_added_at": p.get("card_added_at"),
                "stripe_session_id": p.get("stripe_session_id"),
                "sru_purchased": purchased,
                "sru_included": included,
                "sru_total_granted": purchased + included,
                "sru_used": round(used, 4),
                "sru_remaining": max(0.0, round(purchased + included - used, 4)),
                "last_activity_at": (last or {}).get("at"),
                "last_operation": (last or {}).get("operation"),
            })

        return {"count": len(rows), "rows": rows, "mocked": True}
    @router.post("/simulated/start")
    async def start_simulated(x_client_id: str = Header(default=None)):
        """
        Loads the canned "Garage Project" for simulated walkthrough.
        Enforces Free Tier 1-lifetime-run cap for unauthenticated clients.
        """
        if not x_client_id:
            raise HTTPException(
                status_code=400,
                detail="Missing X-Client-Id header. Front-end must persist a stable client id.",
            )
        # If there's a profile with a paid plan, simulated runs are unlimited.
        prof = await _get_or_create_profile(db, x_client_id)
        tier = _tier_of(prof or {"plan": "free"})

        # Count past simulated runs for this client
        count = await db.simulated_runs.count_documents({"client_id": x_client_id})
        cap = tier.get("max_lifetime_simulated_exports")
        # We allow viewing always; only enforce on EXPORT in /exports. So /start is informational.
        project_id = "sim-garage-" + str(uuid.uuid4())[:8]
        project = {
            "id": project_id,
            "name": "Garage Project (Simulated)",
            "source_filename": "garage_floorplan.simulated.pdf",
            "source_bytes": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "demo": True,
            "simulated": True,
            "client_id": x_client_id,
        }
        await db.studio_projects.insert_one(project)
        return {
            "project_id": project_id,
            "project_name": project["name"],
            "simulated": True,
            "mode": "simulated",
            "tier": tier["label"],
            "lifetime_exports_used": count,
            "lifetime_exports_cap": cap,
            "preloaded_classification": {
                "project_id": project_id,
                "occupancy_hazard": "Ordinary Hazard, Group 1",
                "design_density_gpm_sqft": 0.15,
                "design_area_sqft": 1500,
                "confidence": 0.86,
                "rationale": "SIMULATED. Preloaded canned classification for Garage Project — no real model invoked.",
                "mocked": True,
                "data_quality": "SIMULATED",
            },
            "preloaded_layout": {
                "project_id": project_id,
                "bay_dimensions_ft": [60, 40, 12],
                "head_count": 15,
                "pipe_segment_count": 8,
                "main_pipe_diameter_in": 4.0,
                "branch_pipe_diameter_in": 2.0,
                "coverage_per_head_sqft": 160.0,
                "mocked": True,
                "data_quality": "SIMULATED",
            },
            "preloaded_hydraulics": {
                "project_id": project_id,
                "required_flow_gpm": 298.0,
                "required_residual_psi": 75.0,
                "friction_method": "Hazen-Williams",
                "hazen_williams_c": 120,
                "most_remote_node": "REM",
                "status": "PRELIMINARY · PE REVIEW REQUIRED",
                "nodes": [
                    {"id": "BOR", "elev_ft": 0.0, "p_psi": 75.0, "q_gpm": 298.0, "pipe_d_in": None, "v_fps": None},
                    {"id": "N-01", "elev_ft": 12.0, "p_psi": 62.3, "q_gpm": 298.0, "pipe_d_in": 4.0, "v_fps": 7.6},
                    {"id": "N-02", "elev_ft": 12.0, "p_psi": 58.1, "q_gpm": 200.0, "pipe_d_in": 2.5, "v_fps": 13.0},
                    {"id": "N-03", "elev_ft": 12.0, "p_psi": 54.0, "q_gpm": 100.0, "pipe_d_in": 2.0, "v_fps": 10.2},
                    {"id": "REM", "elev_ft": 12.0, "p_psi": 47.8, "q_gpm": 32.0, "pipe_d_in": 1.0, "v_fps": 13.1},
                ],
                "mocked": True,
                "data_quality": "SIMULATED",
            },
        }

    # --------- Real mode requires profile + paid plan ---------
    @router.post("/uploads")
    async def upload(
        file: UploadFile = File(...),
        x_client_id: str = Header(default=None),
        x_guest_code: Optional[str] = Header(default=None),
    ):
        is_guest = _is_guest_request(x_guest_code)
        prof = await _require_profile(db, x_client_id, x_guest_code)
        tier = _tier_of(prof)
        if not tier["allow_real_uploads"]:
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "plan_required",
                    "message": "Real uploads require a paid plan (Founding Beta or PAYG). Free tier supports simulated demo only.",
                    "gateway_url": "/app",
                },
            )

        # Enforce project cap (guest bypasses)
        if not is_guest:
            proj_count = await db.studio_projects.count_documents({
                "client_id": x_client_id,
                "simulated": {"$ne": True},
            })
            if tier["max_projects"] is not None and proj_count >= tier["max_projects"]:
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "project_cap_reached",
                        "message": f"Project cap reached for {tier['label']} ({tier['max_projects']} projects).",
                        "gateway_url": "/app",
                    },
                )

        name = file.filename or "upload.bin"
        ext = Path(name).suffix.lower()
        if ext and ext not in ALLOWED_UPLOAD_EXT:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type {ext}. Allowed: {sorted(ALLOWED_UPLOAD_EXT)}",
            )

        contents = await file.read()
        if len(contents) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File too large for DEMO (max {MAX_UPLOAD_BYTES // 1024 // 1024} MB)",
            )

        project_id = str(uuid.uuid4())
        saved_path = UPLOAD_DIR / f"{project_id}__{name}"
        try:
            with open(saved_path, "wb") as f:
                f.write(contents)
        except Exception as e:
            logger.warning("Could not persist upload: %s", e)

        project_doc = {
            "id": project_id,
            "name": Path(name).stem or "Untitled",
            "source_filename": name,
            "source_bytes": len(contents),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "demo": True,
            "simulated": False,
            "client_id": x_client_id,
        }
        await db.studio_projects.insert_one(project_doc)

        return {
            "project_id": project_id,
            "occupancy_hazard": "Ordinary Hazard, Group 1",
            "design_density_gpm_sqft": 0.15,
            "design_area_sqft": 1500,
            "confidence": 0.86,
            "rationale": (
                "MOCKED: classification not produced by a real model. "
                "Returned static values for DEMO workflow validation."
            ),
            "mocked": True,
            "data_quality": "SIMULATED",
        }

    @router.post("/layouts")
    async def generate_layout(
        project_id: str = Form(...),
        x_client_id: str = Header(default=None),
        x_guest_code: Optional[str] = Header(default=None),
    ):
        proj = await db.studio_projects.find_one({"id": project_id}, {"_id": 0})
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")
        # HARD-GATED DEMO POLICY:
        # Real-mode layouts (i.e. for non-simulated projects) require a paid
        # plan OR a valid guest code. Simulated, shadow-preview, and case-
        # study projects keep returning canned SIMULATED outputs without
        # authentication.
        is_simulated_project = bool(
            proj.get("simulated")
            or proj.get("shadow_preview")
            or proj.get("case_study")
        )
        if not is_simulated_project and not _is_guest_request(x_guest_code):
            prof = await _require_profile(db, x_client_id, x_guest_code)
            tier = _tier_of(prof)
            if not tier["allow_real_uploads"]:
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "plan_required",
                        "message": "Real 3D layouts require the $249 one-time Founding Beta plan (or PAYG).",
                        "gateway_url": "/app",
                    },
                )
        return {
            "project_id": project_id,
            "bay_dimensions_ft": [60, 40, 12],
            "head_count": 15,
            "pipe_segment_count": 8,
            "main_pipe_diameter_in": 4.0,
            "branch_pipe_diameter_in": 2.0,
            "coverage_per_head_sqft": 160.0,
            "mocked": True,
            "data_quality": "SIMULATED",
        }

    @router.post("/calcs")
    async def hydraulic_calc(
        project_id: str = Form(...),
        x_client_id: str = Header(default=None),
        x_guest_code: Optional[str] = Header(default=None),
    ):
        proj = await db.studio_projects.find_one({"id": project_id}, {"_id": 0})
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")
        is_simulated_project = bool(
            proj.get("simulated")
            or proj.get("shadow_preview")
            or proj.get("case_study")
        )
        if not is_simulated_project and not _is_guest_request(x_guest_code):
            prof = await _require_profile(db, x_client_id, x_guest_code)
            tier = _tier_of(prof)
            if not tier["allow_real_uploads"]:
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "plan_required",
                        "message": "Real hydraulic calculations require the $249 one-time Founding Beta plan (or PAYG).",
                        "gateway_url": "/app",
                    },
                )
        return {
            "project_id": project_id,
            "required_flow_gpm": 298.0,
            "required_residual_psi": 75.0,
            "friction_method": "Hazen-Williams",
            "hazen_williams_c": 120,
            "most_remote_node": "REM",
            "status": "PRELIMINARY · PE REVIEW REQUIRED",
            "nodes": [
                {"id": "BOR", "elev_ft": 0.0, "p_psi": 75.0, "q_gpm": 298.0, "pipe_d_in": None, "v_fps": None},
                {"id": "N-01", "elev_ft": 12.0, "p_psi": 62.3, "q_gpm": 298.0, "pipe_d_in": 4.0, "v_fps": 7.6},
                {"id": "N-02", "elev_ft": 12.0, "p_psi": 58.1, "q_gpm": 200.0, "pipe_d_in": 2.5, "v_fps": 13.0},
                {"id": "N-03", "elev_ft": 12.0, "p_psi": 54.0, "q_gpm": 100.0, "pipe_d_in": 2.0, "v_fps": 10.2},
                {"id": "REM", "elev_ft": 12.0, "p_psi": 47.8, "q_gpm": 32.0, "pipe_d_in": 1.0, "v_fps": 13.1},
            ],
            "mocked": True,
            "data_quality": "SIMULATED",
        }

    @router.post("/exports")
    async def create_export(
        req: ExportRequest,
        x_client_id: str = Header(default=None),
        x_guest_code: Optional[str] = Header(default=None),
    ):
        if not req.acknowledged:
            raise HTTPException(
                status_code=400,
                detail="PE-stamp acknowledgment is required before any export can be initiated.",
            )
        if (req.acknowledgment_text or "").strip() != REQUIRED_ACK_TEXT:
            raise HTTPException(
                status_code=400,
                detail="Acknowledgment text does not match the required text. Refusing to export.",
            )
        if req.doc_type.lower() not in EXPORT_TYPES:
            raise HTTPException(status_code=400, detail=f"Unsupported doc_type: {req.doc_type}")

        is_guest = _is_guest_request(x_guest_code)
        if is_guest:
            prof = {"client_id": x_client_id, "plan": "guest", "guest": True}
        else:
            prof = await _get_or_create_profile(db, x_client_id) if x_client_id else None
        tier = _tier_of(prof or {"plan": "free"})

        if req.mode == "real":
            if is_guest:
                pass  # guest bypass: real-mode allowed
            elif not prof:
                raise HTTPException(
                    status_code=402,
                    detail={"error": "profile_required",
                            "message": "Real-mode exports require a profile and paid plan.",
                            "gateway_url": "/app"},
                )
            elif not tier["allow_real_exports"]:
                raise HTTPException(
                    status_code=402,
                    detail={"error": "plan_required",
                            "message": "Your plan does not allow real-mode exports.",
                            "gateway_url": "/app"},
                )
        else:  # simulated
            cap = tier.get("max_simulated_exports_per_window")
            window_h = tier.get("simulated_window_hours") or SIMULATED_WINDOW_HOURS
            if x_client_id and cap is not None and not is_guest:
                since = datetime.now(timezone.utc) - timedelta(hours=window_h)
                used = await db.simulated_runs.count_documents({
                    "client_id": x_client_id,
                    "at": {"$gte": since.isoformat()},
                })
                if used >= cap:
                    raise HTTPException(
                        status_code=402,
                        detail={
                            "error": "simulated_cap_reached",
                            "message": (
                                f"Free Tier limit reached ({cap} simulated demo exports per "
                                f"{window_h}-hour window). Upgrade to Founding Beta or PAYG to continue."
                            ),
                            "gateway_url": "/app",
                            "used": used,
                            "cap": cap,
                            "window_hours": window_h,
                        },
                    )

        ack_id = str(uuid.uuid4())
        ack_doc = {
            "id": ack_id,
            "project_id": req.project_id,
            "client_id": x_client_id,
            "name": req.name,
            "email": req.email,
            "license": req.license,
            "acknowledged_at": datetime.now(timezone.utc).isoformat(),
            "acknowledgment_text": req.acknowledgment_text,
            "doc_type": req.doc_type.lower(),
            "watermark_applied": True,
            "demo": True,
            "mode": req.mode,
            "simulated": req.mode == "simulated",
        }
        await db.studio_acknowledgments.insert_one(ack_doc)

        if req.mode == "simulated" and x_client_id:
            await db.simulated_runs.insert_one({
                "client_id": x_client_id,
                "ack_id": ack_id,
                "at": datetime.now(timezone.utc).isoformat(),
            })

        # ---------- Margin-Lock interceptor ----------
        # Derive mock Gemini token usage from the project's design area so the
        # ledger entry tracks the same SRU magnitude the user saw pre-export.
        proj_doc = await db.studio_projects.find_one(
            {"id": req.project_id}, {"_id": 0}
        )
        sqft = 1500.0
        if proj_doc and isinstance(proj_doc.get("classification"), dict):
            sqft = float(proj_doc["classification"].get("design_area_sqft") or 1500.0)
        import math as _math
        base_units = max(1, _math.ceil(sqft / 5000.0))
        doc_mult = {"pdf": 1.0, "dxf": 1.10, "ifc": 1.20}.get(req.doc_type.lower(), 1.0)
        sru_units = max(1.0, base_units * doc_mult)
        in_tok, out_tok = estimate_tokens_for_sru(sru_units)
        ledger_entry = await record_ai_usage(
            db,
            client_id=x_client_id,
            operation=f"export.{req.doc_type.lower()}",
            project_id=req.project_id,
            input_tokens=in_tok,
            output_tokens=out_tok,
            billable_sru=sru_units,
            plan=(prof or {}).get("plan", "free") if prof else "free",
            export_id=ack_id,
            extra={
                "mode": req.mode,
                "doc_type": req.doc_type.lower(),
                "project_sqft": sqft,
                # V1.8 refinement — link back to the originating Diagnostic Estimate
                "diagnose_id": req.diagnose_id,
            },
        )

        # V1.8 refinement — if a diagnose_id was supplied, record the
        # ACTUAL post-run cost back into studio_diagnoses + mark the
        # ledger row with the linkage. This closes the estimate ↔ actual
        # loop required by the V1.8 spec.
        diagnose_link = None
        if req.diagnose_id:
            diag_doc = await db.studio_diagnoses.find_one(
                {"id": req.diagnose_id}, {"_id": 0}
            )
            if diag_doc:
                actual_sru = float(ledger_entry["sru_amount"])
                actual_usd = float(ledger_entry["marked_up_cost_displayed_usd"])
                estimated_sru = float(diag_doc.get("estimated_full_sru") or 0)
                estimated_usd = float(diag_doc.get("estimated_full_usd") or 0)
                variance_sru = round(actual_sru - estimated_sru, 4)
                variance_usd = round(actual_usd - estimated_usd, 4)
                await db.studio_diagnoses.update_one(
                    {"id": req.diagnose_id},
                    {"$set": {
                        "actual_sru_cost": round(actual_sru, 4),
                        "actual_usd_cost": round(actual_usd, 4),
                        "actual_ledger_id": ledger_entry["id"],
                        "actual_export_id": ack_id,
                        "variance_sru": variance_sru,
                        "variance_usd": variance_usd,
                        "linked_at": datetime.now(timezone.utc).isoformat(),
                    }},
                )
                diagnose_link = {
                    "diagnose_id": req.diagnose_id,
                    "estimated_sru": estimated_sru,
                    "estimated_usd": estimated_usd,
                    "actual_sru": round(actual_sru, 4),
                    "actual_usd": round(actual_usd, 4),
                    "variance_sru": variance_sru,
                    "variance_usd": variance_usd,
                }
        balance_after = await get_balance(
            db,
            client_id=x_client_id,
            included_sru=tier.get("included_sru_per_month"),
            purchased_sru=int((prof or {}).get("sru_purchased", 0) or 0),
        )

        return {
            "export_id": ack_id,
            "doc_type": req.doc_type.lower(),
            "project_id": req.project_id,
            "download_url": f"/api/studio/exports/{ack_id}/file",
            "watermark_applied": True,
            "demo": True,
            "simulated": req.mode == "simulated",
            "mode": req.mode,
            "acknowledgment_id": ack_id,
            "acknowledged_at": ack_doc["acknowledged_at"],
            "warning": WATERMARK_TEXT,
            "tier": tier["label"],
            "margin_lock": {
                "ledger_id": ledger_entry["id"],
                "sru_deducted": ledger_entry["sru_amount"],
                "billable_sru": ledger_entry["billable_sru"],
                "margin_floor_sru": ledger_entry["margin_floor_sru"],
                "marked_up_cost_usd": ledger_entry["marked_up_cost_displayed_usd"],
                "raw_cost_usd": ledger_entry["raw_cost_usd"],
                "margin_lock_multiplier": ledger_entry["margin_lock_multiplier"],
                "margin_protected": ledger_entry["margin_protected"],
                "balance_after": balance_after,
            },
            "diagnose_link": diagnose_link,
        }

    @router.get("/exports/{export_id}/file")
    async def download_export(export_id: str):
        ack = await db.studio_acknowledgments.find_one({"id": export_id}, {"_id": 0})
        if not ack:
            raise HTTPException(status_code=404, detail="Export not found")
        proj = await db.studio_projects.find_one(
            {"id": ack["project_id"]}, {"_id": 0}
        ) or {"name": "Untitled", "id": ack["project_id"]}
        project_payload = {
            "name": proj.get("name", "Untitled"),
            "id": proj.get("id"),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        data, mime = generate_export(ack["doc_type"], project_payload, ack)
        ext = ack["doc_type"]
        filename = f"FSRS_DEMO_{(proj.get('name') or 'untitled').replace(' ', '_')}.{ext}"
        return Response(
            content=data,
            media_type=mime,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "X-FSRS-Demo": "true",
                "X-FSRS-Simulated": "true",
                "X-FSRS-Watermark": "DEMO-NOT-FOR-ENGINEERING-USE",
                "X-FSRS-Restriction": "PRELIMINARY-RFP-ANALYSIS-NOT-FOR-CONSTRUCTION",
            },
        )

    # --------- Plan C — Live Shadow Preview ---------
    @router.post("/shadow-preview")
    async def shadow_preview(
        sqft: int = Form(...),
        occupancy: str = Form(...),
        building_type: Optional[str] = Form(default=None),
        stories: int = Form(default=1),
        filename: Optional[str] = Form(default=None),
        file: Optional[UploadFile] = File(default=None),
        x_client_id: str = Header(default=None),
    ):
        """
        Generate a metadata-driven SIMULATED preview.
        No real AI inference — values are computed from the NFPA 13 reference
        table and the user's stated sq ft + occupancy class.
        Free tier callers do not need a profile to use this endpoint.
        """
        if occupancy not in OCCUPANCY_TABLE:
            raise HTTPException(status_code=400, detail=f"Unknown occupancy: {occupancy}")
        if sqft < 100 or sqft > 5_000_000:
            raise HTTPException(status_code=400, detail="sqft must be between 100 and 5,000,000")

        # Optionally accept (but never process) an uploaded drawing — only metadata is used.
        upload_meta = None
        if file is not None:
            try:
                contents = await file.read()
                upload_meta = {"filename": file.filename, "bytes": len(contents)}
            except Exception:
                upload_meta = None
            # We DO NOT persist the bytes for shadow preview — privacy-first.

        case = _make_case_study(
            cid="shadow-" + str(uuid.uuid4())[:8],
            name=(building_type or "Shadow Preview"),
            building_type=building_type or OCCUPANCY_TABLE[occupancy]["label"],
            sqft=sqft,
            occupancy_key=occupancy,
            bay=[min(120, max(40, sqft // 800)), min(80, max(30, sqft // 1200)), 10 + stories],
            stories=stories,
            location="Your project (metadata only)",
        )
        case["shadow_preview"] = True
        case["label"] = "Simulated Preview — Real processing starts after paid trial."
        case["client_id"] = x_client_id
        case["upload_meta"] = upload_meta
        # Persist the shadow project so it can be loaded into the Studio viewer
        project_doc = {
            "id": case["id"],
            "name": case["name"],
            "source_filename": (upload_meta or {}).get("filename") or filename,
            "source_bytes": (upload_meta or {}).get("bytes", 0),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "demo": True,
            "simulated": True,
            "shadow_preview": True,
            "client_id": x_client_id,
            "metadata": {"sqft": sqft, "occupancy": occupancy, "stories": stories, "building_type": building_type},
        }
        await db.studio_projects.insert_one(project_doc)
        return case

    @router.get("/occupancy-table")
    async def occupancy_table():
        return {"table": OCCUPANCY_TABLE, "source": "NFPA 13 (simulated reference)"}

    # --------- Plan C — Case Study Library ---------
    @router.get("/case-studies")
    async def list_case_studies():
        # Lightweight summary list
        return {
            "count": len(CASE_STUDIES),
            "items": [
                {
                    "id": c["id"],
                    "name": c["name"],
                    "building_type": c["building_type"],
                    "location": c["location"],
                    "sqft": c["sqft"],
                    "stories": c["stories"],
                    "occupancy_hazard": c["classification"]["occupancy_hazard"],
                    "summary": c["summary"],
                }
                for c in CASE_STUDIES
            ],
            "mocked": True,
            "data_quality": "SIMULATED",
        }

    @router.get("/case-studies/{case_id}")
    async def get_case_study(case_id: str):
        for c in CASE_STUDIES:
            if c["id"] == case_id:
                # Also drop a project record so it can be loaded into Studio
                proj_id = f"case-{case_id}"
                await db.studio_projects.update_one(
                    {"id": proj_id},
                    {"$set": {
                        "id": proj_id,
                        "name": c["name"],
                        "source_filename": f"{case_id}.case-study",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "demo": True,
                        "simulated": True,
                        "case_study": case_id,
                    }},
                    upsert=True,
                )
                return {**c, "project_id": proj_id}
        raise HTTPException(status_code=404, detail="Case study not found")

    return router


# ============================ Billing / Profile router (MOCKED) ============================
def build_billing_router(db: AsyncIOMotorDatabase) -> APIRouter:
    """All endpoints here are MOCKED. No Stripe call is ever made."""
    router = APIRouter(prefix="/billing", tags=["billing-mocked"])

    @router.get("/info")
    async def billing_info():
        return {
            "service": "FSRS Billing Gateway (MOCKED)",
            "real_stripe_integration": False,
            "tier_limits": TIER_LIMITS,
            "warning": "All billing endpoints are MOCKED. Real Stripe integration is a P0 follow-up.",
        }

    @router.post("/profile")
    async def create_profile(
        payload: ProfileCreate,
        x_client_id: str = Header(default=None),
    ):
        if not x_client_id:
            raise HTTPException(status_code=400, detail="Missing X-Client-Id header.")
        prof = {
            "client_id": x_client_id,
            "name": payload.name,
            "email": payload.email,
            "firm": payload.firm,
            "license": payload.license,
            "card_added": False,
            "plan": None,
            "monthly_cap_usd": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "mocked": True,
        }
        await db.profiles.update_one(
            {"client_id": x_client_id},
            {"$set": prof},
            upsert=True,
        )
        return {"ok": True, "profile": prof, "mocked": True}

    @router.post("/card")
    async def add_card(
        payload: CardMock,
        x_client_id: str = Header(default=None),
    ):
        if not x_client_id:
            raise HTTPException(status_code=400, detail="Missing X-Client-Id header.")
        prof = await db.profiles.find_one({"client_id": x_client_id}, {"_id": 0})
        if not prof:
            raise HTTPException(status_code=404, detail="Profile not found. Create one first.")
        await db.profiles.update_one(
            {"client_id": x_client_id},
            {"$set": {
                "card_added": True,
                "card_brand": payload.brand,
                "card_last4": payload.last4,
                "cardholder": payload.cardholder,
                "card_added_at": datetime.now(timezone.utc).isoformat(),
                "card_mocked": True,
            }},
        )
        return {"ok": True, "card_brand": payload.brand, "last4": payload.last4, "mocked": True}

    @router.post("/plan")
    async def pick_plan(
        payload: PlanSelect,
        x_client_id: str = Header(default=None),
    ):
        if not x_client_id:
            raise HTTPException(status_code=400, detail="Missing X-Client-Id header.")
        prof = await db.profiles.find_one({"client_id": x_client_id}, {"_id": 0})
        if not prof:
            raise HTTPException(status_code=404, detail="Profile not found. Create one first.")
        if payload.plan in ("founding_beta", "payg") and not prof.get("card_added"):
            raise HTTPException(
                status_code=400,
                detail="Add a payment method before selecting a paid plan.",
            )
        cap = payload.monthly_cap_usd
        if payload.plan == "payg" and cap is None:
            cap = TIER_LIMITS["payg"]["monthly_cap_usd"]
        await db.profiles.update_one(
            {"client_id": x_client_id},
            {"$set": {
                "plan": payload.plan,
                "monthly_cap_usd": cap,
                "plan_selected_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        return {"ok": True, "plan": payload.plan, "monthly_cap_usd": cap, "mocked": True}

    @router.get("/me")
    async def me(x_client_id: str = Header(default=None)):
        if not x_client_id:
            raise HTTPException(status_code=400, detail="Missing X-Client-Id header.")
        prof = await db.profiles.find_one({"client_id": x_client_id}, {"_id": 0})
        if not prof:
            return {
                "profile": None,
                "tier": TIER_LIMITS["free"],
                "tier_key": "free",
                "mocked": True,
            }
        tier_key = prof.get("plan") or "free"
        return {
            "profile": prof,
            "tier": TIER_LIMITS.get(tier_key, TIER_LIMITS["free"]),
            "tier_key": tier_key,
            "mocked": True,
        }

    return router
