import { AssistantPanel } from "../components/assistant/AssistantPanel";
import { AnomalyChart } from "../components/charts/AnomalyChart";
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
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_310px]">
        <Hero />
        <AssistantPanel />
      </div>
      <div className="stretch grid gap-3 lg:grid-cols-2 xl:grid-cols-[1fr_1.25fr_1.15fr]">
        <SecurityOverview />
        <AnomalyChart />
        <div className="lg:col-span-2 xl:col-span-1"><SystemResources /></div>
      </div>
      <div className="stretch grid gap-3 lg:grid-cols-2 xl:grid-cols-[1.1fr_1fr_.85fr]">
        <div className="lg:col-span-2 xl:col-span-1"><ThreatMap /></div>
        <RecentEvents onSeeAll={() => go("reports")} />
        <MonitoredDevices onSeeAll={() => go("devices")} onOpen={(id) => { setSelectedDevice(id); go("devices"); }} />
      </div>
    </div>
  );
}
