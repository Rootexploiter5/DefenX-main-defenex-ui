"""Event Sender component for the DefenX Endpoint Agent.

Dispatches telemetry to the central FastAPI ingestion endpoint.
Buffers events locally in CSV if the backend is unreachable.
"""

import os
import csv
from typing import Dict, Any, Optional
import httpx


class EventSender:
    def __init__(
        self,
        api_url: str = "http://127.0.0.1:8000/api/v1/telemetry",
        api_key: str = "dev-agent-key-secret-9942",
        offline_buffer_file: str = "data/offline_telemetry.csv",
    ):
        self.api_url = api_url
        self.api_key = api_key
        self.offline_buffer_file = offline_buffer_file
        self.client = httpx.Client(timeout=3.0)

    def send_telemetry(self, snapshot: Dict[str, Any]) -> Dict[str, Any]:
        """Transmits snapshot to backend; falls back to offline disk buffer on connection error."""
        headers = {
            "Content-Type": "application/json",
            "X-Agent-Key": self.api_key,
        }

        try:
            resp = self.client.post(self.api_url, json=snapshot, headers=headers)
            if resp.status_code in (200, 201):
                return {"success": True, "status": "sent", "response": resp.json()}
            else:
                self._buffer_locally(snapshot)
                return {"success": False, "status": "buffered", "error": f"HTTP {resp.status_code}"}
        except Exception as e:
            self._buffer_locally(snapshot)
            return {"success": False, "status": "offline_buffered", "error": str(e)}

    def _buffer_locally(self, snapshot: Dict[str, Any]) -> None:
        """Appends snapshot to offline CSV."""
        try:
            os.makedirs(os.path.dirname(self.offline_buffer_file), exist_ok=True)
            fields = [
                "timestamp",
                "cpu_percent",
                "memory_percent",
                "process_count",
                "connection_count",
                "bytes_sent",
                "bytes_received",
            ]
            write_header = (
                not os.path.exists(self.offline_buffer_file)
                or os.path.getsize(self.offline_buffer_file) == 0
            )
            with open(self.offline_buffer_file, "a", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
                if write_header:
                    writer.writeheader()
                writer.writerow(snapshot)
        except Exception as buffer_err:
            print(f"Warning: Failed to buffer offline telemetry: {buffer_err}")

    def close(self):
        self.client.close()
