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
    <aside aria-label="DEFENEX AI Assistant" className={`glass-panel flex flex-col rounded-[24px] border border-[#d9ad62]/40 bg-gradient-to-b from-[#240614]/95 via-[#1a040d]/95 to-[#120308]/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)] ${tall ? "h-[calc(100vh-130px)] min-h-[520px]" : "h-[500px]"}`}>
      {/* Assistant Header */}
      <div className="flex items-center gap-3">
        <span className="relative grid size-12 shrink-0 place-items-center rounded-full border border-[#d9ad62]/70 bg-[radial-gradient(circle_at_35%_30%,#ff8fa3,#ef4444_45%,#3a0715)] shadow-[0_0_18px_rgba(239,68,68,0.6)]">
          <span className="absolute inset-1 rounded-full border border-[#d9ad62]/40" />
          <Shield size={18} className="text-[#ffe2a0]" />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-2">
            <h2 className="text-[14.5px] font-bold text-[#ffffff]">DEFENEX AI Assistant</h2>
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2 py-0.5 text-[9.5px] font-semibold text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />Online
            </span>
          </div>
          <p className="text-[11px] text-[#b5adaa]">Your cybersecurity companion</p>
        </div>
      </div>

      {/* Message Box */}
      <div ref={box} className="mt-3.5 flex-1 space-y-2.5 overflow-y-auto rounded-xl border border-white/[0.06] bg-black/35 p-3 text-[12px] leading-relaxed text-[#f8f5f0]" aria-live="polite">
        <p className="text-[#d8cfcb] leading-relaxed">
          Hello Akhilesh,<br />
          I'm DEFENEX AI. I can help you analyze threats, explain anomalies, check device security, and suggest actions. What would you like to do today?
        </p>

        {msgs.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className={m.role === "user" ? "ml-6 rounded-xl border border-[#D9AD62]/35 bg-[#4b1027]/50 p-2.5 text-[#ffffff]" : `whitespace-pre-wrap rounded-xl p-2.5 border border-white/5 ${m.error ? "border-red-500/30 bg-red-500/10 text-red-200" : "bg-white/[0.04]"}`}>
            {m.content}
            <span className="mt-1 block text-[9px] font-mono text-[#a7a3ad]">{m.time}</span>
          </motion.div>
        ))}
        {busy && <p className="flex items-center gap-2 text-xs text-[#d9ad62]"><Sparkles size={13} className="animate-pulse" />Analyzing threat telemetry…</p>}
      </div>

      {/* 4 Action Suggestion Buttons matching reference UI */}
      <div className="mt-3 grid gap-1.5">
        {[
          { label: "Explain last anomaly", prompt: "Explain the most recent anomaly using the alert data you were given." },
          { label: "Is my device safe?", prompt: "Based on the current telemetry, is my device safe?" },
          { label: "Generate security report", prompt: "Generate a short security report from current data." },
          { label: "Give security recommendations", prompt: "Give security recommendations based on current telemetry." },
        ].map((s) => (
          <button 
            key={s.label} 
            onClick={() => send(s.prompt)} 
            disabled={busy}
            className="flex h-[34px] items-center gap-2.5 rounded-xl border border-[#d9ad62]/30 bg-black/40 px-3 text-left text-[11.5px] font-medium text-[#f8f5f0] transition hover:border-[#d9ad62]/70 hover:bg-[#4b1027]/40 disabled:opacity-50"
          >
            <span className="grid size-4 place-items-center text-[#d9ad62]">•</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form className="mt-3 flex items-center gap-2 rounded-full border border-[#d9ad62]/40 bg-black/60 py-1 pl-3.5 pr-1.5 backdrop-blur-md transition focus-within:border-[#d9ad62]" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          maxLength={2000} 
          aria-label="Ask DEFENEX anything"
          placeholder="Ask DEFENEX anything..." 
          className="min-w-0 flex-1 bg-transparent text-xs text-[#f8f5f0] outline-none placeholder:text-[#a7a3ad]" 
        />
        <Mic size={16} className="text-[#a7a3ad] cursor-pointer hover:text-[#d9ad62]" aria-hidden />
        <button 
          type="submit" 
          disabled={busy || !input.trim()} 
          aria-label="Send message"
          className="grid size-8 place-items-center rounded-full bg-gradient-to-r from-[#d9ad62] to-[#b8860b] text-[#1a080d] transition hover:scale-105 disabled:opacity-40"
        >
          <Send size={13} className="ml-0.5" />
        </button>
      </form>
    </aside>
  );
}
