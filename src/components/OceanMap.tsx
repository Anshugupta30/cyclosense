import React, { useState } from 'react';
import {
  Layers,
  Compass,
  Navigation,
  Crosshair,
  MapPin,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Wind,
} from 'lucide-react';
import { CycloneEvent, ForecastPoint } from '../types';
import { IMD_STAGES } from '../ml/engine';

interface OceanMapProps {
  events: CycloneEvent[];
  selectedId: string | null;
  onSelectEvent: (id: string) => void;
}

// Map projection bounds for the North Indian Ocean Basin
const MAP_BOUNDS = {
  latMin: 4.0,
  latMax: 26.0,
  lonMin: 62.0,
  lonMax: 96.0,
};

function project(lat: number, lon: number, width: number, height: number): [number, number] {
  const x = ((lon - MAP_BOUNDS.lonMin) / (MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin)) * width;
  const y = height - ((lat - MAP_BOUNDS.latMin) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * height;
  return [x, y];
}

export const OceanMap: React.FC<OceanMapProps> = ({
  events,
  selectedId,
  onSelectEvent,
}) => {
  const [showCone, setShowCone] = useState(true);
  const [showTrack, setShowTrack] = useState(true);
  const [showCoastalAlerts, setShowCoastalAlerts] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: ForecastPoint | null;
    x: number;
    y: number;
  }>({ point: null, x: 0, y: 0 });

  const width = 800;
  const height = 580;

  const selectedEvent = events.find((e) => e.id === selectedId) || events[0];

  // Major coastal reference ports
  const COASTAL_CITIES = [
    { name: 'Kolkata / Sundarbans', lat: 22.57, lon: 88.36, state: 'West Bengal' },
    { name: 'Paradip Port', lat: 20.31, lon: 86.61, state: 'Odisha' },
    { name: 'Puri Beach', lat: 19.81, lon: 85.83, state: 'Odisha' },
    { name: 'Visakhapatnam', lat: 17.68, lon: 83.21, state: 'Andhra Pradesh' },
    { name: 'Machilipatnam', lat: 16.18, lon: 81.13, state: 'Andhra Pradesh' },
    { name: 'Chennai Port', lat: 13.08, lon: 80.27, state: 'Tamil Nadu' },
    { name: 'Nagapattinam', lat: 10.76, lon: 79.84, state: 'Tamil Nadu' },
    { name: 'Veraval Port', lat: 20.90, lon: 70.36, state: 'Gujarat' },
    { name: 'Mumbai Port', lat: 18.92, lon: 72.83, state: 'Maharashtra' },
    { name: 'Panaji / Goa', lat: 15.49, lon: 73.82, state: 'Goa' },
    { name: 'Mangaluru', lat: 12.91, lon: 74.85, state: 'Karnataka' },
    { name: 'Kochi Port', lat: 9.93, lon: 76.26, state: 'Kerala' },
    { name: 'Chittagong Port', lat: 22.33, lon: 91.83, state: 'Bangladesh' },
    { name: 'Cox\'s Bazar', lat: 21.42, lon: 91.97, state: 'Bangladesh' },
    { name: 'Sittwe Port', lat: 20.15, lon: 92.90, state: 'Myanmar' },
    { name: 'Colombo', lat: 6.92, lon: 79.86, state: 'Sri Lanka' },
    { name: 'Port Blair', lat: 11.62, lon: 92.72, state: 'Andaman & Nicobar' },
  ];

  // Draw Uncertainty Cone Polygon for 24h, 48h, 72h
  const renderUncertaintyCone = (event: CycloneEvent) => {
    if (!event.forecast || event.forecast.length < 3) return null;
    const [currX, currY] = project(event.lat, event.lon, width, height);

    const pts = event.forecast.map((f) => {
      const [fx, fy] = project(f.lat, f.lon, width, height);
      // Scale uncertainty radius in pixels (approx 1 degree ~ 25px on this map)
      const rPx = (f.uncertainty_radius_km / 111.0) * ((width / (MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin)));
      return { fx, fy, rPx };
    });

    // Approximate tangent boundary polygon
    const p1 = pts[0];
    const p2 = pts[1];
    const p3 = pts[2];

    const angle = Math.atan2(p3.fy - currY, p3.fx - currX);
    const normalAngle = angle + Math.PI / 2;

    const leftTop = [p3.fx + Math.cos(normalAngle) * p3.rPx, p3.fy + Math.sin(normalAngle) * p3.rPx];
    const leftMid = [p2.fx + Math.cos(normalAngle) * p2.rPx, p2.fy + Math.sin(normalAngle) * p2.rPx];
    const leftLow = [p1.fx + Math.cos(normalAngle) * p1.rPx, p1.fy + Math.sin(normalAngle) * p1.rPx];

    const rightTop = [p3.fx - Math.cos(normalAngle) * p3.rPx, p3.fy - Math.sin(normalAngle) * p3.rPx];
    const rightMid = [p2.fx - Math.cos(normalAngle) * p2.rPx, p2.fy - Math.sin(normalAngle) * p2.rPx];
    const rightLow = [p1.fx - Math.cos(normalAngle) * p1.rPx, p1.fy - Math.sin(normalAngle) * p1.rPx];

    const conePath = `
      M ${currX} ${currY}
      L ${leftLow[0]} ${leftLow[1]}
      Q ${leftMid[0]} ${leftMid[1]} ${leftTop[0]} ${leftTop[1]}
      A ${p3.rPx} ${p3.rPx} 0 0 1 ${rightTop[0]} ${rightTop[1]}
      Q ${rightMid[0]} ${rightMid[1]} ${rightLow[0]} ${rightLow[1]}
      Z
    `;

    return (
      <g className="uncertainty-cone-layer">
        <path
          d={conePath}
          fill="rgba(234, 88, 12, 0.14)"
          stroke="rgba(234, 88, 12, 0.45)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        {pts.map((pt, i) => (
          <circle
            key={`cone-circle-${i}`}
            cx={pt.fx}
            cy={pt.fy}
            r={pt.rPx}
            fill="none"
            stroke="rgba(234, 88, 12, 0.25)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        ))}
      </g>
    );
  };

  return (
    <div className="relative bg-[#07172b] border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Map Control Bar */}
      <div className="bg-[#0b1f36]/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs z-10">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-teal-400" />
          <span className="font-bold text-slate-200 uppercase tracking-wider">
            North Indian Ocean Basin Map
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Arabian Sea &amp; Bay of Bengal
          </span>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTrack(!showTrack)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
              showTrack
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            72h Track
          </button>
          <button
            onClick={() => setShowCone(!showCone)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
              showCone
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            Cone Envelope
          </button>
          <button
            onClick={() => setShowCoastalAlerts(!showCoastalAlerts)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
              showCoastalAlerts
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            Ports &amp; Coasts
          </button>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative flex-1 w-full min-h-[420px] bg-[#07172b]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full object-cover select-none"
        >
          <defs>
            {/* Ocean depth gradient */}
            <radialGradient id="ocean-glow" cx="65%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0d2847" />
              <stop offset="60%" stopColor="#081a30" />
              <stop offset="100%" stopColor="#051020" />
            </radialGradient>

            {/* Track gradient */}
            <linearGradient id="track-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>

            {/* Vortex spiral filter */}
            <filter id="glow-vortex" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ocean Background */}
          <rect width={width} height={height} fill="url(#ocean-glow)" />

          {/* Bathymetry / Basin Labels */}
          <text x={project(15, 68, width, height)[0]} y={project(15, 68, width, height)[1]} fill="rgba(56, 189, 248, 0.15)" fontSize="20" fontWeight="bold" letterSpacing="4" textAnchor="middle">
            ARABIAN SEA
          </text>
          <text x={project(15, 89, width, height)[0]} y={project(15, 89, width, height)[1]} fill="rgba(56, 189, 248, 0.15)" fontSize="20" fontWeight="bold" letterSpacing="4" textAnchor="middle">
            BAY OF BENGAL
          </text>

          {/* Lat/Lon Gridlines */}
          {showGrid && (
            <g className="grid-layer">
              {[8, 12, 16, 20, 24].map((lat) => {
                const [, y] = project(lat, MAP_BOUNDS.lonMin, width, height);
                return (
                  <g key={`lat-grid-${lat}`}>
                    <line x1={0} y1={y} x2={width} y2={y} stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="3 3" />
                    <text x={8} y={y - 4} fill="rgba(148, 163, 184, 0.45)" fontSize="10" fontFamily="monospace">
                      {lat}°N
                    </text>
                  </g>
                );
              })}
              {[66, 72, 78, 84, 90].map((lon) => {
                const [x] = project(MAP_BOUNDS.latMin, lon, width, height);
                return (
                  <g key={`lon-grid-${lon}`}>
                    <line x1={x} y1={0} x2={x} y2={height} stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="3 3" />
                    <text x={x + 4} y={height - 8} fill="rgba(148, 163, 184, 0.45)" fontSize="10" fontFamily="monospace">
                      {lon}°E
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Landmass Geometries (Indian Subcontinent, Sri Lanka, Bangladesh, Myanmar) */}
          <g className="landmass-layer" fill="#132a45" stroke="#254b73" strokeWidth="1.2">
            {/* Indian Mainland & West Coast */}
            <path
              d={`
                M ${project(24.5, 68.5, width, height).join(' ')}
                L ${project(23.0, 70.0, width, height).join(' ')}
                L ${project(22.3, 69.0, width, height).join(' ')}
                L ${project(20.9, 70.4, width, height).join(' ')}
                L ${project(21.2, 72.8, width, height).join(' ')}
                L ${project(19.0, 72.8, width, height).join(' ')}
                L ${project(15.5, 73.8, width, height).join(' ')}
                L ${project(12.9, 74.8, width, height).join(' ')}
                L ${project(9.9, 76.3, width, height).join(' ')}
                L ${project(8.1, 77.5, width, height).join(' ')}
                L ${project(9.3, 79.1, width, height).join(' ')}
                L ${project(10.8, 79.8, width, height).join(' ')}
                L ${project(13.1, 80.3, width, height).join(' ')}
                L ${project(16.2, 81.1, width, height).join(' ')}
                L ${project(17.7, 83.3, width, height).join(' ')}
                L ${project(19.8, 85.8, width, height).join(' ')}
                L ${project(20.3, 86.6, width, height).join(' ')}
                L ${project(21.7, 87.5, width, height).join(' ')}
                L ${project(22.0, 89.0, width, height).join(' ')}
                L ${project(22.8, 91.2, width, height).join(' ')}
                L ${project(21.4, 92.0, width, height).join(' ')}
                L ${project(20.1, 92.9, width, height).join(' ')}
                L ${project(16.0, 94.3, width, height).join(' ')}
                L ${project(26.0, 96.0, width, height).join(' ')}
                L ${project(26.0, 62.0, width, height).join(' ')}
                Z
              `}
              fill="#10253f"
            />

            {/* Sri Lanka */}
            <path
              d={`
                M ${project(9.8, 80.2, width, height).join(' ')}
                Q ${project(8.0, 81.8, width, height).join(' ')} ${project(6.0, 80.6, width, height).join(' ')}
                Q ${project(7.0, 79.7, width, height).join(' ')} ${project(9.8, 80.2, width, height).join(' ')}
                Z
              `}
              fill="#122a47"
            />

            {/* Andaman & Nicobar Archipelago */}
            <ellipse cx={project(12.5, 92.8, width, height)[0]} cy={project(12.5, 92.8, width, height)[1]} rx="4" ry="16" fill="#1b3d63" />
            <ellipse cx={project(8.0, 93.5, width, height)[0]} cy={project(8.0, 93.5, width, height)[1]} rx="3" ry="10" fill="#1b3d63" />

            {/* Lakshadweep Islands */}
            <circle cx={project(10.5, 72.6, width, height)[0]} cy={project(10.5, 72.6, width, height)[1]} r="3" fill="#1b3d63" />
            <circle cx={project(8.3, 73.0, width, height)[0]} cy={project(8.3, 73.0, width, height)[1]} r="2.5" fill="#1b3d63" />
          </g>

          {/* Coastal Ports & High Risk Zones */}
          {showCoastalAlerts && (
            <g className="coastal-ports-layer">
              {COASTAL_CITIES.map((city) => {
                const [cx, cy] = project(city.lat, city.lon, width, height);
                return (
                  <g key={city.name} className="group">
                    <circle cx={cx} cy={cy} r="3" fill="#38bdf8" stroke="#081a30" strokeWidth="1" />
                    <text
                      x={cx + 5}
                      y={cy + 3}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="system-ui"
                      className="pointer-events-none select-none"
                    >
                      {city.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Uncertainty Cone Overlay for Selected Event */}
          {showCone && selectedEvent && renderUncertaintyCone(selectedEvent)}

          {/* Forecast Track Line & Waypoints for Selected Event */}
          {showTrack && selectedEvent && (
            <g className="forecast-track-layer">
              {/* Distance Ray to Nearest Coast */}
              {(() => {
                const [sx, sy] = project(selectedEvent.lat, selectedEvent.lon, width, height);
                // Locate coast city
                const coastCity = COASTAL_CITIES.find((c) => selectedEvent.nearest_coast.name.includes(c.name.split(' ')[0])) || COASTAL_CITIES[1];
                const [tx, ty] = project(coastCity.lat, coastCity.lon, width, height);
                return (
                  <g>
                    <line
                      x1={sx}
                      y1={sy}
                      x2={tx}
                      y2={ty}
                      stroke="#14b8a6"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="animate-dash-flow"
                    />
                    <circle cx={tx} cy={ty} r="5" fill="none" stroke="#14b8a6" strokeWidth="1.5" className="animate-pulse" />
                  </g>
                );
              })()}

              {/* Waypoint Segments */}
              {selectedEvent.forecast.map((f, i) => {
                const [currX, currY] =
                  i === 0
                    ? project(selectedEvent.lat, selectedEvent.lon, width, height)
                    : project(selectedEvent.forecast[i - 1].lat, selectedEvent.forecast[i - 1].lon, width, height);
                const [fx, fy] = project(f.lat, f.lon, width, height);
                const stageConfig = IMD_STAGES[f.stage_code];

                return (
                  <g key={`track-segment-${f.hours}`}>
                    {/* Trajectory vector */}
                    <line
                      x1={currX}
                      y1={currY}
                      x2={fx}
                      y2={fy}
                      stroke="url(#track-grad)"
                      strokeWidth="2.5"
                    />

                    {/* Waypoint circle pin */}
                    <g
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredPoint({ point: f, x: fx, y: fy })}
                      onMouseLeave={() => setHoveredPoint({ point: null, x: 0, y: 0 })}
                    >
                      <circle cx={fx} cy={fy} r="7" fill={stageConfig.color} stroke="#ffffff" strokeWidth="2" />
                      <circle cx={fx} cy={fy} r="12" fill="none" stroke={stageConfig.color} strokeWidth="1.2" opacity="0.6" />
                      <text
                        x={fx + 9}
                        y={fy + 3}
                        fill="#f8fafc"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                        className="drop-shadow"
                      >
                        +{f.hours}h ({f.wind_kt}kt)
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          )}

          {/* Active Cyclone Center Vortex Markers */}
          {events.map((e) => {
            const [x, y] = project(e.lat, e.lon, width, height);
            const isSelected = e.id === selectedId;
            const stageConfig = IMD_STAGES[e.stage];

            return (
              <g
                key={e.id}
                id={`map-cyclone-vortex-${e.id}`}
                onClick={() => onSelectEvent(e.id)}
                className="cursor-pointer"
              >
                {/* Radar pulse rings */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="28"
                    fill="none"
                    stroke={stageConfig.color}
                    strokeWidth="1.5"
                    className="animate-pulse-ring opacity-50"
                  />
                )}

                {/* Rotating Spiral Vortex Graphic */}
                <g transform={`translate(${x}, ${y})`} className="animate-spin-slow">
                  <circle r={isSelected ? 16 : 12} fill={`${stageConfig.color}40`} />
                  <path
                    d="M 0 -12 C 6 -12 12 -6 12 0 C 12 6 6 12 0 12 C -6 12 -12 6 -12 0 C -12 -6 -6 -12 0 -12 M 0 -8 C 4 -8 8 -4 8 0 C 8 4 4 8 0 8 C -4 8 -8 4 -8 0 C -8 -4 -4 -8 0 -8"
                    fill="none"
                    stroke={stageConfig.color}
                    strokeWidth={isSelected ? '2.5' : '1.8'}
                  />
                  <circle r={isSelected ? 4 : 3} fill="#ffffff" />
                </g>

                {/* Name & Intensity Label Box */}
                <g transform={`translate(${x + 16}, ${y - 12})`}>
                  <rect
                    x="-4"
                    y="-12"
                    width={e.name.length * 7 + 55}
                    height="20"
                    rx="4"
                    fill="#081a30"
                    stroke={isSelected ? stageConfig.color : '#1e3a5f'}
                    strokeWidth={isSelected ? '1.5' : '1'}
                    className="shadow-lg"
                  />
                  <text
                    x="2"
                    y="2"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="system-ui"
                  >
                    {e.name}{' '}
                    <tspan fill={stageConfig.color} fontSize="10" fontFamily="monospace">
                      {e.wind_kt}kt
                    </tspan>
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Hovered Waypoint Interactive Tooltip */}
        {hoveredPoint.point && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-950/95 border border-amber-400/80 p-2.5 rounded-lg shadow-2xl text-xs font-mono backdrop-blur-md"
            style={{
              left: `${Math.min(75, Math.max(5, (hoveredPoint.x / width) * 100))}%`,
              top: `${Math.max(5, (hoveredPoint.y / height) * 100 - 10)}%`,
            }}
          >
            <div className="font-bold text-amber-300 flex items-center justify-between gap-3 mb-1">
              <span>Forecast +{hoveredPoint.point.hours}h Outlook</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 border border-amber-500/50">
                {hoveredPoint.point.stage_name}
              </span>
            </div>
            <div className="text-slate-300 space-y-0.5">
              <div>Coord: <strong className="text-white">{hoveredPoint.point.lat}°N, {hoveredPoint.point.lon}°E</strong></div>
              <div>Wind: <strong className="text-teal-300">{hoveredPoint.point.wind_kt} kt</strong> ({hoveredPoint.point.wind_kmh} km/h)</div>
              <div>Central Pressure: <strong className="text-sky-300">{hoveredPoint.point.pressure_hpa} hPa</strong></div>
              <div>Cone Uncertainty: ±{hoveredPoint.point.uncertainty_radius_km} km</div>
              {hoveredPoint.point.landfall_risk && (
                <div className="text-rose-400 font-semibold mt-1">
                  ⚠️ {hoveredPoint.point.landfall_risk}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-[#081a30]/90 border border-slate-700/80 rounded-lg p-2.5 shadow-lg backdrop-blur-sm text-[10px] font-mono space-y-1.5 hidden md:block">
          <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">
            IMD Intensity Legend
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
              <span className="text-slate-300">Depression (&lt;34kt)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" />
              <span className="text-slate-300">Deep Dep (28-33kt)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
              <span className="text-slate-300">Cyclonic Storm (34-47kt)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]" />
              <span className="text-slate-300">Severe CS (48-63kt)</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />
              <span className="text-slate-300">Very Severe CS (≥64kt / Cat 1-5)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
