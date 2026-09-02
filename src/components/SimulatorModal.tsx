import React, { useState } from 'react';
import {
  X,
  Play,
  Sparkles,
  Sliders,
  Dna,
  RefreshCw,
  Layers,
  BarChart2,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { CycloneEvent, IMDStageCode } from '../types';
import { IMD_STAGES, STAGE_NAMES, generateCycloneEvent } from '../ml/engine';
import { matrixToDataUri } from '../ml/colormaps';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectEvent: (event: CycloneEvent) => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  onInjectEvent,
}) => {
  const [seed, setSeed] = useState(Math.floor(Math.random() * 100000));
  const [stage, setStage] = useState<IMDStageCode>(3);
  const [sst, setSst] = useState(29.5); // Sea Surface Temp in °C
  const [windShear, setWindShear] = useState(12); // Vertical Wind Shear in kt
  const [eyeForced, setEyeForced] = useState(false);
  const [systemName, setSystemName] = useState('Vayu');

  const [simResult, setSimResult] = useState<CycloneEvent | null>(() =>
    generateCycloneEvent('sim-1', 'Vayu', {
      seed: 4281,
      stage: 3,
      eye_forced: false,
    })
  );
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRunSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      const generated = generateCycloneEvent(
        `sim-${Date.now()}`,
        systemName || 'Simulated-Vortex',
        {
          seed,
          stage,
          eye_forced: eyeForced,
        }
      );
      setSimResult(generated);
      setIsRunning(false);
    }, 150);
  };

  const handleRandomize = () => {
    const newSeed = Math.floor(Math.random() * 100000);
    const newStage = Math.floor(Math.random() * 6) as IMDStageCode;
    const names = ['Amphan', 'Nivar', 'Gaja', 'Hudhud', 'Fani', 'Jawad', 'Mandous', 'Biparjoy', 'Tej', 'Midhili', 'Michaung', 'Remal'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    setSeed(newSeed);
    setStage(newStage);
    setSystemName(randomName);
    setEyeForced(newStage >= 4);
  };

  const handleInject = () => {
    if (simResult) {
      onInjectEvent(simResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#081729] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-teal-950 via-[#0b1f36] to-slate-900 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-400/40">
              <Dna className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Multi-Source Satellite &amp; ML Simulation Lab
              </h2>
              <p className="text-xs font-mono text-teal-300">
                Synthetic Multi-Channel Generator &amp; Random Forest Classification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-200">
          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
            {/* System Name & Seed */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  SYSTEM IDENTIFIER
                </label>
                <input
                  type="text"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>PSEUDO-RNG SEED</span>
                  <button
                    onClick={handleRandomize}
                    className="text-teal-400 hover:text-teal-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Randomize
                  </button>
                </div>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            {/* Target IMD Stage */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  SYNTHETIC TARGET STAGE (0-5)
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(parseInt(e.target.value) as IMDStageCode)}
                  className="w-full bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-400"
                >
                  {STAGE_NAMES.map((name, i) => (
                    <option key={name} value={i}>
                      Stage {i}: {IMD_STAGES[i as IMDStageCode].shortName} ({IMD_STAGES[i as IMDStageCode].minWindKt}-{IMD_STAGES[i as IMDStageCode].maxWindKt}kt)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  SEA SURFACE TEMP (SST): <strong className="text-teal-300">{sst}°C</strong>
                </label>
                <input
                  type="range"
                  min="26.0"
                  max="31.5"
                  step="0.1"
                  value={sst}
                  onChange={(e) => setSst(parseFloat(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Eye & Run Action */}
            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  EYE WALL MORPHOLOGY
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eyeForced}
                    onChange={(e) => setEyeForced(e.target.checked)}
                    className="rounded accent-teal-400"
                  />
                  <span className="text-slate-300 font-mono text-[11px]">
                    Force Warm Eye Signature
                  </span>
                </label>
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={isRunning}
                className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2 transition-all font-mono"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isRunning ? 'Synthesizing...' : 'Run ML Classifier'}</span>
              </button>
            </div>
          </div>

          {/* Results Preview */}
          {simResult && (
            <div className="space-y-4">
              {/* Classification Outcome Summary */}
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    MODEL PREDICTION OUTCOME
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-bold text-white">
                      Cyclone {simResult.name}
                    </span>
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${IMD_STAGES[simResult.stage].color}25`,
                        color: IMD_STAGES[simResult.stage].color,
                        border: `1px solid ${IMD_STAGES[simResult.stage].color}`,
                      }}
                    >
                      {simResult.stage_name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">WIND / SPEED</span>
                    <strong className="text-teal-300">{simResult.wind_kt} kt</strong> ({simResult.wind_kmh} km/h)
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">EST. PRESSURE</span>
                    <strong className="text-sky-300">{simResult.pressure_hpa} hPa</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">DVORAK T-NO</span>
                    <strong className="text-amber-300">T{simResult.dvorak_t_number}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CONFIDENCE</span>
                    <strong className="text-emerald-400">{(simResult.confidence * 100).toFixed(0)}%</strong>
                  </div>
                </div>
              </div>

              {/* 3-Channel Synthetic Patch Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 text-center space-y-2">
                  <span className="text-[11px] font-mono font-bold text-slate-300 block">
                    1. IR Brightness (INSAT-3D)
                  </span>
                  <div className="w-32 h-32 mx-auto rounded-lg border border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden">
                    {simResult.channels?.ir ? (
                      <img
                        src={simResult.channels.ir}
                        alt="IR"
                        className="w-full h-full object-cover select-none"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">IR</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Mean: {simResult.features?.ir_mean} K
                  </span>
                </div>

                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 text-center space-y-2">
                  <span className="text-[11px] font-mono font-bold text-slate-300 block">
                    2. 89GHz Microwave (GPM)
                  </span>
                  <div className="w-32 h-32 mx-auto rounded-lg border border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden">
                    {simResult.channels?.microwave ? (
                      <img
                        src={simResult.channels.microwave}
                        alt="Microwave"
                        className="w-full h-full object-cover select-none"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">MW</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Mean: {simResult.features?.mw_mean}
                  </span>
                </div>

                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 text-center space-y-2">
                  <span className="text-[11px] font-mono font-bold text-slate-300 block">
                    3. Scatterometer Winds
                  </span>
                  <div className="w-32 h-32 mx-auto rounded-lg border border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden">
                    {simResult.channels?.wind ? (
                      <img
                        src={simResult.channels.wind}
                        alt="Wind"
                        className="w-full h-full object-cover select-none"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">WIND</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Max: {simResult.features?.wind_max} kt
                  </span>
                </div>
              </div>

              {/* Extracted Classical Feature Vector Table */}
              {simResult.features && (
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold font-mono text-slate-300 block">
                    Multi-Source Extracted Feature Vector
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
                    {Object.entries(simResult.features).map(([k, v]) => (
                      <div key={k} className="bg-slate-950 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 block truncate">{k}</span>
                        <strong className="text-slate-200 text-xs">{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#0b1f36] px-6 py-3.5 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInject}
            disabled={!simResult}
            className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md font-mono"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inject Into Live Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
