"""Inference module for DefenX Anomaly Detection.

Loads the Isolation Forest model artifact and scores incoming feature observations.
"""

import os
from typing import Dict, Any, Tuple, Optional
import joblib
import numpy as np
import pandas as pd

from ml.feature_engineering import BASE_FEATURES

DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "anomaly_model.joblib")


class AnomalyDetector:
    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        self.model_path = model_path
        self.artifact: Optional[Dict[str, Any]] = None
        self.model = None
        self.features = BASE_FEATURES
        self.version = "unknown"
        self.feature_stats = {}
        self.load_model()

    def load_model(self) -> bool:
        if not os.path.exists(self.model_path):
            return False
        try:
            self.artifact = joblib.load(self.model_path)
            self.model = self.artifact.get("model")
            self.features = self.artifact.get("features", BASE_FEATURES)
            self.version = self.artifact.get("model_version", "1.0.0")
            self.feature_stats = self.artifact.get("feature_stats", {})
            return True
        except Exception as e:
            print(f"Error loading model from {self.model_path}: {e}")
            return False

    def is_ready(self) -> bool:
        return self.model is not None

    def predict_sample(self, features_dict: Dict[str, float]) -> Dict[str, Any]:
        """Runs inference on a single feature dictionary.
        
        Returns:
            is_anomaly: bool (True if Isolation Forest flags outlier -1)
            raw_score: float (Isolation Forest score_samples, typically -0.8 to 0.2; lower = more anomalous)
            anomaly_component: float normalized to [0, 1] (higher = more anomalous)
            deviations: Dict of feature z-scores compared to baseline
            top_deviations: list of features deviating significantly from normal baseline
        """
        if not self.is_ready():
            return {
                "is_anomaly": False,
                "raw_score": 0.0,
                "anomaly_component": 0.0,
                "deviations": {},
                "top_deviations": [],
                "model_version": "none",
            }

        # Build feature vector in exact order
        vec = [float(features_dict.get(k, 0.0)) for k in self.features]
        df_vec = pd.DataFrame([vec], columns=self.features)

        pred = int(self.model.predict(df_vec)[0])  # -1 = anomaly, 1 = normal
        raw_score = float(self.model.score_samples(df_vec)[0])

        # Normalize score_samples into [0, 1] anomaly component
        # Isolation Forest score_samples: typical baseline inliers ~ -0.40 to -0.30; anomalies < -0.55
        # We map score from [-0.75, -0.35] to [1.0, 0.0]
        anomaly_component = float(np.clip((-raw_score - 0.35) / 0.40, 0.0, 1.0))

        # Calculate baseline deviations (Z-score like)
        deviations = {}
        top_deviations = []
        means = self.feature_stats.get("means", {})
        stds = self.feature_stats.get("stds", {})

        for feat in self.features:
            val = float(features_dict.get(feat, 0.0))
            mean = float(means.get(feat, val))
            std = float(stds.get(feat, 1.0))
            if std == 0:
                std = 1.0
            z = (val - mean) / std
            deviations[feat] = round(z, 2)
            if abs(z) >= 2.0:
                top_deviations.append({
                    "feature": feat,
                    "value": val,
                    "baseline_mean": round(mean, 2),
                    "z_score": round(z, 2),
                    "direction": "HIGH" if z > 0 else "LOW",
                })

        return {
            "is_anomaly": pred == -1,
            "raw_score": round(raw_score, 4),
            "anomaly_component": round(anomaly_component, 4),
            "deviations": deviations,
            "top_deviations": top_deviations,
            "model_version": self.version,
        }
