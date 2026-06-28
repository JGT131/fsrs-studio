"""
Plan I — Free Preliminary Hazard Scan (acquisition lead magnet).

Lifecycle:
1. Frontend hits /api/studio/diagnose to get the cheap-pass complexity
   estimate (already gated by the V1.8 Diagnostic Estimator).
2. If estimated_full_sru <= FREE_SAMPLE_MAX_SRU AND file_bytes <= 15 MB,
   the user is invited to claim the Free Sample by POSTing to
   /api/studio/free-sample/claim with their name/email/firm.
3. We enforce three hard limits server-side:
   - cap of 25 total claims (first 25 Iowa professionals)
   - one claim per email AND per firm (case-insensitive)
   - complexity ≤ 1.5 SRUs and file ≤ 15 MB

Every claim writes a `free_sample_claims` doc + a `free_sample.scheduled`
ledger entry (zero SRU) so the admin audit can see which test runs
correspond to free-sample acquisitions.
"""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr, Field

logger = logging.getLogger(__name__)

FREE_SAMPLE_CAP = int(os.environ.get("FSRS_FREE_SAMPLE_CAP", "25"))
FREE_SAMPLE_MAX_SRU = float(os.environ.get("FSRS_FREE_SAMPLE_MAX_SRU", "1.5"))
FREE_SAMPLE_MAX_BYTES = int(
    os.environ.get("FSRS_FREE_SAMPLE_MAX_BYTES", str(15 * 1024 * 1024))
)
FREE_SAMPLE_LOCATION = os.environ.get("FSRS_FREE_SAMPLE_LOCATION", "Iowa")
CLAIMS_COLLECTION = "free_sample_claims"


class FreeSampleClaimInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    firm: str = Field(min_length=2, max_length=160)
    diagnose_id: str = Field(min_length=8)
    notes: Optional[str] = Field(default=None, max_length=600)


