import React, { useState } from 'react';
import {
  Wind,
  Compass,
  Gauge,
  MapPin,
  Search,
  SlidersHorizontal,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { CycloneEvent, IMDStageCode } from '../types';
import { IMD_STAGES } from '../ml/engine';

interface SystemListProps {
  events: CycloneEvent[];
  selectedId: string | null;
  onSelectEvent: (id: string) => void;
  isLoading: boolean;
}

export const SystemList: React.FC<SystemListProps> = ({
  events,
  selectedId,
  onSelectEvent,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'severe' | 'moderate'>('all');

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.basin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.stage_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (stageFilter === 'severe') return e.stage >= 4;
    if (stageFilter === 'moderate') return e.stage < 4;
    return true;
  });

  return (
    <aside className="bg-[#0b1f36]/90 border border-slate-700/60 rounded-xl p-4 flex flex-col h-full shadow-lg backdrop-blur-sm">
      {/* Header & Filter Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Active Systems ({events.length})
          </h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
          N. Indian Ocean
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        <input
          id="system-search-input"
          type="text"
          placeholder="Filter by system name or basin..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900/90 text-slate-200 placeholder-slate-500 border border-slate-700/80 rounded-lg focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 font-mono transition-all"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-1 mb-3 p-1 bg-slate-900/60 rounded-lg border border-slate-800 text-[11px] font-medium">
        <button
          onClick={() => setStageFilter('all')}
          className={`flex-1 py-1 rounded transition-colors ${
            stageFilter === 'all'
              ? 'bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({events.length})
        </button>
        <button
          onClick={() => setStageFilter('severe')}
          className={`flex-1 py-1 rounded transition-colors ${
            stageFilter === 'severe'
              ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Severe (≥64kt)
        </button>
        <button
          onClick={() => setStageFilter('moderate')}
          className={`flex-1 py-1 rounded transition-colors ${
            stageFilter === 'moderate'
              ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Depressions
        </button>
      </div>

      {/* Systems List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            <span>Streaming satellite feeds...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono bg-slate-900/40 rounded-lg border border-slate-800">
            No tropical systems match filter.
          </div>
        ) : (
          filteredEvents.map((e) => {
            const isSelected = e.id === selectedId;
            const stageConfig = IMD_STAGES[e.stage];
            const isSevere = e.stage >= 4;

            return (
              <div
                key={e.id}
                id={`system-card-${e.id}`}
                onClick={() => onSelectEvent(e.id)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-teal-950/70 to-slate-900/90 border-teal-400 shadow-md shadow-teal-950/40'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Name, Stage Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white group-hover:text-teal-300 transition-colors">
                        Cyclone {e.name}
                      </span>
                      {isSevere && (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-slate-500" />
                      {e.basin} ({e.lat.toFixed(1)}°N, {e.lon.toFixed(1)}°E)
                    </span>
                  </div>

                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm"
                    style={{
                      backgroundColor: `${stageConfig.color}25`,
                      color: stageConfig.color,
                      border: `1px solid ${stageConfig.color}60`,
                    }}
                  >
                    {stageConfig.shortName}
                  </span>
                </div>

                {/* Metric Quick Strip */}
                <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2 bg-slate-950/60 rounded-lg border border-slate-800/80 text-[11px] font-mono">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">WIND</span>
                    <span className="font-bold text-slate-200">
                      {e.wind_kt} <span className="text-[9px] font-normal text-slate-400">kt</span>
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">PRESSURE</span>
                    <span className="font-bold text-slate-200">
                      {e.pressure_hpa} <span className="text-[9px] font-normal text-slate-400">hPa</span>
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">DVORAK</span>
                    <span className="font-bold text-teal-400">T{e.dvorak_t_number}</span>
                  </div>
                </div>

                {/* Nearest Coastland Alert */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="truncate">
                    Near: <strong className="text-slate-300">{e.nearest_coast.name.split(',')[0]}</strong>
                  </span>
                  <span className="font-mono text-teal-400/90 font-medium whitespace-nowrap">
                    {e.nearest_coast.distance_km} km
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
