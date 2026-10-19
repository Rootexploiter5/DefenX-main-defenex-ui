import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Loader2, Sparkles, Terminal } from "lucide-react";
import { useStore } from "../app/store";
import { AssistantPanel } from "../components/assistant/AssistantPanel";
import { AnomalyChart } from "../components/charts/AnomalyChart";
import { DeviceIcon, stateLabel } from "../components/devices/MonitoredDevices";
import { sevStyle } from "../components/events/RecentEvents";
import { EmptyState, Skeleton } from "../components/layout/Skeleton";
import { Gauge } from "../components/metrics/Gauge";
import { SystemResources } from "../components/metrics/SystemResources";
import { ThreatMap } from "../components/threat-map/ThreatMap";
import { ProcessForensicDrawer } from "../components/forensics/ProcessForensicDrawer";
import { clock, timeAgo } from "../hooks/format";
import { usePoll } from "../hooks/usePoll";
import { api } from "../services/api";
import type { LiveProcess } from "../types";

const Card = ({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) => (
  <section className="glass-panel p-4">
    <div className="mb-3 flex items-center justify-between gap-2"><h2 className="title-serif text-[16px] text-[var(--text-primary)]">{title}</h2>{right}</div>
    {children}
  </section>
);
const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className="rounded-lg border border-[#D9AD62]/40 bg-black/40 px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--gold)]" />
);
const th = "pb-1.5 text-left font-mono text-[10px] text-[var(--text-muted)]";

/* ---- Live Monitor ---- */
export function LiveMonitor() {
  const { resources } = useStore();
  const hist = useRef<{ t: string; cpu: number; mem: number }[]>([]);
  const [, tick] = useState(0);
  const [selectedProc, setSelectedProc] = useState<LiveProcess | null>(null);

  useEffect(() => {
    const r = resources.data;
    if (!r) return;
    hist.current = [...hist.current, { t: clock(r.timestamp), cpu: r.cpu_percent, mem: r.memory_percent }].slice(-60);
    tick((n) => n + 1);
  }, [resources.data]);

  const procs = usePoll(() => api.processes(12), 5000);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <SystemResources />
      <Card title="Live CPU & Memory (this session)">
        <div className="h-[170px]">
          {hist.current.length < 2 ? <EmptyState title="Collecting readings…" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hist.current} margin={{ left: -20, right: 4, top: 4 }}>
                <CartesianGrid stroke="rgba(217,173,98,.15)" vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#a7a3ad" }} minTickGap={40} /><YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#a7a3ad" }} />
                <Tooltip contentStyle={{ backgroundColor: "#11121a", borderColor: "rgba(217,173,98,0.3)", borderRadius: "8px" }} />
                <Area dataKey="cpu" name="CPU %" stroke="#D9AD62" fill="#D9AD62" fillOpacity={0.25} isAnimationActive={false} />
                <Area dataKey="mem" name="Memory %" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>)}
        </div>
      </Card>
      <div className="lg:col-span-2">
        <Card title="Tactical Process Explorer" right={<span className="font-mono text-[11px] text-[var(--gold)]">Click row for deep forensics</span>}>
          {procs.loading ? <Skeleton className="h-24" /> : !procs.data ? <EmptyState title="Unavailable" body={procs.error ?? ""} /> : (
            <table className="w-full text-xs">
              <thead><tr><th className={th}>Process</th><th className={th}>PID</th><th className={th}>CPU %</th><th className={th}>Mem %</th><th className={th}>Flag</th><th className={`${th} text-right`}>Action</th></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">{procs.data.processes.map((p) => (
                <tr key={p.pid} onClick={() => setSelectedProc(p)} className="cursor-pointer transition hover:bg-white/[0.04]">
                  <td className="py-2 font-medium text-[var(--text-primary)] flex items-center gap-2">
                    <Terminal size={14} className="text-[var(--gold)]" />
                    <span>{p.name}</span>
                  </td>
                  <td className="font-mono text-[var(--text-muted)]">{p.pid}</td>
                  <td className="font-mono text-[var(--text-primary)]">{p.cpu_percent.toFixed(1)}%</td>
                  <td className="font-mono text-[var(--text-primary)]">{p.memory_percent.toFixed(1)}%</td>
                  <td>{p.is_anomalous ? <span className="rounded border border-red-500/40 bg-red-500/20 px-1.5 py-0.5 font-mono text-[10px] text-red-300">{p.anomaly_label}</span> : <span className="font-mono text-[10px] text-emerald-400">NORMAL</span>}</td>
                  <td className="text-right">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedProc(p); }} className="rounded border border-[var(--gold)]/40 bg-[var(--burgundy)]/40 px-2 py-0.5 font-mono text-[10px] text-[#ffe2a0] hover:bg-[var(--burgundy)]">Inspect</button>
                  </td>
                </tr>))}</tbody>
            </table>)}
        </Card>
      </div>

      <ProcessForensicDrawer process={selectedProc} onClose={() => setSelectedProc(null)} />
    </div>
  );
}

