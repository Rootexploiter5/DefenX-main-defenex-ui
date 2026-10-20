"""DefenX Master Root Launcher.
Directs execution to DefenX-main/run.py.
"""
import os
import sys
import subprocess

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
TARGET_DIR = os.path.join(ROOT_DIR, "DefenX-main")
RUN_SCRIPT = os.path.join(TARGET_DIR, "run.py")

if not os.path.exists(RUN_SCRIPT):
    print(f"[ERROR] Cannot locate {RUN_SCRIPT}")
    sys.exit(1)

sys.exit(subprocess.call([sys.executable, RUN_SCRIPT] + sys.argv[1:], cwd=TARGET_DIR))
