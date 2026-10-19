"""DefenX Endpoint Agent Main Runner.

Continuously captures telemetry snapshots, dispatches them to the local/central
backend API, and displays status.
"""

import sys
import time
import signal
import os
from agent.collector import TelemetryCollector
from agent.event_sender import EventSender


def main():
    device_id = os.environ.get("AGENT_DEVICE_ID", "device-primary-win")
    interval = int(os.environ.get("AGENT_SAMPLE_INTERVAL", "5"))
    api_port = os.environ.get("DEFENX_API_PORT", os.environ.get("API_PORT", "8005"))
    api_url = os.environ.get("API_URL", f"http://127.0.0.1:{api_port}/api/v1/telemetry")
    api_key = os.environ.get("AGENT_API_KEY", "dev-agent-key-secret-9942")

    collector = TelemetryCollector(device_id=device_id)
    sender = EventSender(api_url=api_url, api_key=api_key)

    running = True

    def handle_sigint(sig, frame):
        nonlocal running
        print("\n[DefenX Agent] Stopping agent cleanly...")
        running = False

    signal.signal(signal.SIGINT, handle_sigint)
    signal.signal(signal.SIGTERM, handle_sigint)

    print(f"=====================================================")
    print(f"  DEFENX Endpoint Security Agent v1.0.0")
    print(f"  Target Device: {device_id}")
    print(f"  API Ingestion: {api_url}")
    print(f"  Sampling Interval: {interval}s")
    print(f"=====================================================")
    print("Press Ctrl+C to terminate.")

    while running:
        t0 = time.time()
        try:
            snapshot = collector.collect_snapshot()
            result = sender.send_telemetry(snapshot)

            status_indicator = "ONLINE" if result.get("success") else "BUFFERED"
            print(
                f"[{snapshot['timestamp'][11:19]}] {status_indicator} | "
                f"CPU: {snapshot['cpu_percent']:>4.1f}% | "
                f"RAM: {snapshot['memory_percent']:>4.1f}% | "
                f"Procs: {snapshot['process_count']:>3} | "
                f"Conns: {snapshot['connection_count']:>3} | "
                f"Net: ↑{snapshot['bytes_sent'] / (1024*1024):>6.2f}MB ↓{snapshot['bytes_received'] / (1024*1024):>6.2f}MB"
            )
        except Exception as e:
            print(f"[ERROR] Snapshot collection failure: {e}")

        # Precise interval sleep
        elapsed = time.time() - t0
        sleep_time = max(0.5, interval - elapsed)
        time.sleep(sleep_time)

    sender.close()
    print("[DefenX Agent] Agent exited gracefully.")


if __name__ == "__main__":
    main()
