"""Network Monitoring component for the DefenX Endpoint Agent.

Safely collects network I/O counters, active connection counts, and unique remote endpoints.
"""

from typing import Dict, Any, List, Set
import socket
import psutil


class NetworkMonitor:
    def __init__(self):
        self._known_remote_ips: Set[str] = set()

    def get_network_snapshot(self) -> Dict[str, Any]:
        """Collects network I/O counters and connection states safely."""
        io = psutil.net_io_counters()

        connections_count = 0
        current_remote_ips = set()
        active_connections_sample = []

        try:
            conns = psutil.net_connections(kind="inet")
            connections_count = len(conns)

            for c in conns:
                if c.raddr:
                    ip = c.raddr.ip
                    # Filter out localhost/loopback
                    if not ip.startswith("127.") and ip != "::1" and ip != "0.0.0.0":
                        current_remote_ips.add(ip)
                        if len(active_connections_sample) < 15:
                            active_connections_sample.append({
                                "status": c.status,
                                "local_port": c.laddr.port if c.laddr else None,
                                "remote_ip": ip,
                                "remote_port": c.raddr.port,
                            })
        except (psutil.AccessDenied, OSError):
            # Fallback when running without admin privileges on Windows
            connections_count = 0

        # Detect new remote destination IPs
        new_ips = current_remote_ips - self._known_remote_ips if self._known_remote_ips else set()
        self._known_remote_ips = current_remote_ips

        # Local IP
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
        except Exception:
            local_ip = "127.0.0.1"

        return {
            "bytes_sent": io.bytes_sent,
            "bytes_received": io.bytes_recv,
            "connection_count": connections_count,
            "unique_remote_ips_count": len(current_remote_ips),
            "new_remote_ips": list(new_ips)[:10],
            "local_ip": local_ip,
            "active_connections_sample": active_connections_sample,
        }
