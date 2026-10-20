import { AssistantPanel } from "../components/assistant/AssistantPanel";
import { AnomalyChart } from "../components/charts/AnomalyChart";
import { Oscilloscope } from "../components/charts/Oscilloscope";
import { MonitoredDevices } from "../components/devices/MonitoredDevices";
import { RecentEvents } from "../components/events/RecentEvents";
import { Hero } from "../components/hero/Hero";
import { SecurityOverview } from "../components/metrics/SecurityOverview";
import { SystemResources } from "../components/metrics/SystemResources";
import { ThreatMap } from "../components/threat-map/ThreatMap";
import { useStore } from "../app/store";
import type { PageId } from "../components/layout/Sidebar";

export default function Dashboard({ go }: { go: (p: PageId) => void }) {
  const { setSelectedDevice } = useStore();
  return (
    <div className="space-y-3.5">
      {/* Top Section: Hero Command Center + AI Assistant */}
      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Hero />
        <AssistantPanel />
      </div>

      {/* Bottom Section - Row 1: Security Overview, Real-Time Anomaly Analytics, System Resources */}
      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        <SecurityOverview />
        <AnomalyChart />
        <SystemResources />
      </div>

      {/* Bottom Section - Row 2: Live Threat Map, Recent Security Events, Monitored Devices */}
      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        <ThreatMap />
        <RecentEvents onSeeAll={() => go("reports")} />
        <MonitoredDevices onSeeAll={() => go("devices")} onOpen={(id) => { setSelectedDevice(id); go("devices"); }} />
      </div>
    </div>
  );
}
