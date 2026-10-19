"""AI and Ollama integration API endpoints for DefenX.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Alert
from backend.services.ollama_service import OllamaService
from backend.api.dashboard import summary as dashboard_summary
import json
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/ai", tags=["ai"])
ollama_service = OllamaService()


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []
    context: Optional[Dict[str, Any]] = None


@router.get("/status")
def get_ai_status():
    """Returns the connectivity status and active model of the local Ollama instance."""
    return ollama_service.get_status()


@router.post("/explain/{alert_id}")
def explain_alert_with_ai(alert_id: int, db: Session = Depends(get_db)):
    """Runs deep forensic AI analysis on a security alert using Ollama."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert_dict = {
        "id": alert.id,
        "device_id": alert.device_id,
        "timestamp": alert.timestamp.isoformat(),
        "severity": alert.severity,
        "risk_score": alert.risk_score,
        "detector": alert.detector,
        "summary": alert.summary,
        "evidence_json": alert.evidence_json,
    }

    result = ollama_service.analyze_alert(alert_dict)
    return result


@router.post("/chat")
def chat_with_copilot(payload: ChatRequest, db: Session = Depends(get_db)):
    """Converses with the DefenX AI Security Copilot powered by Ollama."""
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Build context on the server from stored data; never trust client-supplied "facts".
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).replace(tzinfo=None)
    recent = db.query(Alert).filter(Alert.timestamp >= since).order_by(Alert.timestamp.desc()).limit(8).all()
    context = {
        "summary": dashboard_summary(db),
        "recent_alerts": [
            {"id": a.id, "time": a.timestamp.isoformat(), "severity": a.severity, "risk": a.risk_score,
             "device": a.device_id, "summary": a.summary, "status": a.status,
             "evidence": _safe_json(a.evidence_json)}
            for a in recent
        ],
    }
    reply = ollama_service.chat_copilot(
        message=payload.message[:2000],
        conversation_history=(payload.conversation_history or [])[-6:],
        context=context,
    )
    return reply


def _safe_json(raw: str):
    try:
        return json.loads(raw)
    except Exception:
        return None
