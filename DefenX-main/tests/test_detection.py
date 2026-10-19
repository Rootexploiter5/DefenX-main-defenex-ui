"""Unit tests for Anomaly Detection Engine and Risk Scoring.
"""

import pytest
from backend.services.detection import DetectionService
from backend.services.risk_scoring import calculate_risk_score
from ml.predict import AnomalyDetector


def test_anomaly_detector_loads():
    detector = AnomalyDetector()
    assert detector.is_ready()
    assert detector.version == "1.0.0"


def test_normal_telemetry_no_alert():
    service = DetectionService()
    normal_features = {
        "cpu_percent": 12.0,
        "memory_percent": 45.0,
        "process_count": 160.0,
        "connection_count": 25.0,
        "bytes_sent_delta": 15000.0,
        "bytes_received_delta": 45000.0,
    }
    raw_snap = {
        "device_id": "test-dev",
        "timestamp": "2026-10-17T12:00:00Z",
        "new_process_count": 0,
        "top_processes": [],
        "new_remote_ips": [],
    }
    alert = service.evaluate_telemetry(normal_features, raw_snap)
    assert alert is None or alert["severity"] in ("Informational", "Low")


def test_critical_anomaly_triggers_alert():
    service = DetectionService()
    # Simulated attack: 98% CPU + 45MB outbound data exfiltration
    attack_features = {
        "cpu_percent": 98.0,
        "memory_percent": 92.0,
        "process_count": 310.0,
        "connection_count": 180.0,
        "bytes_sent_delta": 45_000_000.0,
        "bytes_received_delta": 200_000.0,
    }
    raw_snap = {
        "device_id": "test-dev",
        "timestamp": "2026-10-17T12:05:00Z",
        "new_process_count": 22,
        "top_processes": [{"pid": 9999, "name": "miner.exe", "cpu_percent": 88.0, "memory_percent": 15.0}],
        "new_remote_ips": ["198.51.100.24"],
    }
    alert = service.evaluate_telemetry(attack_features, raw_snap)
    assert alert is not None
    assert alert["severity"] in ("High", "Critical")
    assert alert["risk_score"] >= 75.0
    assert "RULE_CPU_SPIKE" in alert["evidence_json"] or "RULE_DATA_EXFIL" in alert["evidence_json"]


def test_risk_scoring_bands():
    # Very high inputs -> Critical
    score, sev = calculate_risk_score(anomaly_component=0.95, rule_score=0.95, baseline_deviation_score=0.9)
    assert score >= 90.0
    assert sev == "Critical"

    # Minimal inputs -> Informational
    score_low, sev_low = calculate_risk_score(anomaly_component=0.05, rule_score=0.0, baseline_deviation_score=0.0)
    assert score_low < 25.0
    assert sev_low == "Informational"
