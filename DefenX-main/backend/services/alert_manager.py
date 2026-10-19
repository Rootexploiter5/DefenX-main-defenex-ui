"""Alert Manager service for DefenX.

Handles alert deduplication, fingerprint cooldowns, database persistence,
and notifying active WebSocket subscribers.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from backend.models import Alert, AuditEvent


class AlertManager:
    def __init__(self, cooldown_seconds: int = 60):
        self.cooldown_seconds = cooldown_seconds
        # In-memory deduplication cache: {fingerprint: last_alert_time}
        self._fingerprint_cooldowns: Dict[str, datetime] = {}

    def should_deduplicate(self, fingerprint: str, now: datetime) -> bool:
        """Checks if a matching alert fingerprint was generated within the cooldown window."""
        if not fingerprint:
            return False
        last_seen = self._fingerprint_cooldowns.get(fingerprint)
        if last_seen and (now - last_seen).total_seconds() < self.cooldown_seconds:
            return True
        return False

    def process_and_store_alert(
        self,
        db: Session,
        alert_dict: Dict[str, Any],
    ) -> Optional[Alert]:
        """Deduplicates, persists, and prepares alert for broadcast."""
        now = datetime.now(timezone.utc)
        fingerprint = alert_dict.get("fingerprint", "")

        if self.should_deduplicate(fingerprint, now):
            return None  # Suppressed by cooldown

        self._fingerprint_cooldowns[fingerprint] = now

        db_alert = Alert(
            device_id=alert_dict["device_id"],
            timestamp=now,
            severity=alert_dict["severity"],
            risk_score=alert_dict["risk_score"],
            detector=alert_dict["detector"],
            summary=alert_dict["summary"],
            evidence_json=alert_dict["evidence_json"],
            status="open",
            model_version=alert_dict.get("model_version", "1.0.0"),
            fingerprint=fingerprint,
        )
        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)

        # Record audit event
        audit = AuditEvent(
            timestamp=now,
            actor="detection_engine",
            action="ALERT_GENERATED",
            target_id=str(db_alert.id),
            result=f"Generated {db_alert.severity} alert: {db_alert.summary[:60]}",
        )
        db.add(audit)
        db.commit()

        return db_alert

    def update_alert_status(
        self,
        db: Session,
        alert_id: int,
        new_status: str,
        actor: str = "analyst",
        notes: Optional[str] = None,
    ) -> Optional[Alert]:
        """Transitions alert status and logs audit event."""
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None

        old_status = alert.status
        alert.status = new_status
        db.commit()
        db.refresh(alert)

        audit = AuditEvent(
            timestamp=datetime.now(timezone.utc),
            actor=actor,
            action="STATUS_CHANGE",
            target_id=str(alert.id),
            result=f"Changed status from '{old_status}' to '{new_status}'" + (f" (Notes: {notes})" if notes else ""),
        )
        db.add(audit)
        db.commit()

        return alert
