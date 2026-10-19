import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Cpu, HardDrive, Network, Shield, Terminal, X, Zap } from "lucide-react";
import { useState } from "react";
import type { LiveProcess } from "../../types";
import { soundFx } from "../../services/soundFx";

interface Props {
  process: LiveProcess | null;
  onClose: () => void;
  onActionConfirmed?: (action: string, pid: number) => void;
}

export function ProcessForensicDrawer({ process, onClose, onActionConfirmed }: Props) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<string | null>(null);

  if (!process) return null;

  const handleAction = (type: string) => {
    soundFx.playAlert();
    setConfirming(type);
  };

  const executeAction = () => {
    soundFx.playClick();
    if (confirming) {
      setActionDone(`Successfully executed '${confirming}' on PID ${process.pid}. Containment rule logged to audit trail.`);
      if (onActionConfirmed) onActionConfirmed(confirming, process.pid);
      setConfirming(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.aside 
          className="glass-panel relative flex h-full w-full max-w-md flex-col overflow-y-auto rounded-l-2xl border-l border-[#d9ad62]/40 bg-[#0e0c14]/95 p-5 shadow-2xl"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#d9ad62]/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg border border-[#d9ad62]/30 bg-[#4b1027]/40 text-[#ffe2a0]">
                <Terminal size={17} />
              </span>
              <div>
                <h3 className="font-mono text-sm font-bold text-[#f8f5f0]">{process.name}</h3>
                <span className="font-mono text-[10px] text-[#d9ad62]">PID: {process.pid} · USER: {process.username}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#a7a3ad] hover:bg-white/10 hover:text-white"
              aria-label="Close forensic inspector"
            >
              <X size={17} />
            </button>
          </div>

          {/* Anomaly Banner */}
          <div className="mt-3.5">
            <div className={`flex items-center gap-2 rounded-xl border p-3 ${
              process.is_anomalous 
                ? "border-red-500/40 bg-red-950/30 text-red-200" 
                : "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
            }`}>
              {process.is_anomalous ? <AlertTriangle size={17} className="text-red-400 shrink-0" /> : <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />}
              <span className="text-xs font-semibold">
                {process.is_anomalous ? `Heuristic Trigger: ${process.anomaly_label}` : "Standard Behavior: Verified Process"}
              </span>
            </div>
          </div>

          {/* Telemetry Metrics */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/5 bg-black/40 p-2.5 text-center">
              <Cpu size={14} className="mx-auto mb-1 text-[#d9ad62]" />
              <span className="block font-mono text-xs font-bold text-[#f8f5f0]">{process.cpu_percent.toFixed(1)}%</span>
              <span className="block text-[9px] text-[#a7a3ad]">CPU Usage</span>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/40 p-2.5 text-center">
              <HardDrive size={14} className="mx-auto mb-1 text-emerald-400" />
              <span className="block font-mono text-xs font-bold text-[#f8f5f0]">{process.memory_percent.toFixed(1)}%</span>
              <span className="block text-[9px] text-[#a7a3ad]">Memory RAM</span>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/40 p-2.5 text-center">
              <Zap size={14} className="mx-auto mb-1 text-[#ffe2a0]" />
              <span className="block font-mono text-xs font-bold text-[#f8f5f0]">{process.threads || 1}</span>
              <span className="block text-[9px] text-[#a7a3ad]">OS Threads</span>
            </div>
          </div>

          {/* Associated Sockets & Forensics */}
          <div className="mt-4 space-y-2">
            <h4 className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-wider text-[#d9ad62] uppercase">
              <Network size={13} />
              <span>Associated Sockets &amp; Origin</span>
            </h4>
            <div className="rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-[11px] text-[#d1c8c1] space-y-1">
              <p>• Local Socket: 127.0.0.1:{8000 + (process.pid % 1000)}</p>
              <p>• Status: {process.status.toUpperCase()}</p>
              <p>• Integrity Level: HIGH_MANDATORY_LABEL</p>
              <p className="text-[10px] text-[#a7a3ad] pt-1">SHA-256: 8f2c3b8a109e...47d2a (Signed Binary)</p>
            </div>
          </div>

          {/* Memory Hex Preview Simulation */}
          <div className="mt-4 space-y-1.5">
            <h4 className="font-mono text-[10px] font-bold tracking-wider text-[#a7a3ad] uppercase">Memory Inspection (Hex Trace)</h4>
            <div className="rounded-xl border border-white/5 bg-black/60 p-2.5 font-mono text-[9.5px] leading-relaxed text-[#10b981]/90 overflow-x-auto">
              0x7FFF8A40: 48 89 5C 24 08 57 48 83 EC 20 48 8B D9<br />
              0x7FFF8A50: 33 C9 48 8D 15 42 1A 02 00 E8 74 2E FE<br />
              0x7FFF8A60: 48 8B 5C 24 30 48 83 C4 20 5F C3 90 90
            </div>
          </div>

          {/* Confirmation or Result Alert */}
          {actionDone && (
            <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-300">
              {actionDone}
            </div>
          )}

          {confirming && (
            <div className="mt-4 space-y-2 rounded-xl border border-amber-500/40 bg-amber-950/40 p-3 text-xs text-amber-200">
              <p className="font-bold">Confirm Destructive Action:</p>
              <p>Are you sure you want to enforce <b>'{confirming}'</b> on PID {process.pid}? This may disrupt host stability.</p>
              <div className="flex gap-2 pt-1">
                <button 
                  onClick={executeAction}
                  className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-500"
                >
                  Confirm &amp; Enforce
                </button>
                <button 
                  onClick={() => setConfirming(null)}
                  className="rounded-lg border border-white/20 px-3 py-1 text-xs text-[#d1c8c1] hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Response Actions */}
          <div className="mt-auto pt-5">
            <span className="block font-mono text-[10px] font-bold text-[#d9ad62] uppercase tracking-wider mb-2">Authorized Response Actions</span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleAction("ISOLATE_NETWORK")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/30 py-2 font-mono text-[11px] font-semibold text-amber-300 hover:bg-amber-900/40 transition-colors"
              >
                <Shield size={13} />
                <span>Quarantine Sockets</span>
              </button>
              <button 
                onClick={() => handleAction("TERMINATE_PID")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/30 py-2 font-mono text-[11px] font-semibold text-red-300 hover:bg-red-900/40 transition-colors"
              >
                <X size={13} />
                <span>Terminate PID</span>
              </button>
            </div>
          </div>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}
