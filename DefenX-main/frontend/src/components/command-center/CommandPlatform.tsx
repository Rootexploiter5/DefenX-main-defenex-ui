import { Bot, FileText, Loader2, Radar, ScanSearch, Shield, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../services/api";
import type { ScanResult } from "../../types";
import { useStore } from "../../app/store";

type Modal = { title: string; body: ReactNode } | null;

export function CommandPlatform() {
  const { refreshAll } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);

  const go = (id: string) => window.dispatchEvent(new CustomEvent("defenex:navigate", { detail: id }));

  async function scan() {
    setBusy("scan");
    try {
      const r: ScanResult = await api.scan();
      setModal({
        title: "Scan complete",
        body: (
          <div className="space-y-2 text-sm">
            <p>Checked {r.processes_checked} processes and {r.connections_checked} connections.</p>
            <p className={r.clean ? "text-emerald-300" : "text-amber-300"}>
              {r.clean ? "No processes or sockets matched the behavioural heuristics." : `${r.flagged_processes.length} process(es) and ${r.flagged_connections.length} connection(s) flagged.`}
            </p>
            {r.flagged_processes.slice(0, 5).map((p) => <p key={p.pid} className="text-xs">• {p.name} (PID {p.pid}) — {p.anomaly_label}</p>)}
            {r.flagged_connections.slice(0, 5).map((c, i) => <p key={i} className="text-xs">• {c.process_name} → {c.remote_address} — {c.reputation}</p>)}
            <p className="text-xs text-[#D8C2B6]">{r.disclaimer}</p>
          </div>
        ),
      });
      refreshAll();
    } catch (e) {
      setModal({ title: "Scan unavailable", body: <p className="text-sm">The backend could not run the scan ({String(e)}). Is the API running?</p> });
    } finally { setBusy(null); }
  }

  async function report() {
    setBusy("report");
    try {
      const { markdown } = await api.report();
      const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: `defenex-report-${new Date().toISOString().slice(0, 10)}.md` });
      a.click(); URL.revokeObjectURL(url);
      setModal({ title: "Report generated", body: <p className="text-sm">A Markdown report built from stored alerts and telemetry has been downloaded.</p> });
    } catch (e) {
      setModal({ title: "Report unavailable", body: <p className="text-sm">Could not build the report ({String(e)}).</p> });
    } finally { setBusy(null); }
  }

  async function protect() {
    setBusy("protect");
    try {
      const r = await api.protect();
      setModal({ title: r.available ? "Protection" : "Protection not configured", body: <p className="text-sm">{r.message}</p> });
    } catch (e) {
      setModal({ title: "Protection unavailable", body: <p className="text-sm">{String(e)}</p> });
    } finally { setBusy(null); }
  }

  const items = [
    { id: "scan", icon: ScanSearch, t: "Scan Now", s: "Check your device", run: scan, cls: "left-[11%] bottom-[8%] w-[14%] -rotate-[7deg]" },
    { id: "monitor", icon: Shield, t: "Monitor", s: "View live activity", run: () => go("monitor"), cls: "left-[28%] bottom-[5%] w-[14%] -rotate-[3deg]" },
    { id: "report", icon: FileText, t: "Report", s: "Generate report", run: report, cls: "left-[58%] bottom-[5%] w-[14%] rotate-[3deg]" },
    { id: "protect", icon: Radar, t: "Protect", s: "Apply security rules", run: protect, cls: "left-[76%] bottom-[8%] w-[14%] rotate-[7deg]" },
  ];

  return (
    <>
      <div className="platform-bar pointer-events-none absolute inset-x-[7%] bottom-0 z-10 h-[118px]" aria-hidden />
      <div role="toolbar" aria-label="Command actions" className="absolute inset-x-0 bottom-0 z-20 h-[118px]">
        {items.map(({ id, icon: Icon, t, s, run, cls }) => (
          <button key={id} onClick={run} disabled={busy !== null}
            className={`platform-action absolute text-center text-[#FFF1D6] disabled:opacity-60 ${cls}`} aria-label={`${t}: ${s}`}>
            <span className="mx-auto mb-1 grid place-items-center text-[#FFD98F]">
              {busy === id ? <Loader2 size={22} className="animate-spin" /> : <Icon size={22} />}
            </span>
            <span className="block text-[13px] font-semibold">{t}</span>
            <span className="block text-[10px] text-[#D8C2B6]">{s}</span>
          </button>
        ))}
        <button onClick={() => go("assistant")} aria-label="DEFENEX AI: Analyze and explain"
          className="platform-action absolute bottom-0 left-1/2 h-[112px] w-[22%] -translate-x-1/2 rounded-t-[60px] border border-[#D9AD62]/80 bg-gradient-to-b from-[#6a1330]/90 to-[#2a0813] text-center text-[#FFF1D6] shadow-[0_0_30px_rgba(217,35,61,0.55)]">
          <span className="absolute -top-7 left-1/2 size-14 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ff7a8a,#D9233D_45%,#4a0816)] shadow-[0_0_26px_#D9233D]" />
          <Bot size={0} className="hidden" />
          <span className="mt-[52px] block text-[13px] font-semibold">DEFENEX AI</span>
          <span className="block text-[10px] text-[#D8C2B6]">Analyze &amp; Explain</span>
        </button>
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div className="absolute inset-0 z-40 grid place-items-center bg-black/55 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog" aria-modal="true" aria-label={modal.title} onClick={() => setModal(null)}>
            <motion.div className="panel-dark gold-border max-w-md p-5" initial={{ y: 12, scale: 0.97 }} animate={{ y: 0, scale: 1 }} onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="title-serif text-xl text-[#FFE2A0]">{modal.title}</h2>
                <button onClick={() => setModal(null)} aria-label="Close dialog"><X size={18} /></button>
              </div>
              {modal.body}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