def build_free_sample_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/studio/free-sample", tags=["free-sample"])

    async def _claimed_count() -> int:
        return await db[CLAIMS_COLLECTION].count_documents({})

    @router.get("/availability")
    async def availability():
        claimed = await _claimed_count()
        return {
            "cap": FREE_SAMPLE_CAP,
            "claimed": claimed,
            "remaining": max(0, FREE_SAMPLE_CAP - claimed),
            "location": FREE_SAMPLE_LOCATION,
            "max_sru": FREE_SAMPLE_MAX_SRU,
            "max_bytes": FREE_SAMPLE_MAX_BYTES,
            "max_mb": round(FREE_SAMPLE_MAX_BYTES / (1024 * 1024), 1),
        }

    @router.post("/claim")
    async def claim(payload: FreeSampleClaimInput):
        # --- 1. Cap check ---
        claimed = await _claimed_count()
        if claimed >= FREE_SAMPLE_CAP:
            raise HTTPException(
                status_code=409,
                detail={
                    "error": "cap_reached",
                    "message": (
                        f"Free Sample program is full — the first "
                        f"{FREE_SAMPLE_CAP} {FREE_SAMPLE_LOCATION} "
                        "professionals have already claimed their slot. "
                        "Please consider a paid Founding Beta plan."
                    ),
                },
            )

        # --- 2. Dedup by email + firm ---
        email_lc = payload.email.lower().strip()
        firm_lc = payload.firm.lower().strip()
        existing = await db[CLAIMS_COLLECTION].find_one(
            {"$or": [{"email_lc": email_lc}, {"firm_lc": firm_lc}]},
            {"_id": 0, "email_lc": 1, "firm_lc": 1, "claimed_at": 1},
        )
        if existing:
            field = "email" if existing.get("email_lc") == email_lc else "firm"
            raise HTTPException(
                status_code=409,
                detail={
                    "error": "already_claimed",
                    "message": (
                        f"This {field} has already claimed a Free Sample. "
                        "One sample per engineer / firm."
                    ),
                    "field": field,
                },
            )

        # --- 3. Validate diagnose_id + limits ---
        diag = await db.studio_diagnoses.find_one(
            {"id": payload.diagnose_id}, {"_id": 0}
        )
        if not diag:
            raise HTTPException(404, "Diagnose record not found.")

        estimated_sru = float(diag.get("estimated_full_sru") or 0)
        file_bytes = int(diag.get("file_bytes") or 0)

        if file_bytes > FREE_SAMPLE_MAX_BYTES:
            raise HTTPException(
                status_code=413,
                detail={
                    "error": "file_too_large",
                    "message": (
                        f"Project file is {file_bytes / 1024 / 1024:.1f} MB — "
                        f"exceeds the Free Sample {FREE_SAMPLE_MAX_BYTES // 1024 // 1024} MB limit."
                    ),
                    "limit_mb": FREE_SAMPLE_MAX_BYTES // 1024 // 1024,
                },
            )

        if estimated_sru > FREE_SAMPLE_MAX_SRU:
            raise HTTPException(
                status_code=409,
                detail={
                    "error": "over_complexity",
                    "message": (
                        f"This project is estimated at {estimated_sru:.2f} SRUs — "
                        f"exceeds the Free Sample {FREE_SAMPLE_MAX_SRU} SRU limit. "
                        "Please upgrade to a paid plan for the full analysis."
                    ),
                    "estimated_sru": estimated_sru,
                    "limit_sru": FREE_SAMPLE_MAX_SRU,
                },
            )

        # --- 4. Persist the claim ---
        claim_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        doc = {
            "id": claim_id,
            "name": payload.name.strip(),
            "email": payload.email,
            "email_lc": email_lc,
            "firm": payload.firm.strip(),
            "firm_lc": firm_lc,
            "notes": (payload.notes or "").strip() or None,
            "diagnose_id": payload.diagnose_id,
            "filename": diag.get("filename"),
            "file_bytes": file_bytes,
            "estimated_full_sru": estimated_sru,
            "estimated_full_usd": float(diag.get("estimated_full_usd") or 0),
            "claimed_at": now.isoformat(),
            "scheduled_email_at": now.replace(
                hour=15, minute=0, second=0, microsecond=0
            ).isoformat(),
            "status": "scheduled",
            "delivered": False,
            "location": FREE_SAMPLE_LOCATION,
            "mocked": True,
            "data_quality": "SIMULATED",
        }
        await db[CLAIMS_COLLECTION].insert_one(doc.copy())

        # Mark the originating studio_diagnoses doc as a free-sample claim
        # so the admin audit can see the linkage.
        await db.studio_diagnoses.update_one(
            {"id": payload.diagnose_id},
            {"$set": {
                "free_sample_claim_id": claim_id,
                "free_sample_claimed_at": now.isoformat(),
            }},
        )

        # Lightweight zero-cost ledger entry so the admin dashboard can
        # surface free-sample acquisitions without polluting the SRU sum.
        await db.usage_ledger.insert_one({
            "id": str(uuid.uuid4()),
            "at": now.isoformat(),
            "client_id": None,
            "plan": "free_sample",
            "operation": "free_sample.scheduled",
            "project_id": None,
            "export_id": None,
            "sru_amount": 0.0,
            "billable_sru": 0.0,
            "margin_floor_sru": 0.0,
            "raw_cost_usd": 0.0,
            "marked_up_cost_usd": 0.0,
            "marked_up_cost_displayed_usd": 0.0,
            "margin_lock_multiplier": 1.2,
            "margin_protected": False,
            "input_tokens": 0,
            "output_tokens": 0,
            "margin_locked": True,
            "ledger_version": "v1",
            "sru_used_before": 0.0,
            "sru_used_after": 0.0,
            "extra": {
                "free_sample_claim_id": claim_id,
                "email": payload.email,
                "firm": payload.firm.strip(),
                "diagnose_id": payload.diagnose_id,
                "estimated_full_sru": estimated_sru,
            },
        })

        remaining = max(0, FREE_SAMPLE_CAP - (claimed + 1))
        return {
            "claim_id": claim_id,
            "scheduled_email_at": doc["scheduled_email_at"],
            "remaining_after_claim": remaining,
            "estimated_full_sru": estimated_sru,
            "location": FREE_SAMPLE_LOCATION,
            "message": (
                "Free Sample scheduled. You will receive a 2–3 page "
                "watermarked report via email within 1–2 business days. "
                "PRELIMINARY · PE REVIEW REQUIRED."
            ),
        }

    return router
