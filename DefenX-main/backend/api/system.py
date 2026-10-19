"""System Telemetry, Live Processes, and Network Inspection Endpoints.

Provides live system metrics, running process enumeration, and active socket connections
for the DefenX Device Security console.
"""

import os
import sys
import socket
import platform
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import psutil
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/system", tags=["system"])

# In-memory collector toggle state
_collector_paused = False


@router.get("/status")
def get_system_status():
    """Returns general device and agent health status."""
    hostname = socket.gethostname()
    try:
        local_ip = socket.gethostbyname(hostname)
    except Exception:
        local_ip = "127.0.0.1"

    cpu_count = psutil.cpu_count(logical=True)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    return {
        "hostname": hostname,
        "platform": sys.platform,
        "os_version": platform.platform(),
        "local_ip": local_ip,
        "cpu_cores": cpu_count,
        "total_ram_gb": round(mem.total / (1024**3), 2),
        "total_disk_gb": round(disk.total / (1024**3), 2),
        "disk_percent": round(disk.percent, 1),
        "collector_paused": _collector_paused,
        "agent_online": None,  # derive from /dashboard/summary telemetry_active
        "agent_version": None,  # reported per device via /dashboard/devices
        "last_heartbeat": None,
    }


@router.get("/processes")
def get_live_processes(limit: int = 50, sort_by: str = "cpu"):
    """Returns live running processes with resource metrics."""
    procs = []
    for p in psutil.process_iter(["pid", "name", "username", "cpu_percent", "memory_percent", "status", "num_threads"]):
        try:
            info = p.info
            pid = info.get("pid")
            if not pid:
                continue

            cpu = float(info.get("cpu_percent") or 0.0)
            mem = round(float(info.get("memory_percent") or 0.0), 2)
            name = info.get("name") or "unknown"
            username = info.get("username") or "SYSTEM"
            status = info.get("status") or "running"

            # Determine anomaly heuristic flag
            is_anomalous = cpu > 60.0 or mem > 15.0 or name.lower() in ["powershell.exe", "cmd.exe", "wscript.exe", "cscript.exe"]

            procs.append({
                "pid": pid,
                "name": name,
                "username": username,
                "cpu_percent": cpu,
                "memory_percent": mem,
                "status": status,
                "threads": info.get("num_threads") or 1,
                "is_anomalous": is_anomalous,
                "anomaly_label": "High CPU" if cpu > 60 else ("High RAM" if mem > 15 else ("Script Host" if "script" in name.lower() else "Normal")),
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    if sort_by == "cpu":
        procs.sort(key=lambda x: x["cpu_percent"], reverse=True)
    elif sort_by == "memory":
        procs.sort(key=lambda x: x["memory_percent"], reverse=True)
    elif sort_by == "name":
        procs.sort(key=lambda x: x["name"].lower())

    return {
        "total_count": len(procs),
        "processes": procs[:limit],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/network")
def get_live_network(limit: int = 60):
    """Returns active network sockets and remote endpoints."""
    connections = []
    seen_ips = set()

    try:
        conns = psutil.net_connections(kind="inet")
        # Build quick pid -> name map for active processes
        pid_names = {}
        for p in psutil.process_iter(["pid", "name"]):
            try:
                pid_names[p.info["pid"]] = p.info["name"]
            except Exception:
                pass

        for c in conns:
            local_ip = c.laddr.ip if c.laddr else "0.0.0.0"
            local_port = c.laddr.port if c.laddr else 0
            remote_ip = c.raddr.ip if c.raddr else None
            remote_port = c.raddr.port if c.raddr else None

            # Skip pure loopback unless established
            if remote_ip and (remote_ip.startswith("127.") or remote_ip == "::1"):
                continue

            proc_name = pid_names.get(c.pid, "system" if c.pid == 4 else f"PID:{c.pid}")
            is_suspicious = False
            reputation = "Benign"

            if remote_ip:
                seen_ips.add(remote_ip)
                if remote_port in [4444, 1337, 8888, 6667, 31337]:
                    is_suspicious = True
                    reputation = "Suspicious Port"
                elif remote_ip.startswith("192.168.") or remote_ip.startswith("10.") or remote_ip.startswith("172."):
                    reputation = "Internal LAN"
                else:
                    reputation = "Public Internet"

            connections.append({
                "fd": c.fd,
                "protocol": "TCP" if c.type == socket.SOCK_STREAM else "UDP",
                "local_address": f"{local_ip}:{local_port}",
                "local_ip": local_ip,
                "local_port": local_port,
                "remote_address": f"{remote_ip}:{remote_port}" if remote_ip else "—",
                "remote_ip": remote_ip or "None",
                "remote_port": remote_port or 0,
                "status": c.status,
                "pid": c.pid,
                "process_name": proc_name,
                "is_suspicious": is_suspicious,
                "reputation": reputation,
            })
    except (psutil.AccessDenied, OSError):
        pass

    # Sort with established/remote first
    connections.sort(key=lambda x: (x["remote_ip"] != "None", x["status"] == "ESTABLISHED"), reverse=True)

    return {
        "total_connections": len(connections),
        "unique_remote_ips": len(seen_ips),
        "connections": connections[:limit],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/collector/toggle")
def toggle_collector():
    """Pauses or resumes live telemetry collection."""
    global _collector_paused
    _collector_paused = not _collector_paused
    return {
        "status": "success",
        "collector_paused": _collector_paused,
        "message": "Telemetry collection paused" if _collector_paused else "Telemetry collection resumed",
    }


@router.get("/model/info")
def get_model_info():
    """Returns Isolation Forest model status and hyperparameters."""
    model_path = os.path.join("ml", "models", "anomaly_model.joblib")
    scaler_path = os.path.join("ml", "models", "scaler.joblib")

    exists = os.path.exists(model_path)
    file_size_kb = round(os.path.getsize(model_path) / 1024, 1) if exists else 0
    mod_time = datetime.fromtimestamp(os.path.getmtime(model_path), tz=timezone.utc).isoformat() if exists else None

    return {
        "engine": "Isolation Forest (scikit-learn)",
        "version": "baseline",
        "status": "Ready / Active" if exists else "Model Missing",
        "model_file": model_path,
        "model_size_kb": file_size_kb,
        "last_trained": mod_time or "Never",
        "contamination": 0.05,
        "n_estimators": 150,
        "random_state": 42,
        "decision_threshold": -0.65,
        "feature_schema": [
            {"name": "cpu_percent", "type": "float", "unit": "%", "description": "Operating system CPU core usage"},
            {"name": "memory_percent", "type": "float", "unit": "%", "description": "Physical RAM utilization"},
            {"name": "process_count", "type": "integer", "unit": "count", "description": "Total active OS process count"},
            {"name": "connection_count", "type": "integer", "unit": "count", "description": "Active socket connections"},
            {"name": "bytes_sent_delta", "type": "float", "unit": "bytes/interval", "description": "Outbound egress delta"},
            {"name": "bytes_received_delta", "type": "float", "unit": "bytes/interval", "description": "Inbound ingress delta"},
        ],
        "evaluation_metrics": None,  # use /analytics/evaluation (synthetic benchmark)
    }
