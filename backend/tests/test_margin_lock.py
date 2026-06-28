"""FSRS V1.7 Margin-Lock & Wallet Protection backend tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fsr-studio.com").rstrip("/")
API = f"{BASE_URL}/api"

REQUIRED_ACK_TEXT = (
    "I understand FSRS provides preliminary analysis only. I will not "
    "submit any FSRS outputs as final deliverables without full PE "
    "review, modification, and stamping."
)


@pytest.fixture
def client_id():
    return f"TEST_{uuid.uuid4()}"


@pytest.fixture
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ----- /usage/config -----
class TestUsageConfig:
    def test_config_returns_all_four_knobs(self, session):
        r = session.get(f"{API}/studio/usage/config")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["gemini_input_rate_usd_per_1k"] == 0.000125
        assert d["gemini_output_rate_usd_per_1k"] == 0.000375
        assert d["margin_lock_multiplier"] == 1.2
        assert d["sru_usd_value"] == 25.0
        envs = d["configurable_via_env"]
        for name in ["GEMINI_INPUT_RATE_USD_PER_1K", "GEMINI_OUTPUT_RATE_USD_PER_1K", "MARGIN_LOCK_MULTIPLIER", "SRU_USD_VALUE"]:
            assert name in envs


# ----- /usage/estimate -----
class TestUsageEstimate:
    def test_estimate_shape(self, client_id):
        s = requests.Session()
        s.headers.update({"X-Client-Id": client_id})
        r = s.post(
            f"{API}/studio/usage/estimate",
            data={"area_sqft": 5000, "hazard": "ordinary_group_1", "doc_type": "pdf"},
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["estimated_sru"] == 1.0
        assert d["estimated_cost_usd"] == 25.0
        assert d["raw_cost_usd"] > 0
        assert d["margin_lock_multiplier"] == 1.2
        assert "margin_floor_sru" in d
        assert d["billable_sru"] == 1.0
        assert d["margin_protected"] is False
        assert "input" in d["tokens"] and "output" in d["tokens"]
        assert d["rates"]["sru_usd_value"] == 25.0
        assert "input_usd_per_1k" in d["rates"] and "output_usd_per_1k" in d["rates"]
        assert "tier_label" in d
        bal = d["balance"]
        for k in ["client_id", "included_sru", "sru_used", "sru_remaining", "overage_used", "unlimited"]:
            assert k in bal
        assert d["confirmation_required"] is True
        assert "Margin-Lock" in d["note"] and "20%" in d["note"]


# ----- /usage/balance -----
class TestUsageBalance:
    def test_balance_initial(self, client_id):
        s = requests.Session()
        s.headers.update({"X-Client-Id": client_id})
        r = s.get(f"{API}/studio/usage/balance")
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["tier_label", "included_sru", "sru_used", "sru_remaining", "overage_used", "unlimited"]:
            assert k in d
        assert d["sru_used"] == 0.0


# ----- /usage/ledger -----
class TestUsageLedger:
    def test_ledger_empty(self, client_id):
        s = requests.Session()
        s.headers.update({"X-Client-Id": client_id})
        r = s.get(f"{API}/studio/usage/ledger")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["client_id"] == client_id
        assert d["count"] == 0
        assert d["entries"] == []


# ----- End-to-end Margin-Lock flow -----
class TestMarginLockEndToEnd:
    def test_export_records_ledger_and_updates_balance(self, client_id):
        s = requests.Session()
        s.headers.update({"X-Client-Id": client_id})

        # (a) start sim project
        r = s.post(f"{API}/studio/simulated/start")
        assert r.status_code == 200, r.text
        proj_id = r.json()["project_id"]

        # initial balance
        r0 = s.get(f"{API}/studio/usage/balance").json()
        assert r0["sru_used"] == 0.0

        # (b) POST export
        payload = {
            "project_id": proj_id,
            "project_name": "Garage Project (Simulated)",
            "doc_type": "pdf",
            "acknowledged": True,
            "acknowledgment_text": REQUIRED_ACK_TEXT,
            "name": "Test PE",
            "email": "test@example.com",
            "license": "PE-12345",
            "mode": "simulated",
        }
        s.headers.update({"Content-Type": "application/json"})
        r = s.post(f"{API}/studio/exports", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        # (c) margin_lock block
        ml = d["margin_lock"]
        for k in ["ledger_id", "sru_deducted", "billable_sru", "margin_floor_sru",
                  "marked_up_cost_usd", "raw_cost_usd", "margin_lock_multiplier",
                  "margin_protected", "balance_after"]:
            assert k in ml, f"missing {k} in margin_lock"
        assert ml["margin_lock_multiplier"] == 1.2
        ledger_id = ml["ledger_id"]
        sru_deducted = ml["sru_deducted"]

        # (d) ledger has new entry
        s.headers.pop("Content-Type", None)
        r = s.get(f"{API}/studio/usage/ledger")
        assert r.status_code == 200
        d2 = r.json()
        assert d2["count"] >= 1
        e = d2["entries"][0]
        assert e["margin_locked"] is True
        assert e["ledger_version"] == "v1"
        assert e["sru_used_before"] == 0.0
        assert e["sru_used_after"] == sru_deducted
        assert e["id"] == ledger_id
        assert "_id" not in e

        # (e) balance updated
        r = s.get(f"{API}/studio/usage/balance")
        assert r.status_code == 200
        bal = r.json()
        assert bal["sru_used"] == sru_deducted
