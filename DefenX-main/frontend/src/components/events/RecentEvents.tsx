import { ArrowRight, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore } from "../../app/store";
import { clock } from "../../hooks/format";
import { EmptyState, Skeleton } from "../layout/Skeleton";
import { PanelTitle } from "../metrics/SecurityOverview";
import type { Severity } from "../../types";

export const sevStyle: Record<Severity, string> = {
  Critical: "border border-red-500/40 bg-red-500/20 text-red-300 font-mono",
  High: "border border-red-500/30 bg-red-500/15 text-red-300 font-mono",
  Medium: "border border-amber-500/40 bg-amber-500/20 text-amber-300 font-mono",
  Low: "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 font-mono",
  Informational: "border border-slate-500/30 bg-slate-500/10 text-slate-300 font-mono",
};

export function RecentEvents({ onSeeAll, limit = 5 }: { onSeeAll?: () => void; limit?: number }) {
  const { events, search } = useStore();
  const [sev, setSev] = useState("All");
  const [desc, setDesc] = useState(true);
  const rows = useMemo(() => {
    let r = events.data ?? [];
    if (sev !== "All") r = r.filter((e) => e.severity === sev);
    const q = search.trim().toLowerCase();
    if (q) r = r.filter((e) => e.event.toLowerCase().includes(q) || e.source.toLowerCase().includes(q));
    return [...r].sort((a, b) => (desc ? -1 : 1) * (+new Date(a.time) - +new Date(b.time))).slice(0, limit);
  }, [events.data, sev, search, desc, limit]);

  return (
    <section className="glass-panel p-4" aria-label="Recent security events">
      <PanelTitle icon={ShieldAlert} right={
        <span className="flex items-center gap-2">
          <select value={sev} onChange={(e) => setSev(e.target.value)} aria-label="Filter by severity" className="rounded-lg border border-[#D9AD62]/40 bg-black/50 px-2 py-0.5 font-mono text-[11px] text-[var(--text-primary)] outline-none">
            {["All", "Critical", "High", "Medium", "Low"].map((s) => <option key={s} value={s} className="bg-[#11121a] text-white">{s}</option>)}
          </select>
          {onSeeAll && <button onClick={onSeeAll} className="flex items-center gap-1 font-mono text-xs text-[var(--gold)] hover:text-[#ffe2a0]">See All <ArrowRight size={13} /></button>}
        </span>}>Recent Security Events</PanelTitle>
      {events.loading ? <Skeleton className="h-[130px]" /> : events.error ? <EmptyState title="Events unavailable" body="The backend could not be reached." />
        : rows.length === 0 ? <EmptyState title="No events" body={search || sev !== "All" ? "No events match the current filter." : "No alerts have been recorded yet."} /> : (
        <table className="w-full text-xs">
          <thead><tr className="text-left font-mono text-[10px] text-[var(--text-muted)]">
            <th scope="col" className="pb-1.5"><button onClick={() => setDesc(!desc)} aria-label="Sort by time" className="hover:text-[var(--gold)]">Time {desc ? "↓" : "↑"}</button></th>
            <th scope="col" className="pb-1.5">Event</th>
            <th scope="col" className="pb-1.5 text-right">Severity</th></tr></thead>
          <tbody className="divide-y divide-white/[0.06]">{rows.map((e) => (
            <tr key={e.id} className="transition-colors hover:bg-white/[0.02]">
              <td className="py-2 pr-2 font-mono text-[11px] text-[var(--text-muted)] tabular-nums">{clock(e.time)}</td>
              <td className="pr-2 font-medium text-[var(--text-primary)]" title={`${e.source} · ${e.status}`}><span className="line-clamp-1">{e.event}</span></td>
              <td className="text-right"><span className={`rounded-md px-2 py-0.5 text-[10px] ${sevStyle[e.severity]}`}>{e.severity}</span></td>
            </tr>))}
          </tbody>
        </table>
      )}
    </section>
  );
}
