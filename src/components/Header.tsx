import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Radio,
  Play,
  FileText,
  Clock,
  Waves,
  RefreshCw,
  Sparkles,
  BellRing,
  Award,
  Download,
  Info,
} from 'lucide-react';
import { CycloneEvent } from '../types';

interface HeaderProps {
  selectedEvent: CycloneEvent | null;
  onOpenSimulator: () => void;
  onOpenAIBulletin: () => void;
  onOpenAlertsCenter: () => void;
  onOpenEvaluation: () => void;
  onOpenDownload: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedEvent,
  onOpenSimulator,
  onOpenAIBulletin,
  onOpenAlertsCenter,
  onOpenEvaluation,
  onOpenDownload,
  onRefreshData,
  isRefreshing,
}) => {
  const [timeUtc, setTimeUtc] = useState('');
  const [timeIst, setTimeIst] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().slice(17, 25) + ' UTC');
      // Indian Standard Time (UTC+5:30)
      const istDate = new Date(now.getTime() + 5.5 * 3600 * 1000);
      setTimeIst(istDate.toISOString().slice(11, 19) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#0b1f36] border-b border-slate-700/60 px-4 lg:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl z-20">
      {/* Brand & Mission Tag */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500/20 to-sky-600/30 border border-teal-400/40 shadow-inner">
          <Radio className="w-5 h-5 text-teal-400 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0b1f36]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              CycloSense <span className="text-teal-400 font-mono text-sm px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-500/40">AI</span>
            </h1>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-300/80 bg-sky-950/70 border border-sky-800/60 px-2 py-0.5 rounded-full hidden sm:inline-block">
              IMD / WMO Tier-1 System
            </span>
          </div>
          <p className="text-xs text-slate-300/80 tracking-wide mt-0.5 max-w-xl truncate hidden md:block">
            AI/ML Multi-Source Satellite Identification, Dvorak T-Analysis &amp; 72h Track Prediction
          </p>
        </div>
      </div>

      {/* Satellite Feeds Telemetry Status */}
      <div className="hidden xl:flex items-center gap-4 text-xs font-mono bg-slate-900/80 border border-slate-700/60 px-3.5 py-1.5 rounded-lg shadow-inner">
        <div className="flex items-center gap-2">
          <Satellite className="w-3.5 h-3.5 text-sky-400 animate-spin-slow" />
          <span className="text-slate-400">FEEDS:</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            INSAT-3D/3DR · SCATSAT-1 · GPM-89GHz
          </span>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{timeUtc}</span>
          <span className="text-slate-500">|</span>
          <span className="text-teal-300">{timeIst}</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2.5">
        <button
          id="btn-refresh-feed"
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          title="Refresh satellite telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        <button
          id="btn-open-evaluation-benchmarks"
          onClick={onOpenEvaluation}
          className="px-3 py-2 text-xs font-semibold text-teal-200 bg-teal-950/80 hover:bg-teal-900 border border-teal-600/50 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors font-mono"
        >
          <Award className="w-3.5 h-3.5 text-teal-300" />
          <span className="hidden lg:inline">ML Benchmarks</span>
        </button>

        {selectedEvent && (
          <button
            id="btn-open-alerts-center"
            onClick={onOpenAlertsCenter}
            className="px-3.5 py-2 text-xs font-semibold text-rose-100 bg-gradient-to-r from-rose-700 to-red-700 hover:from-rose-600 hover:to-red-600 border border-rose-400/40 rounded-lg shadow-md hover:shadow-rose-500/20 transition-all flex items-center gap-1.5"
          >
            <BellRing className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
            <span>Alerts</span>
          </button>
        )}

        {selectedEvent && (
          <button
            id="btn-open-ai-advisory"
            onClick={onOpenAIBulletin}
            className="px-3.5 py-2 text-xs font-semibold text-sky-100 bg-gradient-to-r from-sky-700 to-indigo-700 hover:from-sky-600 hover:to-indigo-600 border border-sky-400/40 rounded-lg shadow-md hover:shadow-sky-500/20 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>AI Bulletin</span>
          </button>
        )}

        <button
          id="btn-open-ml-simulator"
          onClick={onOpenSimulator}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 border border-teal-300/40 rounded-lg shadow-md hover:shadow-teal-500/25 transition-all flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simulate</span>
        </button>

        <button
          id="btn-download-project-zip"
          onClick={onOpenDownload}
          className="px-3.5 py-2 text-xs font-bold text-emerald-100 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/50 rounded-lg shadow-md hover:shadow-emerald-500/25 transition-all flex items-center gap-1.5 font-mono"
          title="Download Complete Project as ZIP to run offline"
        >
          <Download className="w-3.5 h-3.5 text-emerald-200" />
          <span>Download ZIP</span>
        </button>
      </div>
    </header>
  );
};
