import os
import stripe
import logging
from fastapi import APIRouter, HTTPException, Request, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# STRATEGY: Support both variable names for maximum reliability on cloud hosts
stripe_key = os.environ.get("STRIPE_API_KEY") or os.environ.get("STRIPE_SECRET_KEY")
stripe.api_key = stripe_key

if not stripe.api_key:
    logger.error("❌ CRITICAL: STRIPE_API_KEY or STRIPE_SECRET_KEY is missing from environment variables!")
else:
    # Log the first 7 characters to verify the key type (sk_test or sk_live) without exposing the secret
    masked_key = f"{stripe.api_key[:7]}..."
    logger.info(f"✅ Stripe Configured successfully. Key Prefix: {masked_key}")

class CheckoutSessionInput(BaseModel):
    package_id: str
    origin_url: str
    client_id: Optional[str] = None
    email: Optional[str] = None

def build_payments_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(tags=["payments-stripe"])

    @router.post("/api/payments/v1/checkout/session")
    async def create_checkout_session(payload: CheckoutSessionInput):
        # Fail early if Stripe isn't configured
        if not stripe.api_key:
            raise HTTPException(status_code=500, detail="Payments system unconfigured (Missing API Key)")

        try:
            amount = 24900 if payload.package_id == "founding_beta" else 39900
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'FSRS {payload.package_id.replace("_", " ").title()}',
                        },
                        'unit_amount': amount,
                        'recurring': {'interval': 'month'},
                    },
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{payload.origin_url.rstrip('/')}/payments/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{payload.origin_url.rstrip('/')}/pricing",
                metadata={
                    "package_id": payload.package_id,
                    "client_id": payload.client_id or "",
                }
            )
            return {"session_id": checkout_session.id, "checkout_url": checkout_session.url}
        except Exception as e:
            logger.error(f"Stripe Session Error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))

    return router
