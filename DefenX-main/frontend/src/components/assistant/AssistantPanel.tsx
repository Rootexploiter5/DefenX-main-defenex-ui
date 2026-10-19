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
    <aside aria-label="DEFENEX AI Assistant" className={`panel-dark gold-border flex flex-col p-4 ${tall ? "h-[calc(100vh-130px)] min-h-[520px]" : "h-[500px]"}`}>
      <div className="flex items-center gap-3">
        <span className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-[#D9AD62] bg-[radial-gradient(circle,#7a1a3a,#2a0813)] shadow-[0_0_18px_rgba(217,35,61,.6)]">
          <Shield size={26} className="text-[#FFE2A0]" />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold">DEFENEX AI Assistant</h2>
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] ${online ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
              <span className={`size-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-red-400"}`} />{online ? "Online" : "Offline"}
            </span>
          </div>
          <p className="text-[11.5px] text-[#D8C2B6]">Your cybersecurity companion</p>
        </div>
      </div>

      <div ref={box} className="mt-3 min-h-[128px] flex-1 space-y-2 overflow-y-auto rounded-xl border border-[#D9AD62]/40 bg-black/20 p-3 text-[13px] leading-relaxed" aria-live="polite">
        <p>Hello {profile.name.split(" ")[0]},<br />I'm DEFENEX AI. I can help you analyze threats, explain anomalies, check device security, and suggest actions. What would you like to do today?</p>
        {!online && !status.loading && (
          <p className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-200">Ollama isn't reachable, so I can't answer questions yet. Start it with <code>ollama serve</code>.</p>
        )}
        {msgs.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className={m.role === "user" ? "ml-6 rounded-xl bg-[#D9AD62]/20 p-2" : `whitespace-pre-wrap rounded-xl p-2 ${m.error ? "bg-red-500/10 text-red-200" : "bg-white/5"}`}>
            {m.content}
            <span className="mt-1 block text-[9px] text-[#D8C2B6]">{m.time}</span>
          </motion.div>
        ))}
        {busy && <p className="flex items-center gap-2 text-xs text-[#D8C2B6]"><Sparkles size={14} className="animate-pulse" />Analysing the stored data…</p>}
      </div>

      <div className="mt-2 grid gap-1">
        {SUGGESTIONS.map((s) => (
          <button key={s.label} onClick={() => send(s.prompt)} disabled={busy}
            className="gold-border flex h-8 items-center gap-3 rounded-lg px-3 text-left text-[12px] transition hover:brightness-125 disabled:opacity-60">
            <Sparkles size={14} className="text-[#D9AD62]" />{s.label}
          </button>
        ))}
      </div>

      <form className="mt-2.5 flex items-center gap-2 rounded-full bg-[#F7EBDD] py-1.5 pl-4 pr-1.5" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={2000} aria-label="Ask DEFENEX anything"
          placeholder="Ask DEFENEX anything..." className="min-w-0 flex-1 bg-transparent text-sm text-[#2A0D14] outline-none placeholder:text-[#7a5a5f]" />
        <Mic size={16} className="text-[#7a5a5f]" aria-hidden />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send message"
          className="chip-btn grid size-8 place-items-center rounded-full disabled:opacity-50"><Send size={14} /></button>
      </form>
    </aside>
  );
}
