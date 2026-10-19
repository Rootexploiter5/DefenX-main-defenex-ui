"""Feature Engineering module for DefenX Anomaly Detection.

Converts raw endpoint snapshots into normalized, delta-adjusted numeric feature vectors
suitable for Isolation Forest and heuristic rule analysis.
"""

from typing import Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np

BASE_FEATURES = [
    "cpu_percent",
    "memory_percent",
    "process_count",
    "connection_count",
    "bytes_sent_delta",
    "bytes_received_delta",
]

REQUIRED_RAW_FIELDS = {
    "timestamp",
    "cpu_percent",
    "memory_percent",
    "process_count",
    "connection_count",
    "bytes_sent",
    "bytes_received",
}


def build_features(df_or_path: Any) -> pd.DataFrame:
    """Builds clean feature dataframe from a CSV path or existing DataFrame."""
    if isinstance(df_or_path, str):
        data = pd.read_csv(df_or_path)
    elif isinstance(df_or_path, pd.DataFrame):
        data = df_or_path.copy()
    else:
        raise ValueError("Expected CSV path string or pandas DataFrame")

    missing = REQUIRED_RAW_FIELDS - set(data.columns)
    if missing:
        raise ValueError(f"Missing required raw columns: {sorted(missing)}")

    data["timestamp"] = pd.to_datetime(data["timestamp"], errors="coerce", utc=True)
    data = data.dropna(subset=["timestamp"]).sort_values("timestamp").reset_index(drop=True)

    numeric_cols = [
        "cpu_percent",
        "memory_percent",
        "process_count",
        "connection_count",
        "bytes_sent",
        "bytes_received",
    ]
    for col in numeric_cols:
        data[col] = pd.to_numeric(data[col], errors="coerce")

    # Compute network deltas
    data["bytes_sent_delta"] = data["bytes_sent"].diff()
    data["bytes_received_delta"] = data["bytes_received"].diff()

    # Network counter wrap or reboot protection
    data.loc[data["bytes_sent_delta"] < 0, "bytes_sent_delta"] = 0
    data.loc[data["bytes_received_delta"] < 0, "bytes_received_delta"] = 0

    # Drop the first row where deltas are NaN
    feature_df = data.dropna(subset=BASE_FEATURES).copy()
    feature_df[BASE_FEATURES] = feature_df[BASE_FEATURES].clip(lower=0)

    return feature_df


def extract_realtime_features(
    current_snapshot: Dict[str, Any],
    previous_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, float]:
    """Computes features for a single live snapshot given the previous snapshot.
    
    If previous snapshot is unavailable, network deltas default to 0.0.
    """
    bytes_sent = float(current_snapshot.get("bytes_sent", 0))
    bytes_recv = float(current_snapshot.get("bytes_received", 0))

    if previous_snapshot:
        prev_sent = float(previous_snapshot.get("bytes_sent", bytes_sent))
        prev_recv = float(previous_snapshot.get("bytes_received", bytes_recv))
        sent_delta = max(0.0, bytes_sent - prev_sent)
        recv_delta = max(0.0, bytes_recv - prev_recv)
    else:
        sent_delta = 0.0
        recv_delta = 0.0

    return {
        "cpu_percent": float(current_snapshot.get("cpu_percent", 0.0)),
        "memory_percent": float(current_snapshot.get("memory_percent", 0.0)),
        "process_count": float(current_snapshot.get("process_count", 0)),
        "connection_count": float(current_snapshot.get("connection_count", 0)),
        "bytes_sent_delta": sent_delta,
        "bytes_received_delta": recv_delta,
    }
