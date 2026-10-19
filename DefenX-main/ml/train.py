"""Model training module for DefenX Isolation Forest Anomaly Detector.
"""

import os
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

from ml.feature_engineering import BASE_FEATURES, build_features

DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "anomaly_model.joblib")


def generate_synthetic_baseline(num_samples: int = 500) -> pd.DataFrame:
    """Generates realistic normal baseline telemetry samples for training and cold-start.
    
    Represents typical desktop workstation activities: idle states, web browsing,
    word processing, and occasional compilation/media playback.
    """
    np.random.seed(42)
    timestamps = pd.date_range(end=datetime.now(timezone.utc), periods=num_samples, freq="5s")

    # Normal distribution for desktop workloads
    cpu = np.clip(np.random.normal(loc=14.0, scale=8.0, size=num_samples), 1.0, 55.0)
    # Memory percent stable with slow drifts
    memory = np.clip(np.random.normal(loc=48.0, scale=5.0, size=num_samples), 20.0, 75.0)
    # Process counts
    processes = np.clip(np.random.normal(loc=170, scale=12, size=num_samples), 110, 240).astype(int)
    # Connection counts
    connections = np.clip(np.random.normal(loc=35, scale=8, size=num_samples), 5, 80).astype(int)

    # Network deltas per 5s (normal: 5KB - 1.5MB per interval)
    sent_deltas = np.clip(np.random.exponential(scale=35_000, size=num_samples), 500, 3_000_000)
    recv_deltas = np.clip(np.random.exponential(scale=120_000, size=num_samples), 1_000, 8_000_000)

    # Accumulate bytes for raw simulation
    bytes_sent = np.cumsum(sent_deltas)
    bytes_recv = np.cumsum(recv_deltas)

    df = pd.DataFrame({
        "timestamp": timestamps.astype(str),
        "cpu_percent": cpu,
        "memory_percent": memory,
        "process_count": processes,
        "connection_count": connections,
        "bytes_sent": bytes_sent,
        "bytes_received": bytes_recv,
    })
    return df


def train_isolation_forest(
    data: pd.DataFrame,
    model_path: str = DEFAULT_MODEL_PATH,
    n_estimators: int = 200,
    contamination: Any = "auto",
    random_state: int = 42,
) -> Dict[str, Any]:
    """Fits an Isolation Forest on numeric baseline features and persists the model artifact."""
    if not all(feat in data.columns for feat in BASE_FEATURES):
        data = build_features(data)

    feature_data = data[BASE_FEATURES].apply(pd.to_numeric, errors="coerce").dropna()
    if len(feature_data) < 50:
        raise ValueError(f"Insufficient baseline samples: {len(feature_data)} (minimum 50 required)")

    model = IsolationForest(
        n_estimators=n_estimators,
        contamination=contamination,
        random_state=random_state,
        n_jobs=-1,
    )
    model.fit(feature_data)

    # Baseline statistics for contextual distance calculation
    means = feature_data.mean().to_dict()
    stds = feature_data.std().replace(0, 1.0).to_dict()

    artifact = {
        "model": model,
        "features": BASE_FEATURES,
        "model_version": "1.0.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "sample_count": len(feature_data),
        "feature_stats": {
            "means": means,
            "stds": stds,
        },
    }

    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(artifact, model_path)
    return artifact


if __name__ == "__main__":
    baseline_csv = "data/baseline/baseline_telemetry.csv"
    if os.path.exists(baseline_csv):
        raw_df = pd.read_csv(baseline_csv)
    else:
        print("No baseline CSV found. Generating representative baseline data...")
        raw_df = generate_synthetic_baseline(600)
        os.makedirs("data/baseline", exist_ok=True)
        raw_df.to_csv(baseline_csv, index=False)

    print(f"Training Isolation Forest on {len(raw_df)} samples...")
    saved_artifact = train_isolation_forest(raw_df, DEFAULT_MODEL_PATH)
    print(f"Model saved successfully to {DEFAULT_MODEL_PATH}")
    print(f"Model Version: {saved_artifact['model_version']}")
    print(f"Features used: {saved_artifact['features']}")
