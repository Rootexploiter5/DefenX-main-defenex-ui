import { Activity, Bug, Laptop, ShieldAlert } from "lucide-react";
import { useStore } from "../../app/store";
import { Skeleton } from "../layout/Skeleton";
import { Gauge } from "./Gauge";

export function PanelTitle({ icon: Icon, children, right }: { icon: React.ComponentType<{ size?: number }>; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="title-serif flex items-center gap-2 text-[17px]"><span className="text-[#98662D]"><Icon size={18} /></span>{children}</h2>
      {right}
    </div>
  );
}

export function SecurityOverview() {
  const { summary } = useStore();
  const s = summary.data;
  const rows = [
    { icon: ShieldAlert, v: s?.threats_blocked ?? null, l: "Threats Blocked", note: "Detection only", tone: "text-[#D9233D]" },
    { icon: Activity, v: s?.anomalies_24h ?? null, l: "Anomalies Detected", note: "24h", tone: "text-[#D9233D]" },
    { icon: Laptop, v: s?.devices_monitored ?? null, l: "Devices Monitored", note: `${s?.devices_online ?? 0} online`, tone: "text-[#20834A]" },
    { icon: Bug, v: s?.critical_threats ?? null, l: "Critical Threats", note: "Unresolved", tone: "text-[#D99027]" },
  ];
  return (
    <section className="panel-light p-4" aria-label="Security overview">
      <PanelTitle icon={ShieldAlert}>Security Overview</PanelTitle>
      {summary.loading ? <Skeleton className="h-[150px]" /> : !s ? (
        <p className="p-4 text-sm text-[var(--ink-soft)]" role="alert">Backend unreachable. Start the API to see live security metrics.</p>
      ) : (
        <div className="flex items-center gap-4">
          <Gauge value={s.security_score} size={142} stroke={11} big display={s.security_score === null ? "N/A" : `${s.security_score}%`}
            sub={s.security_score === null ? "No data" : "Secure"} warn={s.security_score !== null && s.security_score < 60} label="Security score" />
          <ul className="flex-1 space-y-1.5">
            {rows.map(({ icon: I, v, l, note, tone }) => (
              <li key={l} className="flex items-center gap-3 rounded-lg bg-[var(--surface-2)]/60 px-2.5 py-1.5" title={l === "Threats Blocked" ? s.threats_blocked_note : undefined}>
                <span className={tone}><I size={18} /></span>
                <span className="leading-tight"><b className="text-base">{v ?? "—"}</b><span className="block text-[10.5px] text-[var(--ink-soft)]">{l}</span></span>
                <span className="ml-auto text-[10px] text-[var(--ink-soft)]">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
