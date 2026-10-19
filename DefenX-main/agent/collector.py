"""Telemetry Collector component for the DefenX Endpoint Agent.

Gathers hardware metrics, process states, and network statistics into standardized snapshots.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional
import psutil

from agent.process_tracker import ProcessTracker
from agent.network_monitor import NetworkMonitor


class TelemetryCollector:
    def __init__(self, device_id: str = "device-primary-win"):
        self.device_id = device_id
        self.process_tracker = ProcessTracker()
        self.network_monitor = NetworkMonitor()
        # Prime psutil CPU calculation so the first reading is meaningful
        psutil.cpu_percent(interval=None)

    def collect_snapshot(self) -> Dict[str, Any]:
        """Collects a single timestamped snapshot of endpoint telemetry."""
        cpu = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory()

        proc_data = self.process_tracker.get_process_snapshot(limit_top=10)
        net_data = self.network_monitor.get_network_snapshot()

        snapshot = {
            "device_id": self.device_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "cpu_percent": round(float(cpu), 2),
            "memory_percent": round(float(mem.percent), 2),
            "memory_used_mb": round(mem.used / (1024 * 1024), 2),
            "process_count": proc_data["total_count"],
            "connection_count": net_data["connection_count"],
            "bytes_sent": net_data["bytes_sent"],
            "bytes_received": net_data["bytes_received"],
            "top_processes": proc_data["top_processes"],
            "new_process_count": proc_data["new_process_count"],
            "unique_remote_ips_count": net_data["unique_remote_ips_count"],
            "new_remote_ips": net_data["new_remote_ips"],
            "local_ip": net_data["local_ip"],
        }
        return snapshot
