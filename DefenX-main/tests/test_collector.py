"""Unit tests for Telemetry Collector and Feature Extraction.
"""

import pytest
from agent.collector import TelemetryCollector
from ml.feature_engineering import extract_realtime_features, build_features, BASE_FEATURES
import pandas as pd


def test_telemetry_snapshot_keys():
    collector = TelemetryCollector(device_id="test-device-01")
    snapshot = collector.collect_snapshot()

    required_keys = [
        "device_id",
        "timestamp",
        "cpu_percent",
        "memory_percent",
        "process_count",
        "connection_count",
        "bytes_sent",
        "bytes_received",
    ]
    for key in required_keys:
        assert key in snapshot, f"Missing key in snapshot: {key}"
        assert snapshot[key] is not None

    assert snapshot["device_id"] == "test-device-01"
    assert 0.0 <= snapshot["cpu_percent"] <= 100.0
    assert 0.0 <= snapshot["memory_percent"] <= 100.0
    assert snapshot["process_count"] >= 0


def test_realtime_feature_deltas():
    # First snapshot: no previous observation
    first_snap = {
        "cpu_percent": 15.0,
        "memory_percent": 45.0,
        "process_count": 150,
        "connection_count": 20,
        "bytes_sent": 1000,
        "bytes_received": 5000,
    }
    feats1 = extract_realtime_features(first_snap, None)
    assert feats1["bytes_sent_delta"] == 0.0
    assert feats1["bytes_received_delta"] == 0.0

    # Second snapshot: incremental delta
    second_snap = {
        "cpu_percent": 25.0,
        "memory_percent": 46.0,
        "process_count": 152,
        "connection_count": 22,
        "bytes_sent": 3500,
        "bytes_received": 12000,
    }
    feats2 = extract_realtime_features(second_snap, first_snap)
    assert feats2["bytes_sent_delta"] == 2500.0
    assert feats2["bytes_received_delta"] == 7000.0
    assert feats2["cpu_percent"] == 25.0

    # Third snapshot: counter reset/reboot (smaller bytes)
    reset_snap = {
        "cpu_percent": 10.0,
        "memory_percent": 40.0,
        "process_count": 140,
        "connection_count": 10,
        "bytes_sent": 500,  # Wrapped/reset below 3500
        "bytes_received": 1000,
    }
    feats3 = extract_realtime_features(reset_snap, second_snap)
    assert feats3["bytes_sent_delta"] == 0.0
    assert feats3["bytes_received_delta"] == 0.0
