"""DefenX Master Runner.

Launches the complete DefenX AI Endpoint Security Platform with a single command:
1. Pre-flight verification (trains ML model if missing, checks npm packages)
2. FastAPI Backend Service (port 8005)
3. React + Vite Security Dashboard (port 5173)
4. Real-Time Telemetry Endpoint Agent
5. Opens browser to the security console
6. Handles graceful multi-process termination on Ctrl+C.
"""

import sys
import os
import subprocess
import time
import signal
import socket
import threading
import webbrowser

# ANSI Colors
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
MAGENTA = "\033[95m"
BLUE = "\033[94m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

API_PORT = int(os.environ.get("DEFENX_API_PORT", 8005))
FRONTEND_PORT = int(os.environ.get("DEFENX_FRONTEND_PORT", 5173))
os.environ["DEFENX_API_PORT"] = str(API_PORT)
os.environ["DEFENX_FRONTEND_PORT"] = str(FRONTEND_PORT)

processes = []


def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0


def stream_output(pipe, prefix: str, color: str):
    try:
        for line in iter(pipe.readline, ""):
            if not line:
                break
            stripped = line.rstrip()
            if stripped:
                print(f"{color}{prefix}{RESET} {stripped}")
    except (ValueError, IOError):
        pass


def kill_all_processes():
    print(f"\n{YELLOW}[DEFENX]{RESET} Gracefully shutting down all services...")
    for p, name in reversed(processes):
        try:
            if p.poll() is None:
                # Windows process tree termination
                if sys.platform == "win32":
                    subprocess.call(["taskkill", "/F", "/T", "/PID", str(p.pid)],
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    p.terminate()
        except Exception:
            pass
    print(f"{GREEN}[DEFENX]{RESET} All services stopped.")


def signal_handler(sig, frame):
    kill_all_processes()
    sys.exit(0)


def preflight_checks():
    print(f"{CYAN}{BOLD}================================================================{RESET}")
    print(f"{CYAN}{BOLD}      DEFENX: AI Endpoint Anomaly Detection Platform            {RESET}")
    print(f"{CYAN}{BOLD}================================================================{RESET}")
    print(f"{BLUE}[1/4]{RESET} Running pre-flight checks...")

    # 1. Model Artifact Check
    model_path = os.path.join("ml", "models", "anomaly_model.joblib")
    if not os.path.exists(model_path):
        print(f"{YELLOW}[ML]{RESET} No trained model artifact found. Training baseline model...")
        subprocess.run([sys.executable, "-m", "ml.train"], check=True)
        print(f"{GREEN}[ML]{RESET} Baseline model trained successfully.")
    else:
        print(f"{GREEN}[ML]{RESET} Isolation Forest model artifact verified ({model_path}).")

    # 2. Frontend node_modules check
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    node_modules = os.path.join(frontend_dir, "node_modules")
    if not os.path.exists(node_modules):
        print(f"{YELLOW}[UI]{RESET} Installing frontend node modules (npm install)...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        subprocess.run([npm_cmd, "install"], cwd=frontend_dir, check=True)
        print(f"{GREEN}[UI]{RESET} Node modules installed successfully.")

    # 3. Ollama AI Daemon Check
    try:
        import urllib.request
        with urllib.request.urlopen("http://127.0.0.1:11434/api/tags", timeout=1.5) as r:
            if r.status == 200:
                print(f"{GREEN}[OLLAMA]{RESET} Local Ollama LLM service detected and active (http://127.0.0.1:11434).")
    except Exception:
        print(f"{YELLOW}[OLLAMA]{RESET} Ollama daemon not responding. (Run 'ollama serve' for local AI Copilot).")

    # 4. Port check
    if is_port_in_use(API_PORT):
        print(f"{YELLOW}[WARN]{RESET} Port {API_PORT} is currently in use. Existing service may conflict.")


def main():
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    preflight_checks()

    # 1. Launch Backend API
    print(f"\n{BLUE}[2/4]{RESET} Starting FastAPI backend on http://127.0.0.1:{API_PORT}...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", str(API_PORT), "--reload"],
        cwd=BASE_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    processes.append((backend_proc, "Backend"))
    threading.Thread(target=stream_output, args=(backend_proc.stdout, "[BACKEND]", CYAN), daemon=True).start()

    # 2. Launch Next.js Dashboard
    print(f"{BLUE}[3/4]{RESET} Starting Vite + React DEFENEX console on http://localhost:{FRONTEND_PORT}...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_dir = os.path.join(BASE_DIR, "frontend")
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev", "--", "--port", str(FRONTEND_PORT)],
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        shell=(sys.platform == "win32"),
    )
    processes.append((frontend_proc, "Frontend"))
    threading.Thread(target=stream_output, args=(frontend_proc.stdout, "[FRONTEND]", MAGENTA), daemon=True).start()

    # Wait for backend & frontend to boot
    time.sleep(3)

    # 3. Launch Endpoint Agent
    print(f"{BLUE}[4/4]{RESET} Starting Endpoint Security Agent...")
    agent_proc = subprocess.Popen(
        [sys.executable, "-m", "agent.main"],
        cwd=BASE_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    processes.append((agent_proc, "Agent"))
    threading.Thread(target=stream_output, args=(agent_proc.stdout, "[AGENT]", GREEN), daemon=True).start()

    print(f"\n{GREEN}{BOLD}================================================================{RESET}")
    print(f"{GREEN}{BOLD}  DEFENX IS LIVE!                                               {RESET}")
    print(f"{GREEN}{BOLD}  - Security Console:   http://localhost:{FRONTEND_PORT}                 {RESET}")
    print(f"{GREEN}{BOLD}  - Backend Swagger:    http://127.0.0.1:{API_PORT}/docs               {RESET}")
    print(f"{GREEN}{BOLD}  - Telemetry Stream:   Active (every 5 seconds)                {RESET}")
    print(f"{GREEN}{BOLD}  - Press Ctrl+C at any time to stop all services               {RESET}")
    print(f"{GREEN}{BOLD}================================================================{RESET}\n")

    # Open browser automatically
    try:
        webbrowser.open(f"http://localhost:{FRONTEND_PORT}")
    except Exception:
        pass

    # Keep alive loop
    try:
        while True:
            time.sleep(1)
            # If backend or frontend died unexpectedly, break
            if backend_proc.poll() is not None:
                print(f"{RED}[ERROR]{RESET} Backend process exited unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print(f"{RED}[ERROR]{RESET} Frontend process exited unexpectedly.")
                break
    except KeyboardInterrupt:
        pass
    finally:
        kill_all_processes()


if __name__ == "__main__":
    main()
