import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Printer,
  Copy,
  Check,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Radio,
  Building,
  Anchor,
  Send,
} from 'lucide-react';
import { CycloneEvent, AIBulletinResponse } from '../types';

interface AIBulletinModalProps {
  event: CycloneEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AIBulletinModal: React.FC<AIBulletinModalProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  const [advisory, setAdvisory] = useState<AIBulletinResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvisory = async () => {
    if (!event) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, custom_event: event }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setAdvisory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate advisory bulletin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && event) {
      fetchAdvisory();
    }
  }, [isOpen, event?.id]);

  if (!isOpen || !event) return null;

  const handleCopy = () => {
    if (!advisory) return;
    const text = `
INDIA METEOROLOGICAL DEPARTMENT
SPECIAL TROPICAL CYCLONE ADVISORY BULLETIN
BULLETIN NO: ${advisory.bulletin_no}
DATE & TIME: ${advisory.time_utc}

SYSTEM: CYCLONE ${advisory.system_name} (${advisory.classification})
INTENSITY & SYNOPSIS:
${advisory.intensity_summary}

TRACK OUTLOOK:
${advisory.track_outlook}

LANDFALL WARNING:
${advisory.landfall_warning}

STORM SURGE WARNING:
${advisory.storm_surge_warning}

FISHERMEN WARNING:
${advisory.fishermen_warning}

DISASTER MANAGEMENT ACTION POINTS:
${advisory.action_suggested.map((a, i) => `${i + 1}. ${a}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#081729] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-sky-950 via-[#0b1f36] to-indigo-950 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400/40">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                IMD Official Meteorological Cyclone Bulletin
              </h2>
              <p className="text-xs font-mono text-sky-300">
                Generated via Gemini 3.7 Flash &amp; Multi-Source Satellite Telemetry
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-200">
          {isLoading ? (
            <div className="py-16 text-center space-y-3 font-mono">
              <div className="w-8 h-8 border-3 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-teal-300">
                Synthesizing multi-satellite telemetry &amp; generating official advisory...
              </p>
              <p className="text-xs text-slate-500">
                Calibrating Dvorak T-number, storm surge models, and coastal district risk matrices.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 font-mono space-y-2">
              <div className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Error generating bulletin
              </div>
              <p>{error}</p>
              <button
                onClick={fetchAdvisory}
                className="mt-2 px-3 py-1.5 rounded bg-rose-900 text-white font-sans text-xs hover:bg-rose-800"
              >
                Retry Generation
              </button>
            </div>
          ) : advisory ? (
            <>
              {/* Bulletin Official Letterhead */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 font-mono space-y-2 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-amber-400 font-bold">{advisory.bulletin_no}</span>
                  <span className="text-slate-400">{new Date(advisory.time_utc).toUTCString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>CYCLONE {advisory.system_name.toUpperCase()} ({advisory.classification.toUpperCase()})</span>
                </div>
              </div>

              {/* Intensity & Movement Section */}
              <div className="space-y-1.5">
                <h4 className="font-bold uppercase tracking-wider text-teal-400 text-[11px] font-mono">
                  1. Current Intensity &amp; Satellite Diagnostic
                </h4>
                <p className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                  {advisory.intensity_summary}
                </p>
              </div>

              {/* Track Outlook */}
              <div className="space-y-1.5">
                <h4 className="font-bold uppercase tracking-wider text-sky-400 text-[11px] font-mono">
                  2. 72-Hour Track &amp; Steering Outlook
                </h4>
                <p className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                  {advisory.track_outlook}
                </p>
              </div>

              {/* Coastal Warnings & Surge Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-rose-950/30 border border-rose-900/60 p-3.5 rounded-xl space-y-1.5">
                  <h4 className="font-bold uppercase tracking-wider text-rose-400 text-[11px] font-mono flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> 3. Landfall Alert
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    {advisory.landfall_warning}
                  </p>
                </div>

                <div className="bg-amber-950/30 border border-amber-900/60 p-3.5 rounded-xl space-y-1.5">
                  <h4 className="font-bold uppercase tracking-wider text-amber-400 text-[11px] font-mono flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" /> 4. Storm Surge &amp; Inundation
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    {advisory.storm_surge_warning}
                  </p>
                </div>
              </div>

              {/* Maritime & Fishermen Warning */}
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <h4 className="font-bold uppercase tracking-wider text-sky-300 text-[11px] font-mono flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5 text-sky-400" /> 5. Port Signal &amp; Fishermen Prohibitions
                </h4>
                <p className="leading-relaxed text-slate-300">{advisory.fishermen_warning}</p>
              </div>

              {/* Action Suggested for Disaster Management */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-emerald-400 text-[11px] font-mono flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> 6. Disaster Management Protocols (NDRF / SDRF)
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {advisory.action_suggested.map((action, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[11px]"
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-300">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#0b1f36] px-6 py-3.5 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={fetchAdvisory}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            Regenerate Advisory
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!advisory || isLoading}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Bulletin' : 'Copy Text'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
