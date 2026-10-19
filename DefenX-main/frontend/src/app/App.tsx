import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { MobileNav, NAV, Sidebar, type PageId } from "../components/layout/Sidebar";
import { TopBar } from "../components/layout/TopBar";
import Dashboard from "../pages/Dashboard";
import { AnomalyDetection, AssistantPage, DeviceSecurity, LiveMonitor, NetworkAnalysis, Reports, SettingsPage, ThreatIntel } from "../pages/Pages";
import { StoreProvider } from "./store";

const fromHash = (): PageId => (NAV.find((n) => n.id === location.hash.slice(1))?.id ?? "dashboard");

export default function App() {
  const [page, setPage] = useState<PageId>(fromHash);
  const go = useCallback((p: PageId) => { location.hash = p; setPage(p); window.scrollTo({ top: 0 }); }, []);
  useEffect(() => {
    const onHash = () => setPage(fromHash());
    const onNav = (e: Event) => go((e as CustomEvent<PageId>).detail);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("defenex:navigate", onNav);
    return () => { window.removeEventListener("hashchange", onHash); window.removeEventListener("defenex:navigate", onNav); };
  }, [go]);

  const view = {
    dashboard: <Dashboard go={go} />, monitor: <LiveMonitor />, anomaly: <AnomalyDetection />, intel: <ThreatIntel />,
    assistant: <AssistantPage />, devices: <DeviceSecurity />, network: <NetworkAnalysis />, reports: <Reports />, settings: <SettingsPage />,
  }[page];

  return (
    <StoreProvider>
      <Sidebar page={page} onNavigate={go} />
      <MobileNav page={page} onNavigate={go} />
      <main className="min-h-full px-3 pb-6 lg:ml-[212px] lg:pr-4">
        <TopBar onNavigate={go} />
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {view}
          </motion.div>
        </AnimatePresence>
      </main>
    </StoreProvider>
  );
}
