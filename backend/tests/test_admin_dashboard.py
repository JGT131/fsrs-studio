"""V1.8 Admin Dashboard backend tests"""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fsr-studio.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_KEY = "FSRS-ADMIN-PREVIEW"
REQUIRED_ACK_TEXT = (
    "I understand FSRS provides preliminary analysis only. I will not "
    "submit any FSRS outputs as final deliverables without full PE "
    "review, modification, and stamping."
)


# ---- Admin auth gate ----
class TestAdminAuth:
    def test_dashboard_without_key_returns_403(self):
        r = requests.get(f"{API}/studio/admin/dashboard")
        assert r.status_code == 403
        detail = r.json().get("detail")
        assert isinstance(detail, dict)
        assert detail.get("error") == "admin_key_required"

    def test_dashboard_with_wrong_key_returns_403(self):
        r = requests.get(f"{API}/studio/admin/dashboard", headers={"X-Admin-Key": "WRONG"})
        assert r.status_code == 403

    def test_transactions_without_key_returns_403(self):
        r = requests.get(f"{API}/studio/admin/transactions?limit=50")
        assert r.status_code == 403


# ---- Admin dashboard payload structure ----
class TestAdminDashboard:
    def test_dashboard_structure(self):
        r = requests.get(f"{API}/studio/admin/dashboard", headers={"X-Admin-Key": ADMIN_KEY})
        assert r.status_code == 200
        data = r.json()
        assert data.get("demo") is True
        assert data.get("admin_preview") is True
        assert "generated_at" in data

        kpi = data["kpi"]
        for k in [
            "gross_revenue_usd", "ai_cost_usd", "estimated_fees_usd",
            "net_profit_usd", "gross_margin_pct", "margin_locked",
            "margin_lock_multiplier", "paying_customers", "exports_processed",
            "total_sru_charged", "total_marked_up_usd",
        ]:
            assert k in kpi, f"missing kpi.{k}"
        assert kpi["margin_lock_multiplier"] == 1.2

        stripe = data["stripe"]
        assert stripe["mode"] == "TEST MODE"
        assert stripe["currency"] == "USD"
        assert "next_payout_at" in stripe
        assert "next_payout_amount_usd" in stripe
        assert "fee_rate_pct" in stripe
        assert stripe["mocked"] is True

        rates = data["rates"]
        # 4 token-rate keys + configurable_via_env list
        for k in [
            "gemini_input_rate_usd_per_1k",
            "gemini_output_rate_usd_per_1k",
            "margin_lock_multiplier",
            "sru_usd_value",
            "configurable_via_env",
        ]:
            assert k in rates, f"missing rates.{k}"
        assert isinstance(rates["configurable_via_env"], list)


# ---- Admin transactions ----
class TestAdminTransactions:
    def test_transactions_basic(self):
        r = requests.get(f"{API}/studio/admin/transactions?limit=50",
                         headers={"X-Admin-Key": ADMIN_KEY})
        assert r.status_code == 200
        data = r.json()
        assert "count" in data
        assert "rows" in data
        assert data.get("mocked") is True
        for row in data["rows"]:
            assert "_id" not in row
            for k in [
                "id", "at", "client_id", "operation", "project_id",
                "project_name", "is_simulated", "plan", "raw_cost_usd",
                "marked_up_cost_usd", "sru_deducted", "margin_protected",
                "export_id",
            ]:
                assert k in row, f"missing row field {k}"


# ---- End-to-end: export creates new ledger row ----
class TestExportToLedger:
    def test_export_appears_in_admin_transactions(self):
        client_id = f"TEST_admin_{uuid.uuid4().hex[:8]}"
        # baseline count
        r0 = requests.get(f"{API}/studio/admin/transactions?limit=200",
                          headers={"X-Admin-Key": ADMIN_KEY})
        assert r0.status_code == 200
        baseline_count = r0.json().get("count", 0)

        # start simulated project
        rs = requests.post(f"{API}/studio/simulated/start",
                           headers={"X-Client-Id": client_id})
        assert rs.status_code == 200
        project_id = rs.json()["project_id"]

        # create export
        re_ = requests.post(
            f"{API}/studio/exports",
            json={
                "project_id": project_id,
                "project_name": "TEST_admin_dash",
                "doc_type": "pdf",
                "acknowledged": True,
                "acknowledgment_text": REQUIRED_ACK_TEXT,
                "name": "Tester",
                "email": "tester@example.com",
                "mode": "simulated",
            },
            headers={"X-Client-Id": client_id},
        )
        assert re_.status_code == 200, re_.text
        export_id = re_.json()["export_id"]

        # wait a moment for write
        time.sleep(1)
        r1 = requests.get(f"{API}/studio/admin/transactions?limit=200",
                          headers={"X-Admin-Key": ADMIN_KEY})
        assert r1.status_code == 200
        new_data = r1.json()
        assert new_data["count"] >= baseline_count + 1
        export_ids = [r.get("export_id") for r in new_data["rows"]]
        assert export_id in export_ids
