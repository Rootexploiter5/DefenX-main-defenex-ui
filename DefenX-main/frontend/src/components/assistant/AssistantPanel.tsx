import { motion } from "framer-motion";
import { Mic, Send, Shield, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePoll } from "../../hooks/usePoll";
import { useStore } from "../../app/store";
import { api } from "../../services/api";
import type { ChatMessage } from "../../types";

const SUGGESTIONS = [
  { label: "Explain last anomaly", prompt: "Explain the most recent anomaly using the alert data you were given." },
  { label: "Is my device safe?", prompt: "Based only on the current data, is my device safe? Say what you can and cannot tell." },
  { label: "Generate security report", prompt: "Generate a short security report from the current data." },
  { label: "Give security recommendations", prompt: "Give security recommendations based on the current data." },
];

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function AssistantPanel({ tall = false }: { tall?: boolean }) {
  const { profile } = useStore();
  const status = usePoll(api.aiStatus, 15000);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const online = !!status.data?.available;
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);

  async function send(text: string) {
    const q = text.trim().slice(0, 2000);
    if (!q || busy) return;
    const history = msgs.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, { role: "user", content: q, time: now() }]);
    setInput(""); setBusy(true);
    try {
      const r = await api.chat(q, history);
      setMsgs((m) => [...m, { role: "assistant", content: r.reply, time: now(), error: !r.success }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: `The DEFENEX backend is unreachable (${String(e)}).`, time: now(), error: true }]);
    } finally { setBusy(false); }
  }

  return (
    <aside aria-label="DEFENEX AI Assistant" className={`glass-panel flex flex-col p-4 ${tall ? "h-[calc(100vh-130px)] min-h-[520px]" : "h-[500px]"}`}>
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#D9AD62]/60 bg-[radial-gradient(circle,#4b1027,#11121a)] shadow-[0_0_15px_rgba(75,16,39,.6)]">
          <Shield size={22} className="text-[#FFE2A0]" />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">DEFENEX AI Assistant</h2>
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono ${online ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border border-red-500/40 bg-red-500/10 text-red-300"}`}>
              <span className={`size-1.5 rounded-full ${online ? "bg-emerald-400 shadow-[0_0_6px_#10b981]" : "bg-red-400"}`} />{online ? "ACTIVE" : "STANDBY"}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">Autonomous SOC intelligence</p>
        </div>
      </div>

      <div ref={box} className="mt-3 min-h-[128px] flex-1 space-y-2 overflow-y-auto rounded-xl border border-[#D9AD62]/20 bg-black/40 p-3 text-[12.5px] leading-relaxed text-[var(--text-primary)]" aria-live="polite">
        <p className="text-[var(--text-muted)]"><span className="text-[var(--gold)] font-medium">DEFENEX Core:</span> Hello {profile.name.split(" ")[0]}, tactical link established. Real-time telemetry and isolation capabilities online. How can I assist your defense posture?</p>
        {!online && !status.loading && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">Local LLM daemon offline. Launch Ollama (<code>ollama serve</code>) for local neuro-symbolic reasoning.</p>
        )}
        {msgs.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className={m.role === "user" ? "ml-6 rounded-xl border border-[#D9AD62]/30 bg-[#4b1027]/40 p-2.5 text-[var(--text-primary)]" : `whitespace-pre-wrap rounded-xl p-2.5 border border-white/5 ${m.error ? "border-red-500/30 bg-red-500/10 text-red-200" : "bg-white/[0.03]"}`}>
            {m.content}
            <span className="mt-1 block text-[9px] font-mono text-[var(--text-muted)]">{m.time}</span>
          </motion.div>
        ))}
        {busy && <p className="flex items-center gap-2 text-xs text-[var(--gold)]"><Sparkles size={13} className="animate-pulse" />Correlating telemetry graph…</p>}
      </div>

      <div className="mt-2 grid gap-1">
        {SUGGESTIONS.map((s) => (
          <button key={s.label} onClick={() => send(s.prompt)} disabled={busy}
            className="flex h-7 items-center gap-2 rounded-lg border border-[var(--glass-border)] bg-white/[0.02] px-2.5 text-left text-[11px] text-[var(--text-primary)] transition hover:border-[var(--gold)]/50 hover:bg-[#4b1027]/25 disabled:opacity-50">
            <Sparkles size={12} className="text-[#D9AD62]" />{s.label}
          </button>
        ))}
      </div>

      <form className="mt-2.5 flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-black/50 py-1.5 pl-3 pr-1.5 backdrop-blur-md transition focus-within:border-[var(--gold)]/60" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={2000} aria-label="Ask DEFENEX tactical assistant"
          placeholder="Ask tactical assistant..." className="min-w-0 flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" />
        <Mic size={15} className="text-[var(--text-muted)]" aria-hidden />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send message"
          className="grid size-7 place-items-center rounded-lg border border-[#D9AD62]/40 bg-[#4b1027] text-[#ffe2a0] transition hover:bg-[#5e1431] disabled:opacity-40"><Send size={13} /></button>
      </form>
    </aside>
  );
}
