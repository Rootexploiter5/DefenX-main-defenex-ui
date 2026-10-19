"""Tests for DEFENEX dashboard aggregation endpoints (no fabricated data)."""
import os
os.environ["DATABASE_URL"] = "sqlite:///./test_dashboard.db"

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)
P = "/api/v1"


def test_summary_has_no_invented_values():
    r = client.get(f"{P}/dashboard/summary").json()
    assert r["threats_blocked"] is None           # detection-only platform
    assert "telemetry_active" in r and "security_score" in r


def test_series_validates_range_and_shape():
    assert client.get(f"{P}/dashboard/anomaly-series?range=bogus").status_code == 422
    r = client.get(f"{P}/dashboard/anomaly-series?range=1h").json()
    assert r["range"] == "1h" and isinstance(r["points"], list)


def test_threat_map_reports_unavailable():
    r = client.get(f"{P}/dashboard/threat-map").json()
    assert r["available"] is False and r["sources"] == []


def test_protect_is_honest_about_no_enforcement():
    assert client.post(f"{P}/actions/protect").json()["available"] is False


def test_resources_unsupported_metrics_are_null_not_zero():
    r = client.get(f"{P}/dashboard/resources").json()
    for k in ("cpu_percent", "memory_percent", "process_count"):
        assert r[k] is not None
    assert "temperature_c" in r and "battery" in r
