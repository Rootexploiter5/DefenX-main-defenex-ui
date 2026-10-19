"""Risk scoring engine for DefenX.

Combines Isolation Forest anomaly components, heuristic rule triggers, and baseline deviations
into an interpretable 0-100 risk score and severity classification.
"""

from typing import Dict, Any, Tuple
import numpy as np


def calculate_risk_score(
    anomaly_component: float,
    rule_score: float,
    baseline_deviation_score: float,
    w_anomaly: float = 0.60,
    w_rules: float = 0.25,
    w_deviation: float = 0.15,
) -> Tuple[float, str]:
    """Calculates overall risk score and maps to severity band.
    
    risk = 100 * (0.60 * anomaly + 0.25 * rule + 0.15 * baseline_deviation)
    All components normalized to [0, 1].
    
    Severity bands:
    - 0-24: Informational
    - 25-49: Low
    - 50-74: Medium
    - 75-89: High
    - 90-100: Critical
    """
    c_anomaly = float(np.clip(anomaly_component, 0.0, 1.0))
    c_rules = float(np.clip(rule_score, 0.0, 1.0))
    c_dev = float(np.clip(baseline_deviation_score, 0.0, 1.0))

    raw_risk = 100.0 * (
        (w_anomaly * c_anomaly) +
        (w_rules * c_rules) +
        (w_deviation * c_dev)
    )
    risk_score = round(float(np.clip(raw_risk, 0.0, 100.0)), 1)

    if risk_score >= 90.0:
        severity = "Critical"
    elif risk_score >= 75.0:
        severity = "High"
    elif risk_score >= 50.0:
        severity = "Medium"
    elif risk_score >= 25.0:
        severity = "Low"
    else:
        severity = "Informational"

    return risk_score, severity
