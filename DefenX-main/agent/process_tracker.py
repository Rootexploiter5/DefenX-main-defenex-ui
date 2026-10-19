"""Process Tracking component for the DefenX Endpoint Agent.

Safely enumerates processes, extracts resource usage, and detects newly spawned processes.
"""

from typing import List, Dict, Any, Set
import psutil


class ProcessTracker:
    def __init__(self):
        self._known_pids: Set[int] = set()

    def get_process_snapshot(self, limit_top: int = 10) -> Dict[str, Any]:
        """Collects process metrics, top consumers, and newly observed PIDs."""
        current_pids = set()
        processes_info = []

        for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent", "status"]):
            try:
                info = p.info
                pid = info.get("pid")
                if pid:
                    current_pids.add(pid)
                    processes_info.append({
                        "pid": pid,
                        "name": info.get("name") or "unknown",
                        "cpu_percent": float(info.get("cpu_percent") or 0.0),
                        "memory_percent": round(float(info.get("memory_percent") or 0.0), 2),
                        "status": info.get("status") or "running",
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

        # Sort top processes by CPU and memory
        top_processes = sorted(
            processes_info,
            key=lambda x: (x["cpu_percent"] + x["memory_percent"]),
            reverse=True,
        )[:limit_top]

        # Novelty / spawned processes since last snapshot
        new_pids = current_pids - self._known_pids if self._known_pids else set()
        self._known_pids = current_pids

        return {
            "total_count": len(processes_info),
            "top_processes": top_processes,
            "new_process_count": len(new_pids),
        }
