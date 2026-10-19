import { ArrowRight, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore } from "../../app/store";
import { clock } from "../../hooks/format";
import { EmptyState, Skeleton } from "../layout/Skeleton";
import { PanelTitle } from "../metrics/SecurityOverview";
import type { Severity } from "../../types";

export const sevStyle: Record<Severity, string> = {
  Critical: "bg-[#D9233D]/20 text-[#9d1429]", High: "bg-[#D9233D]/15 text-[#B01C32]",
  Medium: "bg-[#D99027]/20 text-[#8a5410]", Low: "bg-[#20834A]/15 text-[#17663a]", Informational: "bg-slate-300/40 text-slate-700",
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
    <section className="panel-light p-4" aria-label="Recent security events">
      <PanelTitle icon={ShieldAlert} right={
        <span className="flex items-center gap-2">
          <select value={sev} onChange={(e) => setSev(e.target.value)} aria-label="Filter by severity" className="rounded-md border border-[#D9AD62]/50 bg-[var(--surface)] px-1.5 py-0.5 text-[11px]">
            {["All", "Critical", "High", "Medium", "Low"].map((s) => <option key={s}>{s}</option>)}
          </select>
          {onSeeAll && <button onClick={onSeeAll} className="flex items-center gap-1 text-xs">See All <ArrowRight size={13} /></button>}
        </span>}>Recent Security Events</PanelTitle>
      {events.loading ? <Skeleton className="h-[130px]" /> : events.error ? <EmptyState title="Events unavailable" body="The backend could not be reached." />
        : rows.length === 0 ? <EmptyState title="No events" body={search || sev !== "All" ? "No events match the current filter." : "No alerts have been recorded yet."} /> : (
        <table className="w-full text-xs">
          <thead><tr className="text-left text-[11px] text-[var(--ink-soft)]">
            <th scope="col" className="pb-1"><button onClick={() => setDesc(!desc)} aria-label="Sort by time">Time {desc ? "↓" : "↑"}</button></th>
            <th scope="col">Event</th><th scope="col" className="text-right">Severity</th></tr></thead>
          <tbody>{rows.map((e) => (
            <tr key={e.id} className="border-t border-[var(--surface-line)]">
              <td className="py-1.5 pr-2 tabular-nums">{clock(e.time)}</td>
              <td className="pr-2" title={`${e.source} · ${e.status}`}><span className="line-clamp-1">{e.event}</span></td>
              <td className="text-right"><span className={`rounded-md px-2.5 py-0.5 text-[11px] font-medium ${sevStyle[e.severity]}`}>{e.severity}</span></td>
            </tr>))}
          </tbody>
        </table>
      )}
    </section>
  );
}
