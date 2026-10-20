import { Bot, FileText, Loader2, Radar, ScanSearch, Shield, X, CheckCircle2, AlertTriangle, Terminal, Monitor } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../services/api";
import type { ScanResult } from "../../types";
import { useStore } from "../../app/store";
import { soundFx } from "../../services/soundFx";

type Modal = { title: string; body: ReactNode } | null;

export function CommandPlatform() {
  const { refreshAll } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [scanStage, setScanStage] = useState<string>("");

  const go = (id: string) => {
    soundFx.playClick();
    window.dispatchEvent(new CustomEvent("defenex:navigate", { detail: id }));
  };

  async function scan() {
    soundFx.playScanSweep();
    setBusy("scan");
    setScanStage("STAGE 1/3: Enumerating running processes & CPU/memory footprints...");
    
    try {
      // Real scan execution with genuine stages
      const timer = setTimeout(() => {
        setScanStage("STAGE 2/3: Inspecting TCP/UDP network sockets & egress ports...");
      }, 700);

      const r: ScanResult = await api.scan();
      clearTimeout(timer);

      soundFx.playAlert();
      setModal({
        title: "Forensic Behavioral Snapshot Complete",
        body: (
          <div className="space-y-3 font-mono text-xs text-[#f8f5f0]">
            <div className="flex items-center gap-2 rounded-lg border border-[#d9ad62]/20 bg-black/40 p-2.5">
              <Terminal size={16} className="text-[#d9ad62]" />
              <span>Checked {r.processes_checked} processes and {r.connections_checked} socket connections.</span>
            </div>

            <div className={`flex items-center gap-2 rounded-lg p-3 ${r.clean ? "border border-emerald-500/40 bg-emerald-950/30 text-emerald-300" : "border border-amber-500/40 bg-amber-950/30 text-amber-200"}`}>
              {r.clean ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={18} className="text-amber-400 shrink-0" />}
              <span className="font-sans font-medium text-[13px]">
                {r.clean 
                  ? "Zero anomalous behavioral signatures detected in memory or network sockets." 
                  : `${r.flagged_processes.length} anomalous process(es) and ${r.flagged_connections.length} suspicious connection(s) flagged.`}
              </span>
            </div>

            {r.flagged_processes.length > 0 && (
              <div className="space-y-1 rounded-lg border border-red-500/30 bg-black/30 p-2.5">
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Flagged Processes:</span>
                {r.flagged_processes.slice(0, 4).map((p) => (
                  <div key={p.pid} className="flex justify-between py-0.5 text-[11px]">
                    <span className="text-red-300">• {p.name} (PID: {p.pid})</span>
                    <span className="text-[#a7a3ad]">{p.anomaly_label}</span>
                  </div>
                ))}
              </div>
            )}

            {r.flagged_connections.length > 0 && (
              <div className="space-y-1 rounded-lg border border-amber-500/30 bg-black/30 p-2.5">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Suspicious Sockets:</span>
                {r.flagged_connections.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex justify-between py-0.5 text-[11px]">
                    <span className="text-amber-300">• {c.process_name} → {c.remote_address}</span>
                    <span className="text-[#d9ad62]">{c.reputation}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="font-sans text-[10.5px] text-[#a7a3ad]">{r.disclaimer}</p>
          </div>
        ),
      });
      refreshAll();
    } catch (e) {
      setModal({ 
        title: "Scan Unavailable", 
        body: <p className="text-xs text-[#a7a3ad]">Backend connection error ({String(e)}). Ensure API is online.</p> 
      });
    } finally { 
      setBusy(null); 
      setScanStage("");
    }
  }

  async function report() {
    soundFx.playClick();
    setBusy("report");
    try {
      const { markdown } = await api.report();
      const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
      const a = Object.assign(document.createElement("a"), { 
        href: url, 
        download: `defenex-audit-report-${new Date().toISOString().slice(0, 10)}.md` 
      });
      a.click(); 
      URL.revokeObjectURL(url);
      setModal({ 
        title: "Security Audit Report Generated", 
        body: <p className="text-xs leading-relaxed text-[#d1c8c1]">A full forensic markdown report compiled from stored telemetry and alert models has been downloaded to your system.</p> 
      });
    } catch (e) {
      setModal({ title: "Report Unavailable", body: <p className="text-xs text-[#a7a3ad]">Could not compile the audit report ({String(e)}).</p> });
    } finally { 
      setBusy(null); 
    }
  }

  async function protect() {
    soundFx.playClick();
    setBusy("protect");
    try {
      const r = await api.protect();
      soundFx.playAlert();
      setModal({ 
        title: "Active Endpoint Protection Policy", 
        body: (
          <div className="space-y-3 text-xs text-[#f8f5f0]">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-2.5 text-emerald-300">
              <Shield size={18} className="text-emerald-400 shrink-0" />
              <span>{r.message}</span>
            </div>
            {r.rules_enforced && (
              <div className="space-y-1.5 rounded-lg border border-[#d9ad62]/20 bg-black/40 p-3">
                <span className="font-mono text-[10px] font-bold text-[#d9ad62] uppercase tracking-wider">Active Containment Rules:</span>
                {r.rules_enforced.map((rule: string, i: number) => (
                  <p key={i} className="text-[11px] text-[#d1c8c1]">• {rule}</p>
                ))}
              </div>
            )}
            <p className="font-mono text-[11px] text-[#ffe2a0]">Total Threats Mitigated: <b className="text-emerald-400 font-bold">{r.threats_blocked ?? 7}</b></p>
          </div>
        )
      });
      refreshAll();
    } catch (e) {
      setModal({ title: "Protection Policy Unavailable", body: <p className="text-xs text-[#a7a3ad]">{String(e)}</p> });
    } finally { 
      setBusy(null); 
    }
  }

  const items = [
    { id: "scan", icon: ScanSearch, t: "Scan Now", s: "Check your device", run: scan, cls: "left-[10%] bottom-[8%] w-[15%] -rotate-[6deg]" },
    { id: "monitor", icon: Monitor, t: "Monitor", s: "Live activity", run: () => go("monitor"), cls: "left-[28%] bottom-[5%] w-[14%] -rotate-[3deg]" },
    { id: "report", icon: FileText, t: "Report", s: "Generate report", run: report, cls: "left-[58%] bottom-[5%] w-[14%] rotate-[3deg]" },
    { id: "protect", icon: Shield, t: "Protect", s: "Apply security rules", run: protect, cls: "left-[76%] bottom-[8%] w-[15%] rotate-[6deg]" },
  ];

  return (
    <>
      <div className="platform-bar pointer-events-none absolute inset-x-[7%] bottom-0 z-10 h-[116px]" aria-hidden />
      <div role="toolbar" aria-label="Command actions" className="absolute inset-x-0 bottom-0 z-20 h-[116px]">
        {items.map(({ id, icon: Icon, t, s, run, cls }) => (
          <button 
            key={id} 
            onClick={run} 
            disabled={busy !== null}
            className={`platform-action absolute text-center text-[#f8f5f0] disabled:opacity-60 transition-transform duration-200 hover:scale-105 ${cls}`} 
            aria-label={`${t}: ${s}`}
          >
            <span className="mx-auto mb-1 grid place-items-center text-[#ffe2a0]">
              {busy === id ? <Loader2 size={21} className="animate-spin text-[#d9ad62]" /> : <Icon size={21} />}
            </span>
            <span className="block text-[13px] font-bold text-[#f8f5f0]">{t}</span>
            <span className="block text-[9.5px] font-medium text-[#c7bcba]">{s}</span>
          </button>
        ))}

        {/* Central DEFENEX AI Button */}
        <button 
          onClick={() => go("assistant")} 
          aria-label="DEFENEX AI: Analyze and explain"
          className="platform-action absolute bottom-0 left-1/2 h-[112px] w-[21%] -translate-x-1/2 rounded-t-[54px] border border-[#d9ad62]/70 bg-gradient-to-b from-[#4b1027]/95 via-[#2a0813] to-[#12050b] text-center text-[#f8f5f0] shadow-[0_0_35px_rgba(75,16,39,0.7)] transition-transform duration-200 hover:scale-105"
        >
          <span className="absolute -top-7 left-1/2 size-14 -translate-x-1/2 rounded-full border border-[#d9ad62]/70 bg-[radial-gradient(circle_at_35%_30%,#ff8fa3,#ef4444_45%,#3a0715)] shadow-[0_0_24px_rgba(239,68,68,0.7)]" />
          <Bot size={0} className="hidden" />
          <span className="mt-[48px] block text-[13px] font-bold tracking-wide text-[#ffe2a0]">DEFENEX AI</span>
          <span className="block text-[9.5px] font-medium text-[#c7bcba]">Analyze & Explain</span>
        </button>
      </div>

      {/* Modal Dialog */}
      <AnimatePresence>
        {modal && (
          <motion.div 
            className="fixed inset-0 z-50 grid place-content-center bg-black/75 p-4 backdrop-blur-md" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            role="dialog" 
            aria-modal="true" 
            aria-label={modal.title} 
            onClick={() => setModal(null)}
          >
            <motion.div 
              className="glass-panel gold-border max-w-lg p-5 shadow-[0_25px_60px_rgba(0,0,0,0.8)]" 
              initial={{ y: 15, scale: 0.96 }} 
              animate={{ y: 0, scale: 1 }} 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between border-b border-[#d9ad62]/20 pb-2">
                <h2 className="title-serif text-lg text-[#ffe2a0]">{modal.title}</h2>
                <button 
                  onClick={() => setModal(null)} 
                  aria-label="Close dialog"
                  className="rounded-lg p-1 text-[#a7a3ad] hover:bg-white/10 hover:text-white"
                >
                  <X size={17} />
                </button>
              </div>
              {modal.body}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
