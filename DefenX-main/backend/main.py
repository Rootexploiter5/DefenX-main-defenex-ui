"""DefenX FastAPI Application Server.

Exposes RESTful endpoints for endpoint security telemetry ingestion, device management,
alert investigation workflows, AI evaluation diagnostics, and WebSocket alert streaming.
"""

import os
from typing import List
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.database import engine, Base
from backend.api.devices import router as devices_router
from backend.api.telemetry import router as telemetry_router, set_ws_broadcast_callback
from backend.api.alerts import router as alerts_router
from backend.api.ai import router as ai_router
from backend.api.system import router as system_router
from backend.api.dashboard import router as dashboard_router
from backend.api.actions import router as actions_router

# Initialize database tables
Base.metadata.create_all(bind=engine)


class ConnectionManager:
    """Manages active WebSocket connections for live alert and telemetry broadcast."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


ws_manager = ConnectionManager()
set_ws_broadcast_callback(ws_manager.broadcast)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print("[DefenX Backend] Security API starting up...")
    yield
    # Shutdown actions
    print("[DefenX Backend] Security API shut down cleanly.")


app = FastAPI(
    title="DefenX - Personal Device Security API",
    version="1.0.0",
    description="Real-Time Endpoint Anomaly Detection Platform with Isolation Forest and Heuristic Rules.",
    lifespan=lifespan,
)

# CORS Configuration
origins = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://localhost:8000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api/v1
app.include_router(devices_router, prefix="/api/v1")
app.include_router(telemetry_router, prefix="/api/v1")
app.include_router(alerts_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(system_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(actions_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "personal-device-security",
        "version": "1.0.0",
        "active_ws_clients": len(ws_manager.active_connections),
    }


@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """WebSocket endpoint streaming live telemetry updates and newly detected security alerts."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive receive ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("DEFENX_API_PORT", os.environ.get("API_PORT", 8005)))
    uvicorn.run("backend.main:app", host="127.0.0.1", port=port, reload=True)