/* ---- Anomaly Detection ---- */
export function AnomalyDetection() {
  const { events } = useStore();
  const model = usePoll(api.modelInfo, 60000);
  const [open, setOpen] = useState<number | null>(null);
  const [text, setText] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  async function explain(id: number) {
    setOpen(id); setBusy(id);
    try { const r = await api.explainAlert(id); setText((t) => ({ ...t, [id]: r.analysis })); }
    catch (e) { setText((t) => ({ ...t, [id]: `Could not reach the backend (${String(e)}).` })); }
    finally { setBusy(null); }
  }
  return (
    <div className="space-y-3">
      <AnomalyChart compact={false} />
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Detected Anomalies">
          {!events.data?.length ? <EmptyState title="No anomalies recorded" body="The detection engine hasn't raised any alerts." /> : (
            <ul className="divide-y divide-[var(--surface-line)]">{events.data.slice(0, 12).map((e) => (
              <li key={e.id} className="py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 ${sevStyle[e.severity]}`}>{e.severity}</span>
                  <span className="flex-1">{e.event}</span><span className="tabular-nums text-[var(--ink-soft)]">risk {e.risk_score}</span>
                  <button onClick={() => explain(e.id)} className="chip-btn flex items-center gap-1 rounded-full px-2.5 py-1"><Sparkles size={12} />Explain</button>
                </div>
                {open === e.id && <div className="mt-2 whitespace-pre-wrap rounded-lg bg-[var(--surface-2)] p-3">{busy === e.id ? <Loader2 className="animate-spin" size={14} /> : text[e.id]}</div>}
              </li>))}</ul>)}
        </Card>
        <Card title="Detection Engine">
          {!model.data ? <Skeleton className="h-24" /> : (
            <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
              {[["Engine", model.data.engine], ["Status", model.data.status], ["Last trained", model.data.last_trained], ["Estimators", model.data.n_estimators], ["Contamination", model.data.contamination]].map(([k, v]) => (
                <div key={String(k)} className="contents"><dt className="text-[var(--ink-soft)]">{k}</dt><dd className="font-medium">{String(v)}</dd></div>))}
            </dl>)}
          <p className="mt-3 text-[11px] text-[var(--ink-soft)]">The Isolation Forest + rules decide whether an anomaly occurred. The AI only explains the stored evidence.</p>
        </Card>
      </div>
    </div>
  );
}

/* ---- Threat Intelligence ---- */
export function ThreatIntel() {
  const { events } = useStore();
  const high = (events.data ?? []).filter((e) => e.severity === "High" || e.severity === "Critical");
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ThreatMap />
      <Card title="High-Severity Alerts">
        {!high.length ? <EmptyState title="No high-severity alerts" /> : (
          <ul className="space-y-1.5 text-xs">{high.slice(0, 10).map((e) => <li key={e.id} className="flex gap-2"><span className={`rounded px-2 ${sevStyle[e.severity]}`}>{e.severity}</span>{e.event}<span className="ml-auto text-[var(--ink-soft)]">{timeAgo(e.time)}</span></li>)}</ul>)}
      </Card>
    </div>
  );
}

