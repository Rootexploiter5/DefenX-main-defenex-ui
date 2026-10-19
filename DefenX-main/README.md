# DEFENX: AI-Based Real-Time Anomaly Detection System for Personal Device Security

![Defense Shield](https://img.shields.io/badge/Security-Endpoint_Defense-06b6d4?style=for-the-badge&logo=shield)
![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-3b82f6?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-059669?style=for-the-badge&logo=fastapi)
![React + Vite](https://img.shields.io/badge/Frontend-React_TypeScript_Vite-6366f1?style=for-the-badge&logo=react)
![Isolation Forest](https://img.shields.io/badge/ML-Isolation_Forest-f59e0b?style=for-the-badge&logo=scikit-learn)
![License](https://img.shields.io/badge/License-MIT-slate?style=for-the-badge)

DEFENX learns patterns of ordinary activity on an authorized personal computer and highlights statistical and heuristic anomalies that deviate from that baseline. It combines endpoint telemetry collection, feature engineering, unsupervised machine learning (Isolation Forest), deterministic behavioral rules, calibrated risk scoring, forensic alert storage, and a real-time React web dashboard.

---

## 1. Architecture Pipeline

```text
┌────────────────────────────────────────────────────────┐
│                   Monitored Endpoint                   │
│                                                        │
│  Python Agent (agent/)                                 │
│   ├── Telemetry Collector (psutil)                     │
│   ├── Process Inventory Tracker                        │
│   ├── Network Socket Monitor                           │
│   └── Event Sender (HTTP POST + Offline Disk Buffer)   │
└──────────────────────────┬─────────────────────────────┘
                           │ Authenticated HTTP POST
                           ▼
┌────────────────────────────────────────────────────────┐
│               FastAPI Ingestion Engine                 │
│                                                        │
│  Validation → Feature Extraction & Delta Calculation   │
│   → Isolation Forest (ml/) → Heuristic Rules           │
│   → Calibrated Risk Scorer (0-100)                     │
│   → Deduplication Alert Manager → SQLite Database      │
│                     │                                  │
│                     └── WebSocket Streamer (/ws/alerts)│
└──────────────────────────┬─────────────────────────────┘
                           │ Real-Time WebSocket Push
                           ▼
┌────────────────────────────────────────────────────────┐
│              React + TypeScript Dashboard              │
│  Overview | Live Telemetry | Incident Investigation    │
│  Process Explorer | AI Analytics | Audit Trail         │
└────────────────────────────────────────────────────────┘
```

The end-to-end data flow operates strictly in:
**Collect → Validate → Normalize → Extract features → Detect anomalies → Calculate risk → Store evidence → Alert → Investigate → Evaluate**

---

## 2. Repository Structure

```text
DefenX-main/
├── agent/                      # Endpoint telemetry collection agent
│   ├── __init__.py
│   ├── collector.py            # Hardware & system snapshot collector
│   ├── network_monitor.py      # Network sockets & bandwidth tracker
│   ├── process_tracker.py      # Process inventory & novelty detector
│   ├── event_sender.py         # HTTP dispatcher with offline buffering
│   └── main.py                 # Agent background loop runner
├── backend/                    # Central API & detection server
│   ├── __init__.py
│   ├── main.py                 # FastAPI application & WebSocket broker
│   ├── database.py             # SQLAlchemy SQLite engine
│   ├── models.py               # ORM models (devices, telemetry, alerts, audit)
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── api/
│   │   ├── devices.py          # Device registration and health
│   │   ├── telemetry.py        # Telemetry ingestion & time-series queries
│   │   └── alerts.py           # Alert triage, status updates & audit log
│   └── services/
│       ├── detection.py        # Hybrid AI + rule-based evaluation engine
│       ├── risk_scoring.py     # 0-100 risk scoring & severity bands
│       └── alert_manager.py    # Fingerprint deduplication & persistence
├── ml/                         # Machine learning pipeline
│   ├── __init__.py
│   ├── feature_engineering.py  # Delta computation and vector scaling
│   ├── train.py                # Isolation Forest training script
│   ├── predict.py              # Real-time inference & Z-score explainability
│   ├── evaluate.py             # Precision, recall, F1, and latency benchmark
│   └── models/                 # Serialized model artifacts (.joblib)
├── frontend/                   # Modern React + TypeScript + Vite UI
│   ├── src/
│   │   ├── services/api.ts     # REST & WebSocket client
│   │   ├── App.tsx             # Cybersecurity console application
│   │   └── index.css           # Glassmorphism dark-mode styles
│   ├── package.json
│   └── vite.config.ts
├── tests/                      # Automated test suite
│   ├── test_collector.py       # Sensor keys & delta calculations
│   ├── test_detection.py       # Isolation Forest & rule trigger tests
│   ├── test_api.py             # FastAPI integration tests
│   └── test_alerts.py          # Alert lifecycle & audit verification
├── requirements.txt            # Python dependencies
├── .env.example                # Environment configuration template
├── .gitignore                  # Git ignore rules
└── README.md
```

---

## 3. Quick Start Guide

### 🚀 One-Command Launch (Recommended)
You can start the **entire platform** (Backend + React Dashboard + Endpoint Agent + Browser) with a single command:

```powershell
python run.py
```
*Or double-click `run.bat` on Windows.*

The runner will:
1. Verify pre-flight dependencies and automatically train the baseline ML model if missing.
2. Start the FastAPI Backend on `http://127.0.0.1:8005`.
3. Start the React + Vite Security Console on `http://localhost:5173`.
4. Start the Endpoint Telemetry Agent.
5. Automatically open the security console in your default web browser.
6. Gracefully shut down all services when you press `Ctrl+C`.

---

### Manual Step-by-Step Launch (Alternative)

#### Step 1: Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Step 2: Train or Validate the Baseline Isolation Forest Model
```bash
python -m ml.train
python -m ml.evaluate
```

#### Step 3: Run the Automated Test Suite
```bash
python -m pytest -v
```

#### Step 4: Launch Backend, Frontend, and Agent Manually
```bash
# Terminal 1: Backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8005

# Terminal 2: Dashboard
cd frontend && npm run dev

# Terminal 3: Agent
python -m agent.main
```
The agent captures local snapshots every 5 seconds and streams them to the backend API.

---

## 4. Key Security & Design Principles

1. **Non-Intrusive & Read-Only**: The agent only gathers telemetry and never executes arbitrary commands or blocks processes automatically without human confirmation.
2. **Transparent Explainability**: Every flagged anomaly includes an exact breakdown:
   - Isolation Forest raw outlier score & normalized component.
   - Triggered deterministic security rules (CPU abuse, memory pressure, port scans, data exfiltration surges).
   - Baseline Z-score deviations for every feature dimension.
   - Top active processes at the exact onset of the incident.
3. **Fingerprint Deduplication**: Prevents alert fatigue by throttling identical incident fingerprints with an intelligent cooldown window.
4. **Zero Hardcoded Secrets**: Uses environment variable configuration and secure key verification.
5. **Full Audit Logging**: All analyst state changes (`open` → `investigating` → `resolved` → `false_positive`) and rule triggers are immutably logged to the database.

---

## 5. License
MIT License. See `LICENSE` for details.


---

## DEFENEX UI (v2)

The frontend is now Vite + React + TypeScript (Tailwind v4, React Three Fiber, Framer Motion, Recharts, Lucide), replacing the Next.js console.
Run `python run.py` (or `cd frontend && npm install && npm run dev`) and open http://localhost:5173.

### New backend endpoints (`/api/v1`)
| Endpoint | Purpose |
|---|---|
| `GET /dashboard/summary` | Score, anomalies (24h), devices, critical count, telemetry-active flag |
| `GET /dashboard/anomaly-series?range=1h\|6h\|24h\|7d` | Bucketed chart data from stored telemetry + alerts |
| `GET /dashboard/resources` | Live CPU/memory/disk/network/temperature/battery (`null` when unsupported) |
| `GET /dashboard/events`, `/dashboard/devices` | Recent alerts; registered devices with real last-seen status |
| `GET /dashboard/threat-map` | Reports `available: false` until a GeoIP/threat-intel source is added |
| `POST /actions/scan`, `GET /actions/report`, `POST /actions/protect` | Behavioural scan, Markdown report, honest "not configured" for Protect |

### Implemented vs. needs configuration
- **Real data:** score, anomaly chart, resources, events, devices, scan, report, Ollama assistant (context built server-side from stored alerts).
- **Needs a data source:** Live Threat Map (optional, clearly labelled sample toggle).
- **Not implemented:** "Threats Blocked" and "Protect" (detection-only; shown as "—" / unavailable).
- **Environment-dependent:** temperature (not exposed by psutil on Windows), battery (laptops only), network % (needs link speed).
- Removed: the in-UI attack simulator and hardcoded agent/model metrics, so nothing fake is shown as real.
