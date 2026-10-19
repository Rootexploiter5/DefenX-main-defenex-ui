"""Hybrid Anomaly Detection Service for DefenX.

Combines Isolation Forest statistical outlier scores with deterministic security rules.
"""

from typing import Dict, Any, List, Optional, Tuple
import json

from ml.predict import AnomalyDetector
from backend.services.risk_scoring import calculate_risk_score


class DetectionService:
    def __init__(self, model_path: Optional[str] = None):
        if model_path:
            self.detector = AnomalyDetector(model_path=model_path)
        else:
            self.detector = AnomalyDetector()

    def evaluate_telemetry(
        self,
        features: Dict[str, float],
        raw_snapshot: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """Evaluates telemetry features using both Isolation Forest and deterministic rules.
        
        Returns an Alert dictionary if risk score >= 25.0, else None.
        """
        # 1. AI Isolation Forest Inference
        ai_res = self.detector.predict_sample(features)
        anomaly_component = ai_res["anomaly_component"]

        # 2. Rule Engine Evaluation
        rule_score, triggered_rules = self._evaluate_rules(features, raw_snapshot)

        # 3. Baseline Deviation Score
        deviations = ai_res.get("deviations", {})
        top_deviations = ai_res.get("top_deviations", [])
        # Average significant z-scores normalized
        sig_z = [min(abs(z), 5.0) for z in deviations.values() if abs(z) >= 2.0]
        baseline_dev_score = min(sum(sig_z) / 10.0, 1.0) if sig_z else 0.0

        # 4. Hybrid Risk Score
        risk_score, severity = calculate_risk_score(
            anomaly_component=anomaly_component,
            rule_score=rule_score,
            baseline_deviation_score=baseline_dev_score,
        )

        # Trigger alert threshold (Informational/Low or higher)
        if risk_score >= 25.0 or ai_res["is_anomaly"] or triggered_rules:
            # Build explanatory summary
            reasons = []
            if triggered_rules:
                reasons.extend([r["title"] for r in triggered_rules])
            elif top_deviations:
                dev_desc = ", ".join([f"{d['feature']} ({d['direction']})" for d in top_deviations[:2]])
                reasons.append(f"Deviant baseline metrics: {dev_desc}")
            elif ai_res["is_anomaly"]:
                reasons.append("Multi-dimensional statistical outlier detected by Isolation Forest")

            summary = "; ".join(reasons) if reasons else "Anomalous system observation detected"

            # Generate stable fingerprint for deduplication
            rule_keys = "-".join(sorted([r["id"] for r in triggered_rules])) if triggered_rules else "ai_outlier"
            fingerprint = f"{raw_snapshot.get('device_id')}:{rule_keys}"

            evidence = {
                "features": features,
                "ai_inference": {
                    "raw_score": ai_res["raw_score"],
                    "anomaly_component": ai_res["anomaly_component"],
                    "is_anomaly": ai_res["is_anomaly"],
                    "model_version": ai_res["model_version"],
                },
                "triggered_rules": triggered_rules,
                "top_deviations": top_deviations,
                "top_processes": raw_snapshot.get("top_processes", [])[:5],
                "new_remote_ips": raw_snapshot.get("new_remote_ips", []),
            }

            detector_type = "Hybrid" if (ai_res["is_anomaly"] and triggered_rules) else (
                "HeuristicRules" if triggered_rules else "IsolationForest"
            )

            return {
                "device_id": raw_snapshot.get("device_id", "device-unknown"),
                "timestamp": raw_snapshot.get("timestamp"),
                "severity": severity,
                "risk_score": risk_score,
                "detector": detector_type,
                "summary": summary[:250],
                "evidence_json": json.dumps(evidence),
                "model_version": ai_res["model_version"],
                "fingerprint": fingerprint,
            }

        return None

    def _evaluate_rules(
        self,
        features: Dict[str, float],
        raw_snapshot: Dict[str, Any],
    ) -> Tuple[float, List[Dict[str, Any]]]:
        """Evaluates behavioral threshold rules and returns (rule_score, list_of_triggers)."""
        triggers = []
        cpu = features.get("cpu_percent", 0.0)
        mem = features.get("memory_percent", 0.0)
        conns = features.get("connection_count", 0.0)
        sent_delta = features.get("bytes_sent_delta", 0.0)
        new_procs = float(raw_snapshot.get("new_process_count", 0))

        # Rule 1: Sustained High CPU (Cryptomining or CPU abuse)
        if cpu >= 85.0:
            triggers.append({
                "id": "RULE_CPU_SPIKE",
                "title": f"Excessive CPU load ({cpu:.1f}%)",
                "weight": 0.50 if cpu < 95 else 0.80,
                "details": f"CPU utilization crossed critical threshold (current: {cpu:.1f}%)",
            })

        # Rule 2: Memory Exhaustion Warning
        if mem >= 88.0:
            triggers.append({
                "id": "RULE_MEM_PRESSURE",
                "title": f"Critical memory consumption ({mem:.1f}%)",
                "weight": 0.40,
                "details": f"Available physical memory low ({mem:.1f}% used)",
            })

        # Rule 3: Network Data Exfiltration Spike (>20 MB outbound in 5s)
        if sent_delta >= 20_000_000:
            triggers.append({
                "id": "RULE_DATA_EXFIL",
                "title": f"Massive outbound network traffic surge ({sent_delta / (1024*1024):.1f} MB)",
                "weight": 0.90,
                "details": f"Outbound data rate unusually high: {sent_delta / (1024*1024):.1f} MB in current interval",
            })

        # Rule 4: Connection Count Surge / Port Scan
        if conns >= 150:
            triggers.append({
                "id": "RULE_CONN_SURGE",
                "title": f"Abnormal active connection surge ({int(conns)} conns)",
                "weight": 0.70,
                "details": f"Endpoint has {int(conns)} concurrent connections, possible scanning or bot activity",
            })

        # Rule 5: Process Burst Spawning
        if new_procs >= 15:
            triggers.append({
                "id": "RULE_PROC_BURST",
                "title": f"Rapid process creation burst ({int(new_procs)} new procs)",
                "weight": 0.60,
                "details": f"{int(new_procs)} processes spawned since last interval",
            })

        if not triggers:
            return 0.0, []

        max_weight = max(t["weight"] for t in triggers)
        combined_score = min(max_weight + (0.10 * (len(triggers) - 1)), 1.0)
        return combined_score, triggers