export const AssistantPage = () => <div className="mx-auto max-w-3xl"><AssistantPanel tall /></div>;

/* ---- Device Security ---- */
export function DeviceSecurity() {
  const { devices, events, selectedDevice, setSelectedDevice } = useStore();
  const sel = devices.data?.find((d) => d.id === selectedDevice) ?? null;
  const devEvents = (events.data ?? []).filter((e) => e.source === sel?.id).slice(0, 8);
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
      <Card title="Devices">
        {!devices.data?.length ? <EmptyState title="No devices registered" body="Run the endpoint agent so a device can report telemetry." /> : (
          <ul className="space-y-1">{devices.data.map((d) => { const [l, c] = stateLabel[d.status]; return (
            <li key={d.id}><button onClick={() => setSelectedDevice(d.id)} aria-pressed={selectedDevice === d.id}
              className={`flex w-full items-center gap-3 rounded-xl p-2 text-left ${selectedDevice === d.id ? "bg-[#D9AD62]/25" : "hover:bg-[#D9AD62]/10"}`}>
              <DeviceIcon p={d.platform} /><span className="flex-1 text-sm font-medium">{d.name}</span>
              <span className="flex items-center gap-1.5 text-xs"><i className="size-2 rounded-full" style={{ background: c }} />{l}</span></button></li>); })}</ul>)}
      </Card>
      <Card title="Device Details">
        {!sel ? <EmptyState title="Select a device" body="Choose a device to see its status and recent alerts." /> : (
          <div className="space-y-3 text-sm">
            <dl className="grid grid-cols-2 gap-y-1 text-xs">
              {[["Device ID", sel.id], ["Platform", sel.platform], ["Agent", sel.agent_version], ["Last seen", `${timeAgo(sel.last_seen_at)}`], ["Open alerts", sel.open_alerts]].map(([k, v]) => (
                <div key={String(k)} className="contents"><dt className="text-[var(--ink-soft)]">{k}</dt><dd className="font-medium">{String(v)}</dd></div>))}
            </dl>
            <h3 className="text-xs font-semibold">Recent alerts</h3>
            {!devEvents.length ? <p className="text-xs text-[var(--ink-soft)]">No alerts for this device.</p> :
              <ul className="space-y-1 text-xs">{devEvents.map((e) => <li key={e.id}><span className={`mr-2 rounded px-1.5 ${sevStyle[e.severity]}`}>{e.severity}</span>{e.event}</li>)}</ul>}
          </div>)}
      </Card>
    </div>
  );
}

/* ---- Network Analysis ---- */
export function NetworkAnalysis() {
  const net = usePoll(() => api.network(150), 6000);
  const [q, setQ] = useState("");
  const rows = useMemo(() => (net.data?.connections ?? []).filter((c) => `${c.process_name} ${c.remote_address} ${c.status}`.toLowerCase().includes(q.toLowerCase())), [net.data, q]);
  return (
    <Card title="Network Connections" right={<Input aria-label="Filter connections" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />}>
      {net.loading ? <Skeleton className="h-40" /> : !net.data ? <EmptyState title="Unavailable" body={net.error ?? ""} /> : (
        <>
          <p className="mb-2 text-xs text-[var(--ink-soft)]">{net.data.total_connections} sockets · {net.data.unique_remote_ips} unique remote IPs</p>
          <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr><th className={th}>Process</th><th className={th}>Proto</th><th className={th}>Remote</th><th className={th}>State</th><th className={th}>Reputation</th></tr></thead>
            <tbody>{rows.slice(0, 80).map((c, i) => (
              <tr key={i} className="border-t border-[var(--surface-line)]"><td className="py-1">{c.process_name}</td><td>{c.protocol}</td><td>{c.remote_address}</td><td>{c.status}</td>
                <td className={c.is_suspicious ? "text-[#B01C32]" : ""}>{c.reputation}</td></tr>))}</tbody></table></div>
        </>)}
    </Card>
  );
}

