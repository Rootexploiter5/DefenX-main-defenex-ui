"""SQLAlchemy ORM models for DefenX.

Defines schemas for devices, telemetry summaries, security alerts, and audit logs.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship

from backend.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Device(Base):
    __tablename__ = "devices"

    id = Column(String(64), primary_key=True, index=True)
    device_name = Column(String(128), nullable=False)
    platform = Column(String(64), default="Windows")
    agent_version = Column(String(32), default="1.0.0")
    registered_at = Column(DateTime, default=utc_now)
    last_seen_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    telemetry_records = relationship("Telemetry", back_populates="device", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="device", cascade="all, delete-orphan")


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    device_id = Column(String(64), ForeignKey("devices.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    cpu_percent = Column(Float, nullable=False)
    memory_percent = Column(Float, nullable=False)
    process_count = Column(Integer, nullable=False)
    connection_count = Column(Integer, nullable=False)
    bytes_sent_delta = Column(Float, default=0.0)
    bytes_received_delta = Column(Float, default=0.0)
    raw_evidence = Column(Text, nullable=True)  # JSON string of top procs & network details

    device = relationship("Device", back_populates="telemetry_records")

    __table_args__ = (
        Index("idx_telemetry_device_time", "device_id", "timestamp"),
    )


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    device_id = Column(String(64), ForeignKey("devices.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    severity = Column(String(24), nullable=False, index=True)  # Informational, Low, Medium, High, Critical
    risk_score = Column(Float, nullable=False)  # 0 to 100
    detector = Column(String(64), nullable=False)  # IsolationForest, HeuristicRules, Hybrid
    summary = Column(String(256), nullable=False)
    evidence_json = Column(Text, nullable=False)  # JSON string of feature deviations, triggered rules
    status = Column(String(32), default="open", index=True)  # open, investigating, resolved, false_positive
    model_version = Column(String(32), default="1.0.0")
    fingerprint = Column(String(128), nullable=True, index=True)  # Deduplication key

    device = relationship("Device", back_populates="alerts")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    actor = Column(String(64), default="system")
    action = Column(String(64), nullable=False)  # e.g., STATUS_CHANGE, DISMISS_ALERT, RULE_TRIGGER
    target_id = Column(String(64), nullable=True)
    result = Column(String(256), nullable=False)
