"""Evaluation module for DefenX Anomaly Detection models.

Computes Precision, Recall, F1-score, False Positive Rate, and Latency
on labeled evaluation datasets (controlled test benchmarks).
"""

import time
from typing import Dict, Any, List
import numpy as np
import pandas as pd
from sklearn.metrics import precision_recall_fscore_support, confusion_matrix

from ml.predict import AnomalyDetector
from ml.feature_engineering import BASE_FEATURES


def generate_evaluation_benchmark(num_normal: int = 500, num_anomalous: int = 60) -> pd.DataFrame:
    """Generates synthetic benchmark test records with ground-truth labels."""
    np.random.seed(99)

    # 1. Normal records (label = 0)
    normal_cpu = np.clip(np.random.normal(15, 6, num_normal), 2, 50)
    normal_ram = np.clip(np.random.normal(50, 4, num_normal), 25, 70)
    normal_procs = np.clip(np.random.normal(165, 10, num_normal), 120, 220).astype(int)
    normal_conns = np.clip(np.random.normal(32, 6, num_normal), 8, 60).astype(int)
    normal_sent = np.clip(np.random.exponential(30000, num_normal), 500, 2000000)
    normal_recv = np.clip(np.random.exponential(100000, num_normal), 1000, 5000000)

    df_norm = pd.DataFrame({
        "cpu_percent": normal_cpu,
        "memory_percent": normal_ram,
        "process_count": normal_procs,
        "connection_count": normal_conns,
        "bytes_sent_delta": normal_sent,
        "bytes_received_delta": normal_recv,
        "is_anomaly_label": 0,
        "scenario": "normal_workload",
    })

    # 2. Anomalous records (label = 1): Data exfiltration, cryptomining/resource spike, port scanning
    # Scenario A: Exfiltration (Huge outbound network delta)
    exfil_cnt = num_anomalous // 3
    exfil_df = pd.DataFrame({
        "cpu_percent": np.random.uniform(25, 45, exfil_cnt),
        "memory_percent": np.random.uniform(55, 68, exfil_cnt),
        "process_count": np.random.uniform(170, 190, exfil_cnt).astype(int),
        "connection_count": np.random.uniform(40, 70, exfil_cnt).astype(int),
        "bytes_sent_delta": np.random.uniform(45_000_000, 120_000_000, exfil_cnt),
        "bytes_received_delta": np.random.uniform(100000, 500000, exfil_cnt),
        "is_anomaly_label": 1,
        "scenario": "data_exfiltration",
    })

    # Scenario B: High CPU spike / Cryptomining
    spike_cnt = num_anomalous // 3
    spike_df = pd.DataFrame({
        "cpu_percent": np.random.uniform(92, 100, spike_cnt),
        "memory_percent": np.random.uniform(85, 95, spike_cnt),
        "process_count": np.random.uniform(260, 320, spike_cnt).astype(int),
        "connection_count": np.random.uniform(25, 45, spike_cnt).astype(int),
        "bytes_sent_delta": np.random.uniform(10000, 80000, spike_cnt),
        "bytes_received_delta": np.random.uniform(20000, 150000, spike_cnt),
        "is_anomaly_label": 1,
        "scenario": "cryptomining_resource_spike",
    })

    # Scenario C: Port scan / Connection surge
    scan_cnt = num_anomalous - exfil_cnt - spike_cnt
    scan_df = pd.DataFrame({
        "cpu_percent": np.random.uniform(30, 55, scan_cnt),
        "memory_percent": np.random.uniform(50, 65, scan_cnt),
        "process_count": np.random.uniform(180, 210, scan_cnt).astype(int),
        "connection_count": np.random.uniform(250, 600, scan_cnt).astype(int),
        "bytes_sent_delta": np.random.uniform(1_000_000, 5_000_000, scan_cnt),
        "bytes_received_delta": np.random.uniform(500_000, 2_000_000, scan_cnt),
        "is_anomaly_label": 1,
        "scenario": "connection_surge_scan",
    })

    benchmark_df = pd.concat([df_norm, exfil_df, spike_df, scan_df], ignore_index=True)
    return benchmark_df


def evaluate_detector(detector: AnomalyDetector, test_df: pd.DataFrame) -> Dict[str, Any]:
    """Evaluates detector accuracy and latency on test benchmark."""
    y_true = test_df["is_anomaly_label"].values

    preds = []
    latencies = []

    for _, row in test_df.iterrows():
        sample = {feat: row[feat] for feat in BASE_FEATURES}
        t0 = time.perf_counter()
        res = detector.predict_sample(sample)
        latencies.append((time.perf_counter() - t0) * 1000)  # ms
        preds.append(1 if res["is_anomaly"] else 0)

    y_pred = np.array(preds)
    p, r, f1, _ = precision_recall_fscore_support(y_true, y_pred, average="binary", zero_division=0)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

    return {
        "precision": round(float(p), 4),
        "recall": round(float(r), 4),
        "f1_score": round(float(f1), 4),
        "false_positive_rate": round(fpr, 4),
        "true_positives": int(tp),
        "false_positives": int(fp),
        "true_negatives": int(tn),
        "false_negatives": int(fn),
        "avg_latency_ms": round(float(np.mean(latencies)), 3),
        "p95_latency_ms": round(float(np.percentile(latencies, 95)), 3),
        "total_samples": len(test_df),
        "model_version": detector.version,
    }


if __name__ == "__main__":
    detector = AnomalyDetector()
    if not detector.is_ready():
        print("Model not trained yet. Run ml/train.py first.")
    else:
        test_data = generate_evaluation_benchmark(400, 50)
        metrics = evaluate_detector(detector, test_data)
        print("=== DefenX Model Evaluation Report ===")
        for k, v in metrics.items():
            print(f"{k}: {v}")
