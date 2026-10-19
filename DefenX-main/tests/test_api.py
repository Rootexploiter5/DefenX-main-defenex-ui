"""Integration tests for DefenX FastAPI endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "personal-device-security"


def test_telemetry_ingestion_and_query():
    sample_payload = {
        "device_id": "test-host-alpha",
        "timestamp": "2026-10-17T12:00:00Z",
        "cpu_percent": 18.5,
        "memory_percent": 42.1,
        "memory_used_mb": 6800.0,
        "process_count": 164,
        "connection_count": 28,
        "bytes_sent": 500000.0,
        "bytes_received": 1200000.0,
        "top_processes": [
            {"pid": 1234, "name": "chrome.exe", "cpu_percent": 5.2, "memory_percent": 3.1, "status": "running"}
        ],
        "new_process_count": 1,
        "unique_remote_ips_count": 12,
        "new_remote_ips": ["142.250.180.14"],
        "local_ip": "192.168.1.100",
    }

    # Ingest
    res = client.post("/api/v1/telemetry", json=sample_payload)
    assert res.status_code == 201
    ingest_data = res.json()
    assert ingest_data["status"] == "success"
    assert "telemetry_id" in ingest_data

    # Query Latest
    res_latest = client.get("/api/v1/telemetry/latest?device_id=test-host-alpha")
    assert res_latest.status_code == 200
    latest_data = res_latest.json()
    assert latest_data["device_id"] == "test-host-alpha"
    assert latest_data["cpu_percent"] == 18.5

    # Query History
    res_hist = client.get("/api/v1/telemetry/history?device_id=test-host-alpha&limit=10")
    assert res_hist.status_code == 200
    hist_data = res_hist.json()
    assert len(hist_data) >= 1

    # Check Device registered
    res_dev = client.get("/api/v1/devices")
    assert res_dev.status_code == 200
    devices = res_dev.json()
    assert any(d["id"] == "test-host-alpha" for d in devices)


def test_ai_status_endpoint():
    res = client.get("/api/v1/ai/status")
    assert res.status_code == 200
    data = res.json()
    assert "available" in data
    assert "models" in data
