"""Integration tests for Alert Lifecycle and Audit Events.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_alert_generation_and_status_update():
    # 1. Trigger severe anomaly to generate alert
    anomaly_payload = {
        "device_id": "test-host-beta",
        "timestamp": "2026-10-17T12:10:00Z",
        "cpu_percent": 96.0,
        "memory_percent": 89.0,
        "memory_used_mb": 14000.0,
        "process_count": 280,
        "connection_count": 220,
        "bytes_sent": 80_000_000.0,
        "bytes_received": 1_000_000.0,
        "top_processes": [
            {"pid": 7777, "name": "suspicious_process.exe", "cpu_percent": 90.0, "memory_percent": 12.0}
        ],
        "new_process_count": 18,
        "unique_remote_ips_count": 85,
        "new_remote_ips": ["203.0.113.55"],
        "local_ip": "192.168.1.101",
    }
    res_ingest = client.post("/api/v1/telemetry", json=anomaly_payload)
    assert res_ingest.status_code == 201

    # 2. Query alerts
    res_alerts = client.get("/api/v1/alerts?device_id=test-host-beta")
    assert res_alerts.status_code == 200
    alerts = res_alerts.json()
    assert len(alerts) >= 1
    alert = alerts[0]
    alert_id = alert["id"]
    assert alert["status"] == "open"
    assert alert["severity"] in ("High", "Critical")

    # 3. Patch alert status to 'investigating'
    res_patch = client.patch(
        f"/api/v1/alerts/{alert_id}",
        json={"status": "investigating", "actor": "security_engineer", "notes": "Triaging suspicious process"},
    )
    assert res_patch.status_code == 200
    updated_alert = res_patch.json()
    assert updated_alert["status"] == "investigating"

    # 4. Check audit log has entry
    res_audit = client.get("/api/v1/audit")
    assert res_audit.status_code == 200
    audits = res_audit.json()
    assert any(a["target_id"] == str(alert_id) for a in audits)
