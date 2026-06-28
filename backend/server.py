import os
import stripe
import logging
from pathlib import Path
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from fastapi import FastAPI, APIRouter, HTTPException, Request, Form, File, UploadFile, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv

# --- IMPORTS FROM LOCAL MODULES ---
from studio_routes import build_studio_router, build_billing_router
from testimonials_routes import build_testimonials_router
from payments_routes import build_payments_router
from free_sample_routes import build_free_sample_router
# from auth_routes import build_auth_router   # removed - module does not exist

# --- SETUP ---
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fsrs-production")

app = FastAPI(title="FSRS Production")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fsr-studio.com",
        "https://www.fsr-studio.com",
        "https://fsrs-production.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# --- DATABASE ---
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'fsrs')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# --- API ROUTES ---
api = APIRouter(prefix="/api")
api.include_router(build_studio_router(db))
api.include_router(build_billing_router(db))
api.include_router(build_testimonials_router(db))
api.include_router(build_payments_router(db))
api.include_router(build_free_sample_router(db))

app.include_router(api)

# --- FRONTEND SERVING ---
static_path = Path("/app/static")
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path / "static")), name="static")
    @app.get("/{full_path:path}")
    async def serve(full_path: str):
        if full_path.startswith("api"): return JSONResponse(status_code=404, content={"e": "API NOT FOUND"})
        f = static_path / full_path
        if f.is_file():
            return FileResponse(f)
        return FileResponse(static_path / "index.html")
else:
    logger.warning(f"Static path {static_path} not found!")

@app.on_event("shutdown")
async def shutdown():
    client.close()