/* ---- Reports & Logs ---- */
export function Reports() {
  const { events, search } = useStore();
  const [q, setQ] = useState(search);
  useEffect(() => setQ(search), [search]);
  const audit = usePoll(api.audit, 20000);
  const rows = (events.data ?? []).filter((e) => `${e.event} ${e.source} ${e.severity}`.toLowerCase().includes(q.toLowerCase()));
  async function dl() {
    const { markdown } = await api.report();
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([markdown], { type: "text/markdown" })), download: "defenex-report.md" });
    a.click();
  }
  return (
    <div className="space-y-3">
      <Card title="Security Events" right={<span className="flex gap-2"><Input aria-label="Search events" placeholder="Search events…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button onClick={dl} className="chip-btn flex items-center gap-1.5 rounded-full px-3 text-xs"><Download size={13} />Report</button></span>}>
        {!rows.length ? <EmptyState title="No matching events" /> : (
          <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr><th className={th}>Time</th><th className={th}>Event</th><th className={th}>Severity</th><th className={th}>Source</th><th className={th}>Status</th></tr></thead>
            <tbody>{rows.map((e) => (<tr key={e.id} className="border-t border-[var(--surface-line)]"><td className="py-1.5">{new Date(e.time).toLocaleString()}</td><td>{e.event}</td>
              <td><span className={`rounded px-2 py-0.5 ${sevStyle[e.severity]}`}>{e.severity}</span></td><td>{e.source}</td>
              <td><select aria-label="Alert status" defaultValue={e.status} onChange={(ev) => api.updateAlert(e.id, ev.target.value).then(events.refresh)} className="rounded border border-[#D9AD62]/50 bg-[var(--surface)] px-1">
                {["open", "investigating", "resolved", "false_positive"].map((s) => <option key={s}>{s}</option>)}</select></td></tr>))}</tbody></table></div>)}
      </Card>
      <Card title="Audit Trail">
        {!audit.data?.length ? <EmptyState title="No audit events yet" /> : <ul className="space-y-1 text-xs">{audit.data.slice(0, 15).map((a) => <li key={a.id}><span className="text-[var(--ink-soft)]">{new Date(a.timestamp).toLocaleString()}</span> · {a.actor} · {a.action} · {a.result}</li>)}</ul>}
      </Card>
    </div>
  );
}

/* ---- Settings ---- */
export function SettingsPage() {
  const { profile, setProfile, theme, toggleTheme, wsUp, backendUp } = useStore();
  const ai = usePoll(api.aiStatus, 10000);
  const [name, setName] = useState(profile.name);
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card title="Profile"><div className="flex gap-2"><Input aria-label="Display name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        <button className="chip-btn rounded-full px-4 text-sm" onClick={() => name.trim() && setProfile({ ...profile, name: name.trim() })}>Save</button></div>
        <button onClick={toggleTheme} className="mt-3 text-sm underline">Switch to {theme === "light" ? "dark" : "light"} theme</button></Card>
      <Card title="Connections"><ul className="space-y-1.5 text-sm">
        <li>Backend API: <b>{backendUp ? "connected" : "unreachable"}</b></li>
        <li>Live alert stream (WebSocket): <b>{wsUp ? "connected" : "disconnected"}</b></li>
        <li>Ollama: <b>{ai.data?.available ? `online (${ai.data.active_model})` : "offline"}</b></li>
      </ul><p className="mt-3 text-xs text-[var(--ink-soft)]">Ollama and agent settings are server-side. Edit <code>.env</code> and restart. No secrets are exposed to this UI.</p></Card>
    </div>
  );
}

export { Gauge };
