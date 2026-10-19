"""Pydantic schemas for DefenX API validation and response serialization.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# Telemetry ingestion schemas
class ProcessItem(BaseModel):
    pid: int
    name: str
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    status: str = "running"


class ActiveConnectionItem(BaseModel):
    status: str
    local_port: Optional[int] = None
    remote_ip: str
    remote_port: Optional[int] = None


class TelemetryIngest(BaseModel):
    device_id: str = Field(..., max_length=64)
    timestamp: datetime
    cpu_percent: float = Field(..., ge=0.0, le=100.0)
    memory_percent: float = Field(..., ge=0.0, le=100.0)
    memory_used_mb: Optional[float] = None
    process_count: int = Field(..., ge=0)
    connection_count: int = Field(..., ge=0)
    bytes_sent: float = Field(..., ge=0.0)
    bytes_received: float = Field(..., ge=0.0)
    top_processes: Optional[List[ProcessItem]] = []
    new_process_count: Optional[int] = 0
    unique_remote_ips_count: Optional[int] = 0
    new_remote_ips: Optional[List[str]] = []
    local_ip: Optional[str] = None


class TelemetryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: str
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    process_count: int
    connection_count: int
    bytes_sent_delta: float
    bytes_received_delta: float


# Alert schemas
class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: str
    timestamp: datetime
    severity: str
    risk_score: float
    detector: str
    summary: str
    evidence_json: str
    status: str
    model_version: str


class AlertStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|investigating|resolved|false_positive)$")
    actor: Optional[str] = "analyst"
    notes: Optional[str] = None


# Device schemas
class DeviceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    device_name: str
    platform: str
    agent_version: str
    registered_at: datetime
    last_seen_at: datetime


# Audit schemas
class AuditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    actor: str
    action: str
    target_id: Optional[str] = None
    result: str


# Model diagnostics & Evaluation summary
class EvaluationMetricsResponse(BaseModel):
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    avg_latency_ms: float
    model_version: str
    status: str
