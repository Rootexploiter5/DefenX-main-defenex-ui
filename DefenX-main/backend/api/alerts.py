"""Alert and audit API endpoints for DefenX.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Alert, AuditEvent
from backend.schemas import AlertResponse, AlertStatusUpdate, AuditResponse, EvaluationMetricsResponse
from backend.services.alert_manager import AlertManager
from ml.evaluate import evaluate_detector, generate_evaluation_benchmark
from ml.predict import AnomalyDetector

router = APIRouter(tags=["alerts"])
alert_manager = AlertManager()


@router.get("/alerts", response_model=List[AlertResponse])
def list_alerts(
    device_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Retrieves security alerts filtered by status, severity, or device."""
    query = db.query(Alert)
    if device_id:
        query = query.filter(Alert.device_id == device_id)
    if severity:
        query = query.filter(Alert.severity == severity)
    if status:
        query = query.filter(Alert.status == status)

    return query.order_by(Alert.timestamp.desc()).limit(limit).all()


@router.get("/alerts/{alert_id}", response_model=AlertResponse)
def get_alert_detail(alert_id: int, db: Session = Depends(get_db)):
    """Retrieves full alert information and forensic evidence."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/alerts/{alert_id}", response_model=AlertResponse)
def update_alert_status(
    alert_id: int,
    payload: AlertStatusUpdate,
    db: Session = Depends(get_db),
):
    """Updates the investigation lifecycle status of an alert (open, investigating, resolved, false_positive)."""
    alert = alert_manager.update_alert_status(
        db=db,
        alert_id=alert_id,
        new_status=payload.status,
        actor=payload.actor or "analyst",
        notes=payload.notes,
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.get("/audit", response_model=List[AuditResponse])
def list_audit_events(limit: int = Query(50, ge=5, le=200), db: Session = Depends(get_db)):
    """Lists recent system audit events."""
    return db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit).all()


@router.get("/analytics/evaluation", response_model=EvaluationMetricsResponse)
def get_model_evaluation():
    """Returns AI model benchmark evaluation metrics."""
    detector = AnomalyDetector()
    if not detector.is_ready():
        return {
            "precision": 0.0,
            "recall": 0.0,
            "f1_score": 0.0,
            "false_positive_rate": 0.0,
            "avg_latency_ms": 0.0,
            "model_version": "none",
            "status": "Model uninitialized",
        }

    test_data = generate_evaluation_benchmark(300, 40)
    metrics = evaluate_detector(detector, test_data)
    return {
        "precision": metrics["precision"],
        "recall": metrics["recall"],
        "f1_score": metrics["f1_score"],
        "false_positive_rate": metrics["false_positive_rate"],
        "avg_latency_ms": metrics["avg_latency_ms"],
        "model_version": metrics["model_version"],
        "status": "Operational",
    }
