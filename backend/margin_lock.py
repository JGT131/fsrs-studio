"""
FSRS Margin-Lock & Wallet Protection (V1.7)
============================================

Operating-safety layer that sits between every AI call and the user's
SRU balance. Three responsibilities:

1.  Configurable token rates (Gemini input/output) loaded from environment.
2.  Margin-Lock multiplier (default 1.20 = 20%) applied to every raw API cost
    so retail SRU value always exceeds vendor cost.
3.  Usage ledger — append-only audit log of every AI call with raw token
    counts, raw vendor cost, marked-up cost, SRU deduction, and post-call
    balance.

All math is deterministic + dependency-free so the same numbers can be
shown pre-export (estimate) and after-export (ledger entry).

Token rates are USD per 1,000 tokens. Override with env vars:
    GEMINI_INPUT_RATE_USD_PER_1K   (default 0.000125)
    GEMINI_OUTPUT_RATE_USD_PER_1K  (default 0.000375)
    MARGIN_LOCK_MULTIPLIER         (default 1.20)
    SRU_USD_VALUE                  (default 25.00)
"""

from __future__ import annotations

import math
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase


# ---------- Configurable rate config ------------------------------------------
def _f(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


GEMINI_INPUT_RATE_USD_PER_1K = _f("GEMINI_INPUT_RATE_USD_PER_1K", 0.000125)
GEMINI_OUTPUT_RATE_USD_PER_1K = _f("GEMINI_OUTPUT_RATE_USD_PER_1K", 0.000375)
MARGIN_LOCK_MULTIPLIER = _f("MARGIN_LOCK_MULTIPLIER", 1.20)
SRU_USD_VALUE = _f("SRU_USD_VALUE", 25.00)

# V1.8 — Diagnostic "cheap pass" rates (Gemini-Flash-tier).
# Roughly 10x cheaper than the full-resolution Pro pass.
GEMINI_FLASH_INPUT_RATE_USD_PER_1K = _f("GEMINI_FLASH_INPUT_RATE_USD_PER_1K", 0.0000125)
GEMINI_FLASH_OUTPUT_RATE_USD_PER_1K = _f("GEMINI_FLASH_OUTPUT_RATE_USD_PER_1K", 0.0000375)
DIAGNOSTIC_MAX_SRU = _f("DIAGNOSTIC_MAX_SRU", 0.30)


def current_rate_config() -> dict:
    """Expose the active rate configuration for /api/studio/usage/config + UI."""
    return {
        "gemini_input_rate_usd_per_1k": GEMINI_INPUT_RATE_USD_PER_1K,
        "gemini_output_rate_usd_per_1k": GEMINI_OUTPUT_RATE_USD_PER_1K,
        "gemini_flash_input_rate_usd_per_1k": GEMINI_FLASH_INPUT_RATE_USD_PER_1K,
        "gemini_flash_output_rate_usd_per_1k": GEMINI_FLASH_OUTPUT_RATE_USD_PER_1K,
        "diagnostic_max_sru": DIAGNOSTIC_MAX_SRU,
        "margin_lock_multiplier": MARGIN_LOCK_MULTIPLIER,
        "sru_usd_value": SRU_USD_VALUE,
        "configurable_via_env": [
            "GEMINI_INPUT_RATE_USD_PER_1K",
            "GEMINI_OUTPUT_RATE_USD_PER_1K",
            "GEMINI_FLASH_INPUT_RATE_USD_PER_1K",
            "GEMINI_FLASH_OUTPUT_RATE_USD_PER_1K",
            "DIAGNOSTIC_MAX_SRU",
            "MARGIN_LOCK_MULTIPLIER",
            "SRU_USD_VALUE",
        ],
    }


# ---------- V1.8 Diagnostic (cheap-pass) cost helper -------------------------
def compute_diagnostic_cost(input_tokens: int, output_tokens: int) -> dict:
    """
    Cheap-pass cost breakdown for the V1.8 Diagnostic Estimator.

    Uses the Flash-tier rates (~10x cheaper than Pro) and the same
    Margin-Lock multiplier so the SRU floor is enforced. The final SRU
    deduction is clamped to DIAGNOSTIC_MAX_SRU (default 0.30) — if the
    floor would exceed the cap the call is considered uneconomical and
    the cap is still applied (this protects the user's wallet on the
    pre-flight cheap pass).
    """
    in_tok = max(0, int(input_tokens or 0))
    out_tok = max(0, int(output_tokens or 0))

    raw_cost = (
        (in_tok / 1000.0) * GEMINI_FLASH_INPUT_RATE_USD_PER_1K
        + (out_tok / 1000.0) * GEMINI_FLASH_OUTPUT_RATE_USD_PER_1K
    )
    marked_up = raw_cost * MARGIN_LOCK_MULTIPLIER
    margin_floor_sru = marked_up / SRU_USD_VALUE if SRU_USD_VALUE > 0 else 0.0

    # The cheap pass is capped at DIAGNOSTIC_MAX_SRU regardless of floor.
    final_sru = min(DIAGNOSTIC_MAX_SRU, max(0.0001, margin_floor_sru))
    return {
        "tier": "flash",
        "input_tokens": in_tok,
        "output_tokens": out_tok,
        "input_rate_usd_per_1k": GEMINI_FLASH_INPUT_RATE_USD_PER_1K,
        "output_rate_usd_per_1k": GEMINI_FLASH_OUTPUT_RATE_USD_PER_1K,
        "raw_cost_usd": round(raw_cost, 8),
        "margin_lock_multiplier": MARGIN_LOCK_MULTIPLIER,
        "marked_up_cost_usd": round(marked_up, 8),
        "sru_usd_value": SRU_USD_VALUE,
        "margin_floor_sru": round(margin_floor_sru, 4),
        "billable_sru": round(final_sru, 4),
        "sru_amount": round(final_sru, 4),
        "marked_up_cost_displayed_usd": round(final_sru * SRU_USD_VALUE, 4),
        "diagnostic_max_sru": DIAGNOSTIC_MAX_SRU,
        "margin_protected": True,
    }


# ---------- Core math ---------------------------------------------------------
def compute_cost(input_tokens: int, output_tokens: int, billable_sru: float = 0.0) -> dict:
    """
    Convert a raw token usage tuple into the full Margin-Lock breakdown.

    Args:
        input_tokens / output_tokens — raw Gemini usage from the API response.
        billable_sru — the heuristic / planned customer charge in SRUs
            (from the area+hazard sizing rule). The actual deduction is
            max(billable_sru, margin_floor_sru) so the customer is ALWAYS
            charged at least the marked-up vendor cost.

    Returns:
        raw_cost_usd          — vendor (Gemini) cost
        marked_up_cost_usd    — raw × MARGIN_LOCK_MULTIPLIER
        margin_floor_sru      — marked_up / SRU_USD_VALUE (token-driven floor)
        billable_sru          — heuristic / quoted units
        sru_amount            — final deduction = max(billable, margin_floor)
        margin_protected      — True if the floor activated (cost was higher
                                than the heuristic SRU value)
    """
    in_tok = max(0, int(input_tokens or 0))
    out_tok = max(0, int(output_tokens or 0))

    raw_cost = (
        (in_tok / 1000.0) * GEMINI_INPUT_RATE_USD_PER_1K
        + (out_tok / 1000.0) * GEMINI_OUTPUT_RATE_USD_PER_1K
    )
    marked_up = raw_cost * MARGIN_LOCK_MULTIPLIER
    margin_floor_sru = marked_up / SRU_USD_VALUE if SRU_USD_VALUE > 0 else 0.0

    billable = max(0.0, float(billable_sru or 0.0))
    final_sru = max(billable, margin_floor_sru)
    floor_activated = margin_floor_sru > billable and billable > 0.0

    return {
        "input_tokens": in_tok,
        "output_tokens": out_tok,
        "input_rate_usd_per_1k": GEMINI_INPUT_RATE_USD_PER_1K,
        "output_rate_usd_per_1k": GEMINI_OUTPUT_RATE_USD_PER_1K,
        "raw_cost_usd": round(raw_cost, 6),
        "margin_lock_multiplier": MARGIN_LOCK_MULTIPLIER,
        "marked_up_cost_usd": round(marked_up, 6),
        "margin_usd": round(marked_up - raw_cost, 6),
        "sru_usd_value": SRU_USD_VALUE,
        "margin_floor_sru": round(margin_floor_sru, 4),
        "billable_sru": round(billable, 4),
        "sru_amount": round(final_sru, 4),
        "marked_up_cost_displayed_usd": round(final_sru * SRU_USD_VALUE, 2),
        "margin_protected": floor_activated,
    }


def estimate_tokens_for_sru(sru_units: float) -> tuple[int, int]:
    """
    Project realistic mocked Gemini token counts for a planned run.

    Based on empirical AI design-analysis ratios, each SRU corresponds to a
    project zone roughly the size of an ordinary-hazard 5,000 sf bay. A
    typical Gemini-3 prompt + response for that zone is in the 8K–12K
    input / 4K–6K output range. We scale linearly with sru_units so larger
    projects map to larger token usage.

    These counts are USED to validate the Margin-Lock floor only — i.e. to
    ensure raw vendor cost never exceeds (SRU value × N) ÷ multiplier. The
    actual customer charge is still driven by the heuristic SRU count.
    """
    if sru_units <= 0:
        return (0, 0)
    in_tok = int(10_000 * sru_units)
    out_tok = int(5_000 * sru_units)
    return in_tok, out_tok


# ---------- Ledger interceptor ------------------------------------------------
LEDGER_COLLECTION = "usage_ledger"


async def record_ai_usage(
    db: AsyncIOMotorDatabase,
    *,
    client_id: Optional[str],
    operation: str,
    project_id: Optional[str] = None,
    input_tokens: int = 0,
    output_tokens: int = 0,
    billable_sru: float = 0.0,
    plan: str = "free",
    export_id: Optional[str] = None,
    extra: Optional[dict] = None,
) -> dict:
    """
    The interceptor every AI-touching endpoint must call.

    Captures the cost breakdown, deducts the SRU amount from the user's
    balance (tracked via accumulated ledger entries), and writes an
    append-only ledger record.

    Returns the persisted ledger entry (JSON-safe, no _id).
    """
    breakdown = compute_cost(input_tokens, output_tokens, billable_sru=billable_sru)

    # Balance accounting — sum of all prior sru_amounts for this client_id.
    used_before = await _client_total_sru(db, client_id)

    entry = {
        "id": str(uuid.uuid4()),
        "at": datetime.now(timezone.utc).isoformat(),
        "client_id": client_id,
        "plan": plan,
        "operation": operation,
        "project_id": project_id,
        "export_id": export_id,
        # cost breakdown
        **breakdown,
        # balance audit
        "sru_used_before": round(used_before, 4),
        "sru_used_after": round(used_before + breakdown["sru_amount"], 4),
        "margin_locked": True,
        "ledger_version": "v1",
    }
    if extra:
        entry["extra"] = extra

    # _id is added by insert_one; we never echo it.
    await db[LEDGER_COLLECTION].insert_one(entry.copy())
    return entry


async def _client_total_sru(db: AsyncIOMotorDatabase, client_id: Optional[str]) -> float:
    if not client_id:
        return 0.0
    agg = await db[LEDGER_COLLECTION].aggregate([
        {"$match": {"client_id": client_id}},
        {"$group": {"_id": None, "sru": {"$sum": "$sru_amount"}}},
    ]).to_list(1)
    return float(agg[0]["sru"]) if agg else 0.0


async def get_balance(
    db: AsyncIOMotorDatabase,
    *,
    client_id: Optional[str],
    included_sru: Optional[int],
    purchased_sru: Optional[int] = 0,
) -> dict:
    """
    Returns a wallet-style balance snapshot for the current user.

    - included_sru is the plan's base SRU allowance (None = unlimited).
    - purchased_sru is the total amount granted via Stripe one-time top-ups
      (sum of all $249 / $99 / $399 / $1499 successful checkout sessions
      already credited to this client_id's profile).
    - used = total deducted from ledger.
    - remaining = max((included + purchased) - used, 0).
    - overage_used = used beyond (included + purchased).
    """
    used = await _client_total_sru(db, client_id)

    if included_sru is None:
        return {
            "client_id": client_id,
            "included_sru": None,
            "purchased_sru": int(purchased_sru or 0),
            "sru_used": round(used, 4),
            "sru_remaining": None,
            "overage_used": 0.0,
            "unlimited": True,
        }

    total_grant = float(included_sru) + float(purchased_sru or 0)
    remaining = max(0.0, total_grant - used)
    overage = max(0.0, used - total_grant)
    return {
        "client_id": client_id,
        "included_sru": included_sru,
        "purchased_sru": int(purchased_sru or 0),
        "sru_used": round(used, 4),
        "sru_remaining": round(remaining, 4),
        "overage_used": round(overage, 4),
        "unlimited": False,
    }


async def get_ledger(
    db: AsyncIOMotorDatabase,
    *,
    client_id: Optional[str],
    limit: int = 50,
) -> list[dict]:
    """Return latest ledger entries for this client, newest-first, _id excluded."""
    if not client_id:
        return []
    cursor = (
        db[LEDGER_COLLECTION]
        .find({"client_id": client_id}, {"_id": 0})
        .sort("at", -1)
        .limit(int(limit))
    )
    return await cursor.to_list(int(limit))
