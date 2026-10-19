"""Command-platform actions (Scan Now, Report, Protect) for DEFENEX."""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.api.dashboard import summary
from backend.api.system import get_live_network, get_live_processes
from backend.database import get_db
from backend.models import Alert

router = APIRouter(prefix="/actions", tags=["actions"])


@router.post("/scan")
def scan_now() -> Dict[str, Any]:
    """Behavioural snapshot scan: flags processes/sockets using the platform's
    heuristics. This is NOT a signature-based malware scan and says so."""
    procs = get_live_processes(limit=500, sort_by="cpu")["processes"]
    net = get_live_network(limit=500)
    flagged_procs = [p for p in procs if p["is_anomalous"]]
    flagged_conns = [c for c in net["connections"] if c["is_suspicious"]]
    return {
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "scan_type": "behavioural-snapshot",
        "disclaimer": "Heuristic check of running processes and sockets. Not a signature-based antivirus scan.",
        "processes_checked": len(procs),
        "connections_checked": len(net["connections"]),
        "flagged_processes": flagged_procs[:10],
        "flagged_connections": flagged_conns[:10],
        "clean": not flagged_procs and not flagged_conns,
    }


@router.post("/protect")
def protect() -> Dict[str, Any]:
    """No enforcement module exists; report that honestly instead of pretending."""
    return {
        "available": False,
        "message": (
            "Protection rules are not available: DEFENEX currently performs detection only. "
            "An enforcement module (e.g. firewall rule management) must be added and "
            "explicitly approved before this action can change anything."
        ),
    }


@router.get("/report")
def report(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Markdown security report built only from stored data."""
    s = summary(db)
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).replace(tzinfo=None)
    alerts = (
        db.query(Alert).filter(Alert.timestamp >= since).order_by(Alert.risk_score.desc()).limit(20).all()
    )
    lines = [
        "# DEFENEX Security Report",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
        "## Summary (last 24 hours)",
        f"- Telemetry active: {'yes' if s['telemetry_active'] else 'no'}",
        f"- Last telemetry: {s['last_telemetry_at'] or 'never'}",
        f"- Security score: {s['security_score'] if s['security_score'] is not None else 'n/a (no telemetry)'}",
        f"- Anomalies detected: {s['anomalies_24h']}",
        f"- Critical unresolved: {s['critical_threats']}",
        f"- Devices online / monitored: {s['devices_online']} / {s['devices_monitored']}",
        "",
        "## Top alerts",
    ]
    if not alerts:
        lines.append("No alerts recorded in this period.")
    for a in alerts:
        lines.append(
            f"- [{a.severity}] {a.timestamp.isoformat()} risk {a.risk_score} on {a.device_id}: {a.summary} ({a.status})"
        )
    return {"markdown": "\n".join(lines), "summary": s}
