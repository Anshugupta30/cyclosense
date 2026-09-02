import React, { useState } from 'react';
import {
  Satellite,
  Eye,
  Activity,
  Sliders,
  Palette,
  Maximize2,
  Sparkles,
  Layers,
  Thermometer,
  Wind,
} from 'lucide-react';
import { CycloneEvent } from '../types';
import { ColormapType, getColorForValue } from '../ml/colormaps';

interface ChannelViewerProps {
  event: CycloneEvent | null;
}

export const ChannelViewer: React.FC<ChannelViewerProps> = ({ event }) => {
  const [colormap, setColormap] = useState<ColormapType>('bd_curve');
  const [activeChannel, setActiveChannel] = useState<'ir' | 'microwave' | 'wind' | 'water_vapor'>('ir');
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number; val: number } | null>(null);

  if (!event) {
    return (
      <div className="bg-[#0b1f36]/90 border border-slate-700/60 rounded-xl p-6 text-center text-xs text-slate-400 font-mono">
        Select a cyclone system to inspect satellite feeds.
      </div>
    );
  }

  const matrices = event.matrices;
  const currentMatrix = matrices ? matrices[activeChannel] || matrices.ir : null;

  // Compute radial profile data for mini chart
  const radialProfile = React.useMemo(() => {
    if (!currentMatrix) return [];
    const size = currentMatrix.length;
    const cx = size / 2;
    const cy = size / 2;
    const nBins = 16;
    const maxR = size / 2;
    const bins: number[] = Array(nBins).fill(0);
    const counts: number[] = Array(nBins).fill(0);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const b = Math.min(nBins - 1, Math.floor((r / maxR) * nBins));
        bins[b] += currentMatrix[y][x];
        counts[b]++;
      }
    }

    return bins.map((sum, i) => ({
      radiusKm: Math.round((i / nBins) * 200),
      val: counts[i] ? Math.round((sum / counts[i]) * 10) / 10 : 0,
    }));
  }, [currentMatrix]);

  const channelDescriptions = {
    ir: {
      name: 'IR 10.8µm (INSAT-3D/3DR TIR-1)',
      desc: 'Brightness Temperature (K). Detects cold convective cloud tops, Central Dense Overcast (CDO), and warm eye core.',
      unit: 'K',
    },
    microwave: {
      name: '89GHz Passive Microwave (GPM)',
      desc: 'Ice Scattering / Rain Banding. Penetrates upper cirrus canopy to reveal eyewall symmetry and spiral arms.',
      unit: 'dBZ / Rain Index',
    },
    wind: {
      name: 'Scatterometer Wind Field (SCATSAT-1)',
      desc: 'Near-surface 10m ocean surface wind speed (knots) resolved over 64x64km grid.',
      unit: 'kt',
    },
    water_vapor: {
      name: 'Water Vapor 6.7µm (WV Channel)',
      desc: 'Upper-tropospheric moisture inflow and dry air intrusion diagnostics.',
      unit: 'Relative Moisture',
    },
  };

  return (
    <div className="bg-[#0b1f36]/90 border border-slate-700/60 rounded-xl p-4 flex flex-col shadow-xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-teal-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Multi-Source Satellite Patch Inspector (64×64 Grid)
          </h3>
        </div>

        {/* Colormap Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <Palette className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-400 hidden sm:inline">Colormap:</span>
          <select
            value={colormap}
            onChange={(e) => setColormap(e.target.value as ColormapType)}
            className="bg-slate-900 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-teal-400"
          >
            <option value="bd_curve">Dvorak BD-Curve (Enhanced IR)</option>
            <option value="thermal_rainbow">Thermal Rainbow (Jet)</option>
            <option value="microwave_rain">Microwave Rain Intensity</option>
            <option value="wind_speed">Scatterometer Knots Scale</option>
            <option value="grayscale">High-Contrast Grayscale</option>
          </select>
        </div>
      </div>

      {/* Main Channel Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {(['ir', 'microwave', 'wind', 'water_vapor'] as const).map((ch) => {
          const isSelected = activeChannel === ch;
          const rawThumbnail = event.channels ? (event.channels[ch] || event.channels.ir) : null;
          const thumbnail = rawThumbnail && rawThumbnail.trim().length > 0 ? rawThumbnail : null;

          return (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={`p-2 rounded-xl border text-left flex flex-col items-center gap-2 transition-all ${
                isSelected
                  ? 'bg-teal-950/80 border-teal-400 shadow-md shadow-teal-950/50'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
              }`}
            >
              <div className="relative w-full aspect-square max-w-[120px] rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 flex items-center justify-center">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={ch}
                    className="w-full h-full object-cover select-none"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="text-[10px] font-mono text-slate-500 flex items-center justify-center w-full h-full">
                    {ch.toUpperCase()}
                  </div>
                )}
                {isSelected && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-[#0b1f36]" />
                )}
              </div>
              <div className="text-center w-full">
                <span className="text-[11px] font-bold text-slate-200 block truncate">
                  {ch.toUpperCase()}
                </span>
                <span className="text-[9px] font-mono text-slate-400 block truncate">
                  {ch === 'ir' ? 'INSAT-3D' : ch === 'microwave' ? '89GHz GPM' : ch === 'wind' ? 'SCATSAT-1' : 'WV 6.7µm'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Satellite Patch Canvas & Radial Profile Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
        {/* Left: Pixel Grid Canvas Inspector */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="relative group p-2 rounded-xl bg-slate-900 border border-slate-800">
            {currentMatrix ? (
              <canvas
                width={64}
                height={64}
                className="w-56 h-56 rounded-lg cursor-crosshair border border-slate-700 shadow-inner"
                style={{ imageRendering: 'pixelated' }}
                ref={(canvas) => {
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  const imgData = ctx.createImageData(64, 64);
                  let min = Infinity, max = -Infinity;
                  for (let r = 0; r < 64; r++) {
                    for (let c = 0; c < 64; c++) {
                      const v = currentMatrix[r][c];
                      if (v < min) min = v;
                      if (v > max) max = v;
                    }
                  }
                  const range = max - min || 1;
                  let idx = 0;
                  for (let r = 0; r < 64; r++) {
                    for (let c = 0; c < 64; c++) {
                      const v01 = (currentMatrix[r][c] - min) / range;
                      const [red, green, blue] = getColorForValue(v01, colormap);
                      imgData.data[idx] = red;
                      imgData.data[idx + 1] = green;
                      imgData.data[idx + 2] = blue;
                      imgData.data[idx + 3] = 255;
                      idx += 4;
                    }
                  }
                  ctx.putImageData(imgData, 0, 0);
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const px = Math.floor(((e.clientX - rect.left) / rect.width) * 64);
                  const py = Math.floor(((e.clientY - rect.top) / rect.height) * 64);
                  if (px >= 0 && px < 64 && py >= 0 && py < 64 && currentMatrix) {
                    setHoveredPixel({ x: px, y: py, val: currentMatrix[py][px] });
                  }
                }}
                onMouseLeave={() => setHoveredPixel(null)}
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-500 font-mono">
                Matrix loading...
              </div>
            )}

            {/* Reticle / Eyewall Ring Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border border-teal-400/40" />
              <div className="w-20 h-20 rounded-full border border-teal-400/20 border-dashed" />
            </div>
          </div>

          {/* Hovered Pixel Coordinates */}
          <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-3">
            {hoveredPixel ? (
              <>
                <span>Grid: [{hoveredPixel.x}, {hoveredPixel.y}]</span>
                <span>
                  Value: <strong className="text-teal-300">{hoveredPixel.val.toFixed(1)} {channelDescriptions[activeChannel].unit}</strong>
                </span>
              </>
            ) : (
              <span>Hover canvas to inspect pixel telemetry</span>
            )}
          </div>
        </div>

        {/* Right: Radial Profile & Physical Features */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              {channelDescriptions[activeChannel].name}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {channelDescriptions[activeChannel].desc}
            </p>
          </div>

          {/* Radial Cross-Section Graph */}
          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
              <span>Radial Profile (Eye → Outer Bands)</span>
              <span className="text-teal-400 font-bold">ΔT / Gradient</span>
            </div>
            <svg viewBox="0 0 200 65" className="w-full h-16">
              {/* Grid lines */}
              <line x1="0" y1="15" x2="200" y2="15" stroke="rgba(255,255,255,0.06)" />
              <line x1="0" y1="35" x2="200" y2="35" stroke="rgba(255,255,255,0.06)" />
              <line x1="0" y1="55" x2="200" y2="55" stroke="rgba(255,255,255,0.06)" />

              {/* Radial curve */}
              {radialProfile.length > 0 && (() => {
                const vals = radialProfile.map((p) => p.val);
                const min = Math.min(...vals);
                const max = Math.max(...vals);
                const range = max - min || 1;
                const pts = radialProfile.map((p, i) => {
                  const x = (i / (radialProfile.length - 1)) * 200;
                  const y = 60 - ((p.val - min) / range) * 50;
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#14b8a6"
                      strokeWidth="2"
                      points={pts}
                    />
                    {radialProfile.map((p, i) => {
                      const x = (i / (radialProfile.length - 1)) * 200;
                      const y = 60 - ((p.val - min) / range) * 50;
                      return (
                        <circle key={i} cx={x} cy={y} r="2" fill="#38bdf8" />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>0km (Eye)</span>
              <span>100km</span>
              <span>200km (Outer)</span>
            </div>
          </div>

          {/* Dvorak Mathematical Feature Summary */}
          {event.features && (
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block">ROTATIONAL SYMMETRY</span>
                <span className="text-sm font-bold text-teal-400">
                  {event.features.symmetry_score} <span className="text-[9px] text-slate-500">/ 1.000</span>
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block">GRADIENT ENERGY</span>
                <span className="text-sm font-bold text-amber-400">
                  {event.features.gradient_energy} <span className="text-[9px] text-slate-500">Sobel</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
