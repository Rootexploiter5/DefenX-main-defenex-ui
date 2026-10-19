import type {
  LiveConnection, LiveProcess, MonitoredDevice, OllamaStatus, Resources, ScanResult,
  SecurityEvent, Series, Summary, ThreatMapData,
} from "../types";

const BASE = "/api/v1";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

const post = <T,>(path: string, body?: unknown) =>
  req<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const api = {
  summary: () => req<Summary>("/dashboard/summary"),
  series: (range: string) => req<Series>(`/dashboard/anomaly-series?range=${range}`),
  resources: () => req<Resources>("/dashboard/resources"),
  threatMap: () => req<ThreatMapData>("/dashboard/threat-map"),
  events: (p: { severity?: string; q?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (p.severity) qs.set("severity", p.severity);
    if (p.q) qs.set("q", p.q);
    qs.set("limit", String(p.limit ?? 25));
    return req<SecurityEvent[]>(`/dashboard/events?${qs}`);
  },
  devices: () => req<MonitoredDevice[]>("/dashboard/devices"),
  processes: (limit = 60) => req<{ total_count: number; processes: LiveProcess[] }>(`/system/processes?limit=${limit}`),
  network: (limit = 80) =>
    req<{ total_connections: number; unique_remote_ips: number; connections: LiveConnection[] }>(`/system/network?limit=${limit}`),
  modelInfo: () => req<Record<string, any>>("/system/model/info"),
  evaluation: () => req<Record<string, any>>("/analytics/evaluation"),
  audit: () => req<{ id: number; timestamp: string; actor: string; action: string; target_id?: string; result: string }[]>("/audit?limit=40"),
  aiStatus: () => req<OllamaStatus>("/ai/status"),
  chat: (message: string, history: { role: string; content: string }[]) =>
    post<{ success: boolean; reply: string; model?: string }>("/ai/chat", { message, conversation_history: history }),
  explainAlert: (id: number) => post<{ success: boolean; analysis: string; error?: string }>(`/ai/explain/${id}`),
  scan: () => post<ScanResult>("/actions/scan"),
  protect: () => post<{ available: boolean; status?: string; message: string; rules_enforced?: string[]; threats_blocked?: number }>("/actions/protect"),
  report: () => req<{ markdown: string }>("/actions/report"),
  updateAlert: (id: number, status: string) =>
    req(`/alerts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, actor: "operator" }),
    }),
};

/** Live alert/telemetry push channel. Returns a cleanup function. */
export function openAlertSocket(onMessage: (d: any) => void, onStatus: (up: boolean) => void) {
  let ws: WebSocket | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;
  const connect = () => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${proto}://${location.host}/ws/alerts`);
    ws.onopen = () => onStatus(true);
    ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch { /* pong */ } };
    ws.onclose = () => { onStatus(false); if (!closed) timer = setTimeout(connect, 3000); };
    ws.onerror = () => ws?.close();
  };
  connect();
  return () => { closed = true; clearTimeout(timer); ws?.close(); };
}
