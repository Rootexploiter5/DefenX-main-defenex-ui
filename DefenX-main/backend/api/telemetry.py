"""Telemetry ingestion and query API endpoints for DefenX.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import json
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Device, Telemetry, Alert
from backend.schemas import TelemetryIngest, TelemetryResponse
from backend.services.detection import DetectionService
from backend.services.alert_manager import AlertManager
from ml.feature_engineering import extract_realtime_features

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

# Service singletons
detection_service = DetectionService()
alert_manager = AlertManager(cooldown_seconds=45)

# In-memory store of last snapshot per device to calculate deltas
_last_snapshots: Dict[str, Dict[str, Any]] = {}
# Global callback reference for WebSocket broadcast (registered in main.py)
ws_broadcast_callback = None


def set_ws_broadcast_callback(cb):
    global ws_broadcast_callback
    ws_broadcast_callback = cb


@router.post("", status_code=201)
async def ingest_telemetry(
    payload: TelemetryIngest,
    db: Session = Depends(get_db),
    x_agent_key: Optional[str] = Header(None),
):
    """Ingests real-time telemetry from endpoint agents.
    
    Validates payload, registers device, computes features, runs detection,
    persists metrics and alerts, and broadcasts live events.
    """
    snapshot_dict = payload.model_dump()
    device_id = payload.device_id
    now = datetime.now(timezone.utc)

    # 1. Ensure Device exists or register
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        device = Device(
            id=device_id,
            device_name=f"Host-{device_id}",
            platform="Windows",
            agent_version="1.0.0",
            registered_at=now,
            last_seen_at=now,
        )
        db.add(device)
    else:
        device.last_seen_at = now
    db.commit()

    # 2. Extract features with delta computation
    previous = _last_snapshots.get(device_id)
    features = extract_realtime_features(snapshot_dict, previous)
    _last_snapshots[device_id] = snapshot_dict

    # 3. Persist Telemetry summary
    raw_evidence_str = json.dumps({
        "top_processes": snapshot_dict.get("top_processes", [])[:8],
        "new_remote_ips": snapshot_dict.get("new_remote_ips", []),
        "local_ip": snapshot_dict.get("local_ip"),
    })
    telemetry_rec = Telemetry(
        device_id=device_id,
        timestamp=now,
        cpu_percent=payload.cpu_percent,
        memory_percent=payload.memory_percent,
        process_count=payload.process_count,
        connection_count=payload.connection_count,
        bytes_sent_delta=features["bytes_sent_delta"],
        bytes_received_delta=features["bytes_received_delta"],
        raw_evidence=raw_evidence_str,
    )
    db.add(telemetry_rec)
    db.commit()
    db.refresh(telemetry_rec)

    # 4. Evaluate Anomaly Detection
    alert_info = detection_service.evaluate_telemetry(features, snapshot_dict)
    created_alert = None
    if alert_info:
        created_alert = alert_manager.process_and_store_alert(db, alert_info)

    # 5. Broadcast to connected WebSockets
    if ws_broadcast_callback:
        broadcast_payload = {
            "type": "TELEMETRY_UPDATE",
            "telemetry": {
                "id": telemetry_rec.id,
                "device_id": device_id,
                "timestamp": now.isoformat(),
                "cpu_percent": payload.cpu_percent,
                "memory_percent": payload.memory_percent,
                "process_count": payload.process_count,
                "connection_count": payload.connection_count,
                "bytes_sent_delta": features["bytes_sent_delta"],
                "bytes_received_delta": features["bytes_received_delta"],
                "top_processes": snapshot_dict.get("top_processes", [])[:5],
            },
            "alert": {
                "id": created_alert.id,
                "severity": created_alert.severity,
                "risk_score": created_alert.risk_score,
                "summary": created_alert.summary,
                "detector": created_alert.detector,
                "timestamp": created_alert.timestamp.isoformat(),
            } if created_alert else None,
        }
        await ws_broadcast_callback(broadcast_payload)

    return {
        "status": "success",
        "telemetry_id": telemetry_rec.id,
        "alert_created": created_alert is not None,
        "alert_id": created_alert.id if created_alert else None,
    }


@router.get("/latest")
def get_latest_telemetry(device_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieves the latest telemetry observation."""
    query = db.query(Telemetry)
    if device_id:
        query = query.filter(Telemetry.device_id == device_id)
    latest = query.order_by(Telemetry.timestamp.desc()).first()
    if not latest:
        raise HTTPException(status_code=404, detail="No telemetry available")

    raw_details = {}
    if latest.raw_evidence:
        try:
            raw_details = json.loads(latest.raw_evidence)
        except Exception:
            pass

    return {
        "id": latest.id,
        "device_id": latest.device_id,
        "timestamp": latest.timestamp.isoformat(),
        "cpu_percent": latest.cpu_percent,
        "memory_percent": latest.memory_percent,
        "process_count": latest.process_count,
        "connection_count": latest.connection_count,
        "bytes_sent_delta": latest.bytes_sent_delta,
        "bytes_received_delta": latest.bytes_received_delta,
        "raw_evidence": raw_details,
    }


@router.get("/history")
def get_telemetry_history(
    device_id: Optional[str] = None,
    limit: int = Query(50, ge=5, le=300),
    db: Session = Depends(get_db),
):
    """Retrieves chronological telemetry history for dashboard charts."""
    query = db.query(Telemetry)
    if device_id:
        query = query.filter(Telemetry.device_id == device_id)
    records = query.order_by(Telemetry.timestamp.desc()).limit(limit).all()
    # Reverse to return ascending chronological order for time-series charts
    records.reverse()
    return [
        {
            "id": r.id,
            "device_id": r.device_id,
            "timestamp": r.timestamp.isoformat(),
            "cpu_percent": r.cpu_percent,
            "memory_percent": r.memory_percent,
            "process_count": r.process_count,
            "connection_count": r.connection_count,
            "bytes_sent_delta": r.bytes_sent_delta,
            "bytes_received_delta": r.bytes_received_delta,
        }
        for r in records
    ]
