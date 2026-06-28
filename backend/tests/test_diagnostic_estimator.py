"""V1.8 — Diagnostic Estimator backend regression tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://fsr-studio.com",
).rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture
def client_id():
    return f"DIAG_{uuid.uuid4()}"


def _diagnose(client_id, **fields):
    """POST /api/studio/diagnose with form fields. Returns the JSON response."""
    data = {
        "filename": "drawing.pdf",
        "file_bytes": "2400000",
        "occupancy": "oh1",
        "stories": "1",
        "doc_type": "pdf",
    }
    data.update({k: str(v) for k, v in fields.items()})
    r = requests.post(
        f"{API}/studio/diagnose",
        data=data,
        headers={"X-Client-Id": client_id},
    )
    return r


class TestDiagnoseEndpoint:
    def test_low_complexity_small_file(self, client_id):
        r = _diagnose(client_id, file_bytes=500_000, sqft=4000, occupancy="light")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["complexity"] == "LOW"
        assert d["mocked"] is True
        assert d["data_quality"] == "SIMULATED"
        assert d["confirmation_required"] is True
        assert d["estimated_full_sru"] >= 1.0
        # Diagnostic itself must be ≤ 0.30 SRU (Flash tier cap)
        assert d["diagnostic"]["sru"] <= 0.30
        assert d["diagnostic"]["max_allowed_sru"] == 0.30
        assert d["diagnostic"]["tier"] == "flash"

    def test_medium_complexity_returns_estimate(self, client_id):
        r = _diagnose(client_id, sqft=12_000, occupancy="oh2", stories=3)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["complexity"] in ("MEDIUM", "HIGH")
        # Full-run estimate should be meaningfully larger than diagnostic cost.
        assert d["estimated_full_sru"] > d["diagnostic"]["sru"] * 10
        assert d["estimated_full_cost_usd"] > 0

    def test_high_complexity_large_project(self, client_id):
        r = _diagnose(client_id, sqft=320_000, occupancy="eh1", stories=1, doc_type="ifc")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["complexity"] == "HIGH"
        assert d["estimated_full_sru"] > 6.0

    def test_rejects_unsupported_extension(self, client_id):
        r = _diagnose(client_id, filename="virus.exe")
        assert r.status_code == 400
        assert "Unsupported file type" in r.text

    def test_rejects_oversize_file(self, client_id):
        r = _diagnose(client_id, file_bytes=60 * 1024 * 1024)
        assert r.status_code == 413
        assert "max 50" in r.text.lower()

    def test_diagnostic_ledger_entry_appended(self, client_id):
        # Run diagnose then verify ledger picked up the diagnose.flash row.
        r = _diagnose(client_id, sqft=5000, occupancy="oh1")
        assert r.status_code == 200, r.text
        diag = r.json()
        assert diag["diagnostic"]["ledger_id"]

        led = requests.get(
            f"{API}/studio/usage/ledger",
            headers={"X-Client-Id": client_id},
        ).json()
        assert led["count"] >= 1
        rows = led["entries"]
        match = [
            e for e in rows
            if e.get("id") == diag["diagnostic"]["ledger_id"]
        ]
        assert match, "diagnose.flash ledger entry missing"
        row = match[0]
        assert row["operation"] == "diagnose.flash"
        assert row["plan"] == "flash"
        assert row["sru_amount"] <= 0.30  # < diagnostic cap

    def test_confirm_endpoint_marks_record(self, client_id):
        r = _diagnose(client_id)
        assert r.status_code == 200
        did = r.json()["diagnose_id"]

        c = requests.post(
            f"{API}/studio/diagnose/{did}/confirm",
            headers={"X-Client-Id": client_id},
        )
        assert c.status_code == 200, c.text
        body = c.json()
        assert body["diagnose_id"] == did
        assert body["confirmed"] is True

    def test_confirm_unknown_diagnose_id_returns_404(self, client_id):
        c = requests.post(
            f"{API}/studio/diagnose/does-not-exist/confirm",
            headers={"X-Client-Id": client_id},
        )
        assert c.status_code == 404


class TestUsageConfigExposesFlashRates:
    def test_config_includes_flash_keys(self):
        r = requests.get(f"{API}/studio/usage/config")
        assert r.status_code == 200, r.text
        d = r.json()
        assert "gemini_flash_input_rate_usd_per_1k" in d
        assert "gemini_flash_output_rate_usd_per_1k" in d
        assert d["diagnostic_max_sru"] == 0.30
        assert d["margin_lock_multiplier"] == 1.2  # V1.7 persistence
        assert d["sru_usd_value"] == 25.0  # V1.7 persistence


# ============================================================================
# V1.8 REFINEMENT — Mandatory diagnostic gate
# ============================================================================
REQUIRED_ACK_TEXT = (
    "I understand FSRS provides preliminary analysis only. I will not "
    "submit any FSRS outputs as final deliverables without full PE "
    "review, modification, and stamping."
)


class TestDiagnoseLedgerMirror:
    def test_ledger_row_mirrors_estimated_cost(self, client_id):
        r = _diagnose(client_id, sqft=8000, occupancy="oh1")
        assert r.status_code == 200
        diag = r.json()
        # Pull the ledger and locate the diagnose.flash entry
        led = requests.get(
            f"{API}/studio/usage/ledger",
            headers={"X-Client-Id": client_id},
        ).json()
        rows = [e for e in led["entries"]
                if e.get("id") == diag["diagnostic"]["ledger_id"]]
        assert rows, "diagnose.flash ledger row missing"
        extra = rows[0].get("extra") or {}
        # Estimate cost must be mirrored AND the diagnose_id captured
        assert extra.get("diagnose_id") == diag["diagnose_id"]
        assert abs(extra.get("estimated_sru_cost") - diag["estimated_full_sru"]) < 1e-6
        assert abs(extra.get("estimated_usd_cost") - diag["estimated_full_cost_usd"]) < 1e-2


class TestDiagnoseLinkedToExport:
    def test_export_with_diagnose_id_updates_studio_diagnoses(self, client_id):
        # 1. Run diagnose
        r = _diagnose(client_id, sqft=10_000, occupancy="oh2", stories=2)
        assert r.status_code == 200
        diag = r.json()
        diagnose_id = diag["diagnose_id"]

        # 2. Spin up a simulated project so the export has something to ack
        sim = requests.post(
            f"{API}/studio/simulated/start",
            headers={"X-Client-Id": client_id},
        )
        assert sim.status_code == 200, sim.text
        project_id = sim.json()["project_id"]

        # 3. Issue an export with diagnose_id linked
        exp = requests.post(
            f"{API}/studio/exports",
            json={
                "project_id": project_id,
                "project_name": "Test Project",
                "doc_type": "pdf",
                "acknowledged": True,
                "acknowledgment_text": REQUIRED_ACK_TEXT,
                "name": "Test User",
                "email": "qa@example.com",
                "mode": "simulated",
                "diagnose_id": diagnose_id,
            },
            headers={"X-Client-Id": client_id},
        )
        assert exp.status_code == 200, exp.text
        body = exp.json()

        # 4. Response must include diagnose_link with estimate ↔ actual
        link = body.get("diagnose_link")
        assert link is not None, "diagnose_link missing in export response"
        assert link["diagnose_id"] == diagnose_id
        assert link["estimated_sru"] == diag["estimated_full_sru"]
        assert link["estimated_usd"] == diag["estimated_full_cost_usd"]
        assert link["actual_sru"] > 0
        assert link["actual_usd"] > 0
        # variance fields populated (can be ±)
        assert "variance_sru" in link
        assert "variance_usd" in link

        # 5. Export ledger row carries the diagnose_id in extra
        led = requests.get(
            f"{API}/studio/usage/ledger",
            headers={"X-Client-Id": client_id},
        ).json()
        export_rows = [e for e in led["entries"]
                       if e.get("operation", "").startswith("export.")
                       and e.get("export_id") == body["export_id"]]
        assert export_rows, "Export ledger row not found"
        assert (export_rows[0].get("extra") or {}).get("diagnose_id") == diagnose_id

    def test_export_without_diagnose_id_still_works(self, client_id):
        """Backward compat: omitting diagnose_id must not break /exports."""
        sim = requests.post(
            f"{API}/studio/simulated/start",
            headers={"X-Client-Id": client_id},
        )
        project_id = sim.json()["project_id"]
        exp = requests.post(
            f"{API}/studio/exports",
            json={
                "project_id": project_id,
                "project_name": "Test Project",
                "doc_type": "pdf",
                "acknowledged": True,
                "acknowledgment_text": REQUIRED_ACK_TEXT,
                "name": "Test User",
                "email": "qa@example.com",
                "mode": "simulated",
            },
            headers={"X-Client-Id": client_id},
        )
        assert exp.status_code == 200, exp.text
        assert exp.json().get("diagnose_link") is None
