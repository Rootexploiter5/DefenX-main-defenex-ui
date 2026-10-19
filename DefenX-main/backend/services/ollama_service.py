"""Ollama AI Integration Service for DefenX.

Connects to local Ollama instance for deep incident triage, forensic analysis,
and interactive cybersecurity copilot capabilities.
"""

import os
import json
from typing import Dict, Any, List, Optional
import httpx

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_DEFAULT_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3:4b-instruct-2507-q4_K_M")


class OllamaService:
    def __init__(self, base_url: str = OLLAMA_BASE_URL, default_model: str = OLLAMA_DEFAULT_MODEL):
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model
        self.active_model: Optional[str] = None
        self._detect_active_model()

    def _detect_active_model(self):
        """Discovers available models from local Ollama service."""
        try:
            with httpx.Client(timeout=2.0) as client:
                res = client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    if self.default_model in models:
                        self.active_model = self.default_model
                    elif models:
                        self.active_model = models[0]
                    else:
                        self.active_model = self.default_model
        except Exception:
            self.active_model = self.default_model

    def get_status(self) -> Dict[str, Any]:
        """Checks if Ollama daemon is reachable and lists installed models."""
        self._detect_active_model()
        try:
            with httpx.Client(timeout=2.0) as client:
                res = client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    return {
                        "available": True,
                        "url": self.base_url,
                        "active_model": self.active_model,
                        "models": models,
                    }
        except Exception as e:
            return {
                "available": False,
                "url": self.base_url,
                "active_model": self.active_model,
                "error": str(e),
                "models": [],
            }
        return {"available": False, "models": []}

    def analyze_alert(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generates deep AI forensic triage for a security incident."""
        evidence = {}
        if alert_data.get("evidence_json"):
            try:
                evidence = json.loads(alert_data["evidence_json"])
            except Exception:
                evidence = {}

        prompt = f"""You are DefenX AI, an elite cybersecurity incident response analyst. Analyze this endpoint anomaly detection alert:

[INCIDENT DETAILS]
- Incident ID: {alert_data.get('id', 'N/A')}
- Target Device: {alert_data.get('device_id', 'Unknown')}
- Severity: {alert_data.get('severity', 'Unknown')} (Calculated Risk Score: {alert_data.get('risk_score', 'N/A')}/100)
- Detector Type: {alert_data.get('detector', 'Hybrid')}
- Incident Summary: {alert_data.get('summary', 'Anomaly detected')}

[FORENSIC EVIDENCE]
- Feature Metrics: {json.dumps(evidence.get('features', {}), indent=2)}
- Triggered Rules: {json.dumps(evidence.get('triggered_rules', []), indent=2)}
- Baseline Metric Deviations (Z-scores): {json.dumps(evidence.get('top_deviations', []), indent=2)}
- Top Running Processes: {json.dumps(evidence.get('top_processes', []), indent=2)}
- New Remote IPs: {json.dumps(evidence.get('new_remote_ips', []))}

Please provide a concise, structured markdown report covering:
1. 🎯 **Executive Summary**: What happened in plain technical terms.
2. 🔍 **Root Cause & Forensics**: Why did this trigger an alert (CPU/RAM spike, port scan, data exfiltration, or compiler activity)?
3. ⚠️ **Threat Classification**: Is this likely Benign (legitimate user workload), Suspicious, or Malicious?
4. 🛡️ **Remediation & Response**: 2-3 specific, actionable steps for the security analyst."""

        try:
            with httpx.Client(timeout=45.0) as client:
                res = client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.active_model or self.default_model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.2,
                            "top_p": 0.9,
                        },
                    },
                )
                if res.status_code == 200:
                    resp_json = res.json()
                    analysis_text = resp_json.get("response", "").strip()
                    return {
                        "success": True,
                        "model": self.active_model,
                        "analysis": analysis_text,
                        "generated_at": alert_data.get("timestamp"),
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Ollama returned HTTP {res.status_code}",
                        "analysis": self._generate_fallback_analysis(alert_data, evidence),
                    }
        except Exception as e:
            return {
                "success": False,
                "error": f"Ollama unreachable: {str(e)}",
                "analysis": self._generate_fallback_analysis(alert_data, evidence),
            }

    def chat_copilot(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Interactive security copilot conversational query."""
        system_prompt = (
            "You are the DefenX Cyber Copilot, an AI assistant embedded in the DefenX endpoint security platform. "
            "You provide concise, highly technical, and actionable security insights about endpoint anomalies, "
            "process behavior, network traffic, and incident triage. Base every statement ONLY on the 'Current System Context' "
            "provided. The detection engine, not you, decides whether an anomaly occurred. If the context has no relevant "
            "data, say so plainly; never invent detections, devices, IPs, or numbers, and never claim to have inspected "
            "anything that is not in the context. You cannot take actions on the device."
        )

        messages = [{"role": "system", "content": system_prompt}]

        if context:
            context_str = f"Current System Context:\n{json.dumps(context, indent=2)}"
            messages.append({"role": "system", "content": context_str})

        if conversation_history:
            messages.extend(conversation_history[-6:])

        messages.append({"role": "user", "content": message})

        try:
            with httpx.Client(timeout=45.0) as client:
                res = client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.active_model or self.default_model,
                        "messages": messages,
                        "stream": False,
                        "options": {"temperature": 0.4},
                    },
                )
                if res.status_code == 200:
                    ans = res.json().get("message", {}).get("content", "").strip()
                    return {"success": True, "reply": ans, "model": self.active_model}
                else:
                    return {"success": False, "reply": f"Ollama HTTP error: {res.status_code}"}
        except Exception as e:
            return {
                "success": False,
                "reply": f"Unable to reach local Ollama daemon ({str(e)}). Ensure Ollama is running (`ollama serve`).",
            }

    def _generate_fallback_analysis(self, alert_data: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        """Deterministic heuristic fallback when Ollama is offline."""
        summary = alert_data.get("summary", "System anomaly detected")
        risk = alert_data.get("risk_score", 50)
        rules = [r.get("title") for r in evidence.get("triggered_rules", [])]

        rules_desc = ", ".join(rules) if rules else "Statistical deviation from normal baseline"
        return f"""### 🎯 Executive Summary
The DefenX detection engine flagged a **{alert_data.get('severity', 'Medium')}** incident on host `{alert_data.get('device_id', 'local')}` with a composite risk score of **{risk}/100**.

### 🔍 Forensic Findings
- **Observed triggers:** {rules_desc}
- **Detector:** {alert_data.get('detector', 'Isolation Forest')}

### 🛡️ Recommended Actions
1. Inspect the top resource-consuming processes listed in the incident evidence.
2. Verify if authorized user activity (e.g. build, update, large download) coincides with this timestamp.
3. If activity is unexpected, isolate network adapter and verify process executable path.
*(Note: Generated via DefenX Heuristic Engine while Ollama is offline)*"""
