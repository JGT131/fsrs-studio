"""
FSRS Testimonials API.

Authenticity policy:
- Only testimonials that have BOTH `verified=True` AND `project_completed=True`
  are ever returned to the public landing page.
- New submissions are stored as pending (unverified) and require manual review
  before appearing on the public site.
- Until any verified+completed testimonials exist, the public list is empty
  and the frontend renders a motivating empty state. FSRS never displays
  fabricated social proof.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr, Field, ConfigDict

logger = logging.getLogger("fsrs.testimonials")

COLLECTION = "testimonials"
DEMO_FEEDBACK_COLLECTION = "demo_feedback"


class TestimonialSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    full_name: str = Field(..., min_length=2, max_length=120)
    title: str = Field(..., min_length=2, max_length=120)
    company: str = Field(..., min_length=2, max_length=160)
    email: EmailStr
    quote: str = Field(..., min_length=20, max_length=600)
    project_type: Optional[str] = Field(default=None, max_length=120)
    location: Optional[str] = Field(default=None, max_length=120)


class DemoFeedbackSubmission(BaseModel):
    """
    Low-friction feedback from anonymous Simulated Demo users.
    NO credit card, NO project completion required. These submissions are
    tagged 'Demo Experience' and stored in a separate private review queue.
    They MUST NOT be mixed with verified real-project testimonials.
    """
    model_config = ConfigDict(extra="ignore")
    name: str = Field(..., min_length=2, max_length=120)
    quote: str = Field(..., min_length=5, max_length=600)
    firm: Optional[str] = Field(default=None, max_length=160)


class TestimonialPublic(BaseModel):
    id: str
    full_name: str
    title: str
    company: str
    quote: str
    project_type: Optional[str] = None
    location: Optional[str] = None
    created_at: str


def build_testimonials_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/testimonials", tags=["testimonials"])

    @router.get("", response_model=List[TestimonialPublic])
    async def list_public_testimonials():
        """
        Return only verified testimonials from users who have completed at
        least one successful project. Newest first.
        """
        cursor = (
            db[COLLECTION]
            .find(
                {"verified": True, "project_completed": True, "hidden": {"$ne": True}},
                {"_id": 0, "email": 0, "verified": 0, "project_completed": 0, "hidden": 0},
            )
            .sort("created_at", -1)
        )
        items = await cursor.to_list(100)
        return items

    @router.post("/submit", response_model=dict)
    async def submit_testimonial(payload: TestimonialSubmission):
        """
        Accept a testimonial submission. Stored as pending; will not appear on
        the public site until verified by an FSRS admin AND the user has
        completed at least one successful project.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        doc = {
            "id": str(uuid.uuid4()),
            **payload.model_dump(),
            "verified": False,
            "project_completed": False,
            "hidden": False,
            "created_at": now_iso,
        }
        await db[COLLECTION].insert_one(doc)
        logger.info("Testimonial submission stored (pending): %s", doc["id"])
        return {
            "ok": True,
            "id": doc["id"],
            "status": "pending_review",
            "message": (
                "Thanks for sharing your FSRS story. Your submission is "
                "pending review and will only appear publicly after "
                "verification."
            ),
        }

    @router.post("/demo-feedback", response_model=dict)
    async def submit_demo_feedback(payload: DemoFeedbackSubmission):
        """
        Low-friction Demo Experience feedback. Stored in a SEPARATE
        collection ('demo_feedback') with label='Demo Experience' so it can
        never be confused with verified real-project testimonials. No
        credit card / project completion required.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        doc = {
            "id": str(uuid.uuid4()),
            **payload.model_dump(),
            "label": "Demo Experience",
            "kind": "demo_feedback",
            "approved_for_display": False,
            "hidden": False,
            "created_at": now_iso,
        }
        await db[DEMO_FEEDBACK_COLLECTION].insert_one(doc)
        logger.info("Demo feedback stored (private queue): %s", doc["id"])
        return {
            "ok": True,
            "id": doc["id"],
            "status": "private_review_queue",
            "label": "Demo Experience",
            "message": (
                "Thanks for the feedback on the FSRS Simulated Demo. This is "
                "filed under 'Demo Experience' and is reviewed separately "
                "from verified engineer testimonials."
            ),
        }

    return router
