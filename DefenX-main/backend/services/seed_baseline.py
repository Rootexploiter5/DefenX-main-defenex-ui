"""Seeds realistic 24-hour baseline telemetry and security alerts.

Fills each historical time bucket so anomaly analytics, threat maps,
and event logs show rich, realistic real-time telemetry curves.
"""

import json
import math
import random
from datetime import datetime, timedelta, timezone
from backend.database import SessionLocal
from backend.models import Device, Telemetry, Alert, AuditEvent

def seed_24h_history(device_id: str = "device-primary-win"):
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        
        # Ensure device exists
        dev = db.query(Device).filter(Device.id == device_id).first()
        if not dev:
            dev = Device(
                id=device_id,
                device_name=f"Host-{device_id}",
                platform="Windows",
                agent_version="1.0.0",
                registered_at=now - timedelta(hours=24),
                last_seen_at=now,
            )
            db.add(dev)
            db.commit()

        # Check existing records in the past 24h
        cutoff = (now - timedelta(hours=23)).replace(tzinfo=None)
        existing_past = db.query(Telemetry).filter(Telemetry.timestamp < cutoff).count()
        if existing_past > 50:
            print(f"Database already has {existing_past} historical telemetry records.")
            return

        print("Seeding 24-hour historical telemetry baseline...")
        
        # 1 sample every 5 minutes for 24 hours = 288 points
        samples = []
        alerts_to_create = []
        
        # Specific anomaly timestamps (hours ago)
        anomaly_windows = {
            20.5: ("Suspicious outbound socket burst to port 4444", "High", 78.5, "HeuristicRules"),
            16.2: ("Multi-dimensional statistical outlier: CPU & Egress spike", "Medium", 64.0, "IsolationForest"),
            11.8: ("Unusual child process tree spawned by powershell.exe", "High", 82.0, "Hybrid"),
            7.5: ("Rapid sequence of new external IP connections", "Medium", 58.0, "HeuristicRules"),
            3.2: ("High CPU utilization sustained > 90% during idle period", "Low", 42.0, "IsolationForest"),
            0.8: ("Anomalous network egress delta with suspicious port 1337", "Critical", 91.5, "Hybrid"),
        }

        remote_ips_pool = [
            ("185.190.141.22", "NL", "Netherlands", [52.37, 4.89]),
            ("198.51.100.45", "US", "United States", [37.77, -122.42]),
            ("103.251.167.10", "SG", "Singapore", [1.35, 103.82]),
            ("91.240.118.89", "DE", "Germany", [52.52, 13.40]),
            ("194.26.29.112", "RU", "Russia", [55.75, 37.62]),
            ("220.181.38.148", "CN", "China", [39.90, 116.40]),
            ("81.2.69.142", "GB", "United Kingdom", [51.51, -0.13]),
        ]

        for step in range(288, 5, -1):  # stop 25 min ago to preserve live agent records
            ts = now - timedelta(minutes=step * 5)
            hours_ago = step * 5 / 60.0
            
            # Sinusoidal diurnal wave
            wave = math.sin((24.0 - hours_ago) / 24.0 * 2 * math.pi)
            
            # Base values with subtle noise
            cpu = round(max(3.0, min(85.0, 14.0 + 8.0 * wave + random.gauss(0, 3.5))), 1)
            mem = round(max(40.0, min(88.0, 68.0 + 4.0 * wave + random.gauss(0, 1.2))), 1)
            procs = int(max(120, 195 + 15 * wave + random.randint(-8, 8)))
            conns = int(max(18, 48 + 12 * wave + random.randint(-6, 6)))
            bytes_sent = round(max(500.0, 45000.0 + random.expovariate(1 / 30000.0)), 1)
            bytes_recv = round(max(1000.0, 95000.0 + random.expovariate(1 / 75000.0)), 1)
            
            # Check if this point falls near an anomaly window
            is_anomaly = False
            for anom_h, (summary, severity, risk, detector) in anomaly_windows.items():
                if abs(hours_ago - anom_h) < 0.08:
                    is_anomaly = True
                    cpu = min(98.0, cpu + 55.0)
                    conns = conns + 45
                    bytes_sent = bytes_sent + 2500000.0
                    
                    ip_info = random.choice(remote_ips_pool)
                    evidence = {
                        "features": {
                            "cpu_percent": cpu,
                            "memory_percent": mem,
                            "process_count": procs,
                            "connection_count": conns,
                            "bytes_sent_delta": bytes_sent,
                            "bytes_received_delta": bytes_recv,
                        },
                        "triggered_rules": [{"id": "R01", "title": summary}],
                        "top_deviations": [{"feature": "cpu_percent", "z_score": 3.8, "direction": "high"}],
                        "top_processes": [
                            {"name": "powershell.exe", "pid": 4820, "cpu_percent": 68.5, "memory_percent": 12.0},
                            {"name": "conhost.exe", "pid": 4824, "cpu_percent": 1.2, "memory_percent": 0.8},
                        ],
                        "new_remote_ips": [ip_info[0]],
                    }
                    
                    alerts_to_create.append(Alert(
                        device_id=device_id,
                        timestamp=ts.replace(tzinfo=None),
                        severity=severity,
                        risk_score=risk,
                        detector=detector,
                        summary=summary,
                        evidence_json=json.dumps(evidence),
                        status="resolved" if hours_ago > 4 else "open",
                        model_version="1.0.0",
                        fingerprint=f"{device_id}:rule-{anom_h}",
                    ))
                    break

            raw_evidence = json.dumps({
                "top_processes": [
                    {"name": "explorer.exe", "pid": 1204, "cpu_percent": 1.5, "memory_percent": 4.2},
                    {"name": "chrome.exe", "pid": 3340, "cpu_percent": 4.1, "memory_percent": 8.5},
                    {"name": "python.exe", "pid": 9840, "cpu_percent": 2.2, "memory_percent": 3.1},
                ],
                "new_remote_ips": [random.choice(remote_ips_pool)[0]] if random.random() < 0.25 else [],
                "local_ip": "192.168.1.105",
            })

            samples.append(Telemetry(
                device_id=device_id,
                timestamp=ts.replace(tzinfo=None),
                cpu_percent=cpu,
                memory_percent=mem,
                process_count=procs,
                connection_count=conns,
                bytes_sent_delta=bytes_sent,
                bytes_received_delta=bytes_recv,
                raw_evidence=raw_evidence,
            ))

        db.bulk_save_objects(samples)
        db.bulk_save_objects(alerts_to_create)
        
        # Add a few audit events
        audit_events = [
            AuditEvent(
                timestamp=(now - timedelta(hours=20)).replace(tzinfo=None),
                actor="analyst",
                action="STATUS_CHANGE",
                target_id="1",
                result="Investigated outbound burst; verified legitimate cloud sync job.",
            ),
            AuditEvent(
                timestamp=(now - timedelta(hours=11)).replace(tzinfo=None),
                actor="detection_engine",
                action="ALERT_GENERATED",
                target_id="3",
                result="Generated High alert: Unusual child process tree spawned by powershell.exe",
            ),
            AuditEvent(
                timestamp=(now - timedelta(hours=2)).replace(tzinfo=None),
                actor="operator",
                action="SCAN_EXECUTE",
                target_id="device-primary-win",
                result="Initiated deep behavioral scan: 485 processes checked, clean.",
            ),
        ]
        db.bulk_save_objects(audit_events)
        db.commit()
        print(f"Successfully seeded {len(samples)} baseline telemetry points and {len(alerts_to_create)} historical alerts.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_24h_history()
