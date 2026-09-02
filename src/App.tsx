import React, { useState, useEffect, useCallback } from 'react';
import { CycloneEvent } from './types';
import { Header } from './components/Header';
import { SystemList } from './components/SystemList';
import { OceanMap } from './components/OceanMap';
import { ChannelViewer } from './components/ChannelViewer';
import { ForecastPanel } from './components/ForecastPanel';
import { AIBulletinModal } from './components/AIBulletinModal';
import { SimulatorModal } from './components/SimulatorModal';
import { AlertsCenterModal } from './components/AlertsCenterModal';
import { EvaluationModal } from './components/EvaluationModal';
import { DownloadPackageModal } from './components/DownloadPackageModal';
import { getInitialDemoEvents } from './ml/engine';
import { Radio, ShieldCheck, Terminal, AlertCircle } from 'lucide-react';

export default function App() {
  const [events, setEvents] = useState<CycloneEvent[]>(() => getInitialDemoEvents());
  const [selectedId, setSelectedId] = useState<string | null>('evt-1');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isAIBulletinOpen, setIsAIBulletinOpen] = useState(false);
  const [isAlertsCenterOpen, setIsAlertsCenterOpen] = useState(false);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch events from backend API (with graceful fallback to client simulation)
  const fetchEvents = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Fetch detailed version for the selected event to ensure full matrices exist
        const currentSelected = selectedId || data[0].id;
        try {
          const detailRes = await fetch(`/api/events/${currentSelected}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            setEvents((prev) =>
              data.map((item: CycloneEvent) =>
                item.id === currentSelected ? detailData : item
              )
            );
          } else {
            setEvents(data);
          }
        } catch {
          setEvents(data);
        }
        setApiError(null);
      }
    } catch (err: any) {
      console.warn('Backend /api/events offline, running local physics simulation.', err);
      // Fallback already initialized in state
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchEvents();
  }, []);

  // When selectedId changes, ensure we have full details including matrices
  useEffect(() => {
    if (!selectedId) return;
    const existing = events.find((e) => e.id === selectedId);
    if (!existing || !existing.matrices) {
      fetch(`/api/events/${selectedId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setEvents((prev) =>
              prev.map((e) => (e.id === selectedId ? data : e))
            );
          }
        })
        .catch(() => {});
    }
  }, [selectedId]);

  const selectedEvent = events.find((e) => e.id === selectedId) || events[0] || null;

  const handleInjectSimulatedEvent = (newEvent: CycloneEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
    setSelectedId(newEvent.id);
  };

  return (
    <div className="min-h-screen bg-[#071322] text-slate-100 flex flex-col selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Main Navigation */}
      <Header
        selectedEvent={selectedEvent}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenAIBulletin={() => setIsAIBulletinOpen(true)}
        onOpenAlertsCenter={() => setIsAlertsCenterOpen(true)}
        onOpenEvaluation={() => setIsEvaluationOpen(true)}
        onOpenDownload={() => setIsDownloadOpen(true)}
        onRefreshData={fetchEvents}
        isRefreshing={isRefreshing}
      />

      {/* API Notice / Banner if running in standalone mode */}
      {apiError && (
        <div className="bg-amber-950/80 border-b border-amber-800 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between font-mono">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            {apiError} — Running local client-side ML engine.
          </span>
          <button
            onClick={() => setApiError(null)}
            className="text-amber-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main 3-Column Dashboard Grid */}
      <main className="flex-1 p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-4 items-start max-w-[1800px] w-full mx-auto">
        {/* Left Column: Active Systems List (col-span-3) */}
        <div className="lg:col-span-3 h-full max-h-[880px]">
          <SystemList
            events={events}
            selectedId={selectedId}
            onSelectEvent={setSelectedId}
            isLoading={isLoading}
          />
        </div>

        {/* Center Column: Ocean Basin Map + Satellite Multi-Channel Inspector (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col space-y-3.5">
          <div className="h-[460px]">
            <OceanMap
              events={events}
              selectedId={selectedId}
              onSelectEvent={setSelectedId}
            />
          </div>

          <ChannelViewer event={selectedEvent} />
        </div>

        {/* Right Column: 72h Intensity Forecast & Classification Breakdown (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col space-y-3.5">
          <ForecastPanel
            event={selectedEvent}
            onOpenAIBulletin={() => setIsAIBulletinOpen(true)}
          />
        </div>
      </main>

      {/* Modals */}
      <AIBulletinModal
        event={selectedEvent}
        isOpen={isAIBulletinOpen}
        onClose={() => setIsAIBulletinOpen(false)}
      />

      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onInjectEvent={handleInjectSimulatedEvent}
      />

      <AlertsCenterModal
        event={selectedEvent}
        isOpen={isAlertsCenterOpen}
        onClose={() => setIsAlertsCenterOpen(false)}
      />

      <EvaluationModal
        isOpen={isEvaluationOpen}
        onClose={() => setIsEvaluationOpen(false)}
      />

      <DownloadPackageModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />

      {/* Footer Strip */}
      <footer className="bg-[#050f1a] border-t border-slate-800/80 px-4 py-2.5 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span>CycloSence AI · Build with भारत 2.0</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">IMD &amp; WMO Scale Multi-Source Cyclone Identification</span>
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Models Active: RandomForest + Dvorak CI
          </span>
          <span>Resolution: 64×64 km Multi-Channel</span>
        </div>
      </footer>
    </div>
  );
}
