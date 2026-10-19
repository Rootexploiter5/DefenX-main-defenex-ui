export type Severity = "Critical" | "High" | "Medium" | "Low" | "Informational";
export type DeviceState = "connected" | "warning" | "disconnected";

export interface Summary {
  telemetry_active: boolean;
  last_telemetry_at: string | null;
  security_score: number | null;
  score_method: string;
  anomalies_24h: number;
  critical_threats: number;
  devices_monitored: number;
  devices_online: number;
  threats_blocked: number | null;
  threats_blocked_note: string;
}

export interface SeriesPoint {
  time: string;
  samples: number;
  alerts: number;
  normal: number | null;
  anomaly: number | null;
  risk: number | null;
  alert_ids: number[];
}
export interface Series { range: string; bucket_minutes: number; has_data: boolean; points: SeriesPoint[] }

export interface Resources {
  timestamp: string;
  host: string;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number | null;
  network_percent: number | null;
  network_bytes_per_sec: number | null;
  network_link_mbps: number | null;
  temperature_c: number | null;
  battery: { percent: number; charging: boolean } | null;
  process_count: number;
}

export interface SecurityEvent {
  id: number; time: string; event: string; severity: Severity;
  risk_score: number; source: string; status: string;
}

export interface MonitoredDevice {
  id: string; name: string; platform: string; agent_version: string;
  last_seen_at: string | null; status: DeviceState; open_alerts: number;
}

export interface ThreatSource { country: string; code: string; count: number }
export interface ThreatMapData { available: boolean; reason?: string; sources: ThreatSource[] }

export interface OllamaStatus {
  available: boolean; url?: string; active_model?: string | null; models?: string[]; error?: string;
}

export interface ChatMessage { role: "user" | "assistant"; content: string; time: string; error?: boolean }

export interface LiveProcess {
  pid: number; name: string; username: string; cpu_percent: number; memory_percent: number;
  status: string; threads: number; is_anomalous: boolean; anomaly_label: string;
}
export interface LiveConnection {
  protocol: string; local_address: string; remote_address: string; remote_ip: string;
  status: string; pid: number | null; process_name: string; is_suspicious: boolean; reputation: string;
}

export interface ScanResult {
  scanned_at: string; scan_type: string; disclaimer: string;
  processes_checked: number; connections_checked: number;
  flagged_processes: LiveProcess[]; flagged_connections: LiveConnection[]; clean: boolean;
}
