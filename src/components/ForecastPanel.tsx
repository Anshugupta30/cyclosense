import React from 'react';
import {
  TrendingUp,
  Wind,
  Gauge,
  Compass,
  AlertTriangle,
  Eye,
  BarChart3,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { CycloneEvent } from '../types';
import { IMD_STAGES, STAGE_NAMES } from '../ml/engine';

interface ForecastPanelProps {
  event: CycloneEvent | null;
  onOpenAIBulletin: () => void;
}

export const ForecastPanel: React.FC<ForecastPanelProps> = ({
  event,
  onOpenAIBulletin,
}) => {
  if (!event) {
    return (
      <div className="bg-[#0b1f36]/90 border border-slate-700/60 rounded-xl p-6 text-center text-xs text-slate-400 font-mono">
        Select a tropical system to view 72h forecast.
      </div>
    );
  }

  const stageConfig = IMD_STAGES[event.stage];
  const forecastPoints = [
    {
      hours: 0,
      wind_kt: event.wind_kt,
      wind_kmh: event.wind_kmh,
      pressure_hpa: event.pressure_hpa,
      stage_name: stageConfig.shortName,
      lat: event.lat,
      lon: event.lon,
    },
    ...event.forecast,
  ];

  // SVG Chart Dimensions
  const chartW = 340;
  const chartH = 140;
  const padL = 36;
  const padR = 36;
  const padT = 16;
  const padB = 24;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const maxWind = Math.max(...forecastPoints.map((p) => p.wind_kt), 120);
  const minPressure = Math.min(...forecastPoints.map((p) => p.pressure_hpa), 920);
  const maxPressure = Math.max(...forecastPoints.map((p) => p.pressure_hpa), 1010);

  const getX = (hours: number) => padL + (hours / 72) * innerW;
  const getYWind = (wind: number) => padT + innerH - (wind / maxWind) * innerH;
  const getYPress = (press: number) =>
    padT + ((press - minPressure) / (maxPressure - minPressure || 1)) * innerH;

  const windPath = forecastPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.hours)} ${getYWind(p.wind_kt)}`)
    .join(' ');

  const pressPath = forecastPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.hours)} ${getYPress(p.pressure_hpa)}`)
    .join(' ');

  return (
    <div className="bg-[#0b1f36]/90 border border-slate-700/60 rounded-xl p-4 flex flex-col shadow-xl space-y-4">
      {/* Header with Title & Stage Badge */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Cyclone {event.name}
            </h2>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${stageConfig.color}25`,
                color: stageConfig.color,
                border: `1px solid ${stageConfig.color}70`,
              }}
            >
              {stageConfig.shortName}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Current Intensity: T{event.dvorak_t_number} · CI {event.ci_number} · {event.eye_status}
          </span>
        </div>

        <button
          onClick={onOpenAIBulletin}
          className="px-2.5 py-1.5 text-[11px] font-semibold text-sky-200 bg-sky-950/80 hover:bg-sky-900 border border-sky-600/50 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
        >
          <Sparkles className="w-3 h-3 text-yellow-300" />
          <span>AI Advisory</span>
        </button>
      </div>

      {/* Primary Key Stats Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Wind className="w-3 h-3 text-teal-400" />
            MAX WIND
          </span>
          <span className="text-base font-bold font-mono text-slate-100 mt-1">
            {event.wind_kt} <span className="text-xs font-normal text-slate-400">kt</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {event.wind_kmh} km/h
          </span>
        </div>

        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-sky-400" />
            CENTRAL PRESSURE
          </span>
          <span className="text-base font-bold font-mono text-sky-300 mt-1">
            {event.pressure_hpa} <span className="text-xs font-normal text-slate-400">hPa</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            ΔP: -{(1012 - event.pressure_hpa)} hPa
          </span>
        </div>

        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Compass className="w-3 h-3 text-amber-400" />
            MOVEMENT
          </span>
          <span className="text-base font-bold font-mono text-amber-300 mt-1">
            {event.heading_deg}° <span className="text-xs font-normal text-slate-400">dir</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {event.speed_kmh} km/h speed
          </span>
        </div>

        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Eye className="w-3 h-3 text-purple-400" />
            EYEWALL RADIUS
          </span>
          <span className="text-base font-bold font-mono text-purple-300 mt-1">
            {event.rmw_km} <span className="text-xs font-normal text-slate-400">km</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500 truncate">
            {event.eye_status.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* 72h Intensity & Pressure Evolution Graph */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
          <span className="font-bold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
            72h Intensity &amp; Pressure Trajectory
          </span>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-teal-400">
              <span className="w-2 h-0.5 bg-teal-400 inline-block" /> Wind (kt)
            </span>
            <span className="flex items-center gap-1 text-sky-400">
              <span className="w-2 h-0.5 bg-sky-400 inline-block" /> Pressure (hPa)
            </span>
          </div>
        </div>

        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-32 select-none">
          {/* Hour Gridlines */}
          {[0, 24, 48, 72].map((h) => (
            <g key={`h-grid-${h}`}>
              <line
                x1={getX(h)}
                y1={padT}
                x2={getX(h)}
                y2={padT + innerH}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="2 2"
              />
              <text
                x={getX(h)}
                y={chartH - 6}
                fill="rgba(148, 163, 184, 0.7)"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {h === 0 ? 'NOW' : `+${h}h`}
              </text>
            </g>
          ))}

          {/* Wind Curve */}
          <path d={windPath} fill="none" stroke="#14b8a6" strokeWidth="2.5" />
          {forecastPoints.map((p) => (
            <g key={`wind-pt-${p.hours}`}>
              <circle cx={getX(p.hours)} cy={getYWind(p.wind_kt)} r="4" fill="#14b8a6" stroke="#081a30" strokeWidth="1.5" />
              <text
                x={getX(p.hours)}
                y={getYWind(p.wind_kt) - 8}
                fill="#2dd4bf"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {p.wind_kt}kt
              </text>
            </g>
          ))}

          {/* Pressure Curve */}
          <path d={pressPath} fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="4 3" />
          {forecastPoints.map((p) => (
            <g key={`press-pt-${p.hours}`}>
              <circle cx={getX(p.hours)} cy={getYPress(p.pressure_hpa)} r="3" fill="#38bdf8" />
              <text
                x={getX(p.hours)}
                y={getYPress(p.pressure_hpa) + 12}
                fill="#7dd3fc"
                fontSize="8"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {p.pressure_hpa}hPa
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* IMD Classification Probability Distribution */}
      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-300">
          <span className="font-bold flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
            ML Classification Confidence
          </span>
          <span className="text-teal-400 font-bold">
            {(event.confidence * 100).toFixed(1)}% Confident
          </span>
        </div>

        <div className="space-y-1.5">
          {STAGE_NAMES.map((name, i) => {
            const prob = event.probabilities[name] || 0;
            const pct = Math.round(prob * 100);
            const stageCfg = IMD_STAGES[i as 0 | 1 | 2 | 3 | 4 | 5];
            const isPredicted = event.stage === i;

            return (
              <div key={name} className="flex items-center gap-2 text-[11px] font-mono">
                <span className={`w-32 truncate ${isPredicted ? 'text-white font-bold' : 'text-slate-400'}`}>
                  {stageCfg.shortName}
                </span>
                <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: stageCfg.color,
                    }}
                  />
                </div>
                <span className={`w-9 text-right ${isPredicted ? 'text-teal-300 font-bold' : 'text-slate-500'}`}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 24/48/72h Waypoints Table */}
      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
        <span className="text-xs font-bold font-mono text-slate-300 block">
          Track Progression &amp; Coastal Proximity
        </span>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-mono text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[10px]">
                <th className="pb-1.5">TIME</th>
                <th className="pb-1.5">POSITION</th>
                <th className="pb-1.5">WIND</th>
                <th className="pb-1.5">STAGE</th>
                <th className="pb-1.5 text-right">UNCERTAINTY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {event.forecast.map((f) => (
                <tr key={f.hours} className="hover:bg-slate-800/40">
                  <td className="py-1.5 font-bold text-amber-300">+{f.hours}h</td>
                  <td className="py-1.5 text-slate-200">
                    {f.lat.toFixed(1)}°N, {f.lon.toFixed(1)}°E
                  </td>
                  <td className="py-1.5 font-bold text-teal-300">{f.wind_kt} kt</td>
                  <td className="py-1.5 text-slate-300">{f.stage_name}</td>
                  <td className="py-1.5 text-right text-slate-400">±{f.uncertainty_radius_km} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
