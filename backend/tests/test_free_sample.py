"""Plan I — Free Preliminary Hazard Scan backend tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://fsr-studio.com",
).rstrip("/")
API = f"{BASE_URL}/api"


def _diagnose(filename="small.pdf", file_bytes=800_000, sqft=3000,
              occupancy="light", stories=1, client_id=None):
    headers = {}
    if client_id:
        headers["X-Client-Id"] = client_id
    data = {
        "filename": filename,
        "file_bytes": str(file_bytes),
        "sqft": str(sqft),
        "occupancy": occupancy,
        "stories": str(stories),
        "doc_type": "pdf",
    }
    return requests.post(f"{API}/studio/diagnose", data=data, headers=headers)


def _unique_email(label):
    return f"qa_{label}_{uuid.uuid4().hex[:8]}@iowa.example.com"


def _unique_firm(label):
    return f"QA Firm {label} {uuid.uuid4().hex[:6]}"


class TestAvailability:
    def test_availability_returns_cap_and_remaining(self):
        r = requests.get(f"{API}/studio/free-sample/availability")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["cap"] == 25
        assert "remaining" in d
        assert d["max_mb"] == 15.0
        assert d["max_sru"] == 1.5
        assert d["location"] == "Iowa"


class TestClaimHappyPath:
    def test_claim_succeeds_for_qualifying_project(self):
        diag = _diagnose()
        assert diag.status_code == 200
        body = diag.json()
        assert body["estimated_full_sru"] <= 1.5

        claim = requests.post(
            f"{API}/studio/free-sample/claim",
            json={
                "name": "Jane Engineer",
                "email": _unique_email("happy"),
                "firm": _unique_firm("happy"),
                "diagnose_id": body["diagnose_id"],
            },
        )
        assert claim.status_code == 200, claim.text
        c = claim.json()
        assert c["claim_id"]
        assert c["scheduled_email_at"]
        assert c["estimated_full_sru"] == body["estimated_full_sru"]
        assert c["remaining_after_claim"] >= 0
        assert "1\u20132 business days" in c["message"]


class TestClaimGuards:
    def test_rejects_over_complexity(self):
        # Force a HIGH-complexity diagnose: large sqft + extra hazard.
        diag = _diagnose(
            filename="huge.pdf", file_bytes=2_000_000, sqft=320_000,
            occupancy="eh1", stories=4,
        )
        assert diag.status_code == 200
        body = diag.json()
        assert body["estimated_full_sru"] > 1.5  # sanity

        r = requests.post(
            f"{API}/studio/free-sample/claim",
            json={
                "name": "Bob Engineer",
                "email": _unique_email("over"),
                "firm": _unique_firm("over"),
                "diagnose_id": body["diagnose_id"],
            },
        )
        assert r.status_code == 409, r.text
        d = r.json()["detail"]
        assert d["error"] == "over_complexity"
        assert d["limit_sru"] == 1.5

    def test_rejects_oversize_file(self):
        # 16 MB → over the 15 MB cap.
        diag = _diagnose(file_bytes=16 * 1024 * 1024 + 1, sqft=2000)
        # Diagnose itself accepts up to 50 MB so it succeeds:
        assert diag.status_code == 200
        body = diag.json()

        r = requests.post(
            f"{API}/studio/free-sample/claim",
            json={
                "name": "Big File Engineer",
                "email": _unique_email("big"),
                "firm": _unique_firm("big"),
                "diagnose_id": body["diagnose_id"],
            },
        )
        assert r.status_code == 413, r.text
        assert r.json()["detail"]["error"] == "file_too_large"

    def test_dedupes_by_email(self):
        diag = _diagnose()
        body = diag.json()
        email = _unique_email("dedup_email")
        r1 = requests.post(
            f"{API}/studio/free-sample/claim",
            json={
                "name": "First Time",
                "email": email,
                "firm": _unique_firm("dedup_email_a"),
                "diagnose_id": body["diagnose_id"],
            },
        )
        assert r1.status_code == 200, r1.text

        diag2 = _diagnose(filename="other.pdf", file_bytes=400_000)
        r2 = requests.post(
            f"{API}/studio/free-sample/claim",
            json={
                "name": "Second Time",
                "email": email,
                "firm": _unique_firm("dedup_email_b"),
                "diagnose_id": diag2.json()["diagnose_id"],
            },
        )
        assert r2.status_code == 409, r2.text
        assert r2.json()["detail"]["error"] == "already_claimed"
        assert r2.json()["detail"]["field"] == "email"

    def test_dedupes_by_firm(self):
        diag = _diagnose()
        body = diag.json()
        firm = _unique_firm("dedup_firm")
        r1 = requests.post(
            f"{API}/studio/free-sample/claim",
            json={
                "name": "First Time",
                "email": _unique_email("dedup_firm_a"),
                "firm": firm,
                "diagnose_id": body["diagnose_id"],
            },
        )
        assert r1.status_code == 200, r1.text

        diag2 = _diagnose(filename="another.pdf", file_bytes=500_000)
        r2 = requests.post(
            f"{API}/studio/free-sample/claim",
            json={
                "name": "Second Time",
                "email": _unique_email("dedup_firm_b"),
                "firm": firm,
                "diagnose_id": diag2.json()["diagnose_id"],
            },
        )
        assert r2.status_code == 409, r2.text
        assert r2.json()["detail"]["field"] == "firm"

    def test_unknown_diagnose_id_returns_404(self):
        r = requests.post(
            f"{API}/studio/free-sample/claim",
            json={
                "name": "Ghost",
                "email": _unique_email("ghost"),
                "firm": _unique_firm("ghost"),
                "diagnose_id": "does-not-exist-123",
            },
        )
        assert r.status_code == 404
        assert "Diagnose record not found" in r.text
