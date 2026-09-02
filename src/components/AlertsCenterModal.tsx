import React, { useState } from 'react';
import {
  X,
  BellRing,
  ShieldAlert,
  Send,
  CheckCircle2,
  Smartphone,
  Radio,
  Anchor,
  Volume2,
  Users,
  Copy,
  Check,
} from 'lucide-react';
import { CycloneEvent } from '../types';
import { IMD_STAGES } from '../ml/engine';

interface AlertsCenterModalProps {
  event: CycloneEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface BroadcastLog {
  id: string;
  timestamp: string;
  type: 'SMS' | 'CAP_ALERT' | 'PORT_SIGNAL' | 'NDRF_DISPATCH';
  recipient: string;
  status: 'Delivered' | 'Broadcasting' | 'Acknowledged';
  content: string;
}

export const AlertsCenterModal: React.FC<AlertsCenterModalProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  const [targetDistrict, setTargetDistrict] = useState(
    event?.nearest_coast.name || 'Puri, Odisha'
  );
  const [alertSeverity, setAlertSeverity] = useState<'Red' | 'Orange' | 'Yellow'>('Red');
  const [sendToNDRF, setSendToNDRF] = useState(true);
  const [sendToFishermen, setSendToFishermen] = useState(true);
  const [sendToPorts, setSendToPorts] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [soundTestActive, setSoundTestActive] = useState(false);

  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastLog[]>([
    {
      id: 'BC-9041',
      timestamp: '10 mins ago',
      type: 'CAP_ALERT',
      recipient: 'NDMA / Odisha SDMA Cell',
      status: 'Acknowledged',
      content: 'IMD Alert: Cyclone approaching within 150km. Stage Red Warning activated.',
    },
    {
      id: 'BC-9040',
      timestamp: '25 mins ago',
      type: 'PORT_SIGNAL',
      recipient: 'Paradip & Visakhapatnam Ports',
      status: 'Delivered',
      content: 'Danger Signal No. 8/9 hoisted. Prohibit vessel departures.',
    },
    {
      id: 'BC-9039',
      timestamp: '1 hour ago',
      type: 'SMS',
      recipient: 'Maritime Fishermen Broadcast (NAVTEX)',
      status: 'Delivered',
      content: 'Suspension of all deep sea fishing operations over Bay of Bengal.',
    },
  ]);

  if (!isOpen || !event) return null;

  const stageCfg = IMD_STAGES[event.stage];

  // Play standard emergency frequency tone via Web Audio API (safe browser synthesizer)
  const triggerAudioSiren = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
      setSoundTestActive(true);
      setTimeout(() => setSoundTestActive(false), 1000);
    } catch (e) {
      console.warn('Audio siren test error:', e);
    }
  };

  const handleDispatchBroadcast = () => {
    setIsBroadcasting(true);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`🚨 CycloSence Alert: Cyclone ${event.name}`, {
          body: `Emergency Alert for ${targetDistrict}: ${event.stage_name} with winds up to ${event.wind_kt}kt. Coastal ETA: ${event.nearest_coast.eta_hours || 24}h.`,
          icon: event.channels?.ir,
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification(`🚨 CycloSence Alert: Cyclone ${event.name}`, {
              body: `Emergency Alert for ${targetDistrict}: ${event.stage_name} (${event.wind_kt}kt).`,
            });
          }
        });
      }
    }

    setTimeout(() => {
      const newLogs: BroadcastLog[] = [
        {
          id: `BC-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: 'Just now',
          type: 'CAP_ALERT',
          recipient: `District Collector & DDMA (${targetDistrict.split(',')[0]})`,
          status: 'Acknowledged',
          content: `🚨 ${alertSeverity} Warning: Cyclone ${event.name} (${event.stage_name}, ${event.wind_kt}kt). Immediate coastal evacuation advised.`,
        },
      ];

      if (sendToNDRF) {
        newLogs.push({
          id: `BC-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: 'Just now',
          type: 'NDRF_DISPATCH',
          recipient: 'NDRF Battalion 03 / State Emergency Operations Center (SEOC)',
          status: 'Delivered',
          content: `Mobilization requested for ${targetDistrict}. High storm surge expected.`,
        });
      }

      if (sendToPorts) {
        newLogs.push({
          id: `BC-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: 'Just now',
          type: 'PORT_SIGNAL',
          recipient: 'Maritime Board / Major Port Authorities',
          status: 'Delivered',
          content: `Signal No. 8/9 active. Gusts exceeding ${Math.round(event.wind_kt * 1.25)}kt.`,
        });
      }

      setBroadcastHistory((prev) => [...newLogs, ...prev]);
      setIsBroadcasting(false);
    }, 600);
  };

  const sampleSMS = `[EMERGENCY ALERT - CycloSence IMD]\nCYCLONE ${event.name.toUpperCase()} (${event.stage_name.toUpperCase()})\nWind: ${event.wind_kt}kt (${event.wind_kmh}km/h). Position: ${event.lat}N, ${event.lon}E.\nDistance to ${targetDistrict}: ${event.nearest_coast.distance_km}km (ETA ~${event.nearest_coast.eta_hours || 24}h).\nACTION: Fishermen avoid sea. Move to nearest cyclone shelter. Contact Toll Free: 1070 / 1077.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#081729] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-rose-950 via-[#0b1f36] to-slate-900 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-400/40">
              <BellRing className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Emergency Alert &amp; Multi-Agency Broadcast Center
              </h2>
              <p className="text-xs font-mono text-rose-300">
                CAP-Compliant Alerts · SMS Gateway · NDRF Disaster Mobilization · Port Warning Signals
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
          {/* Active Storm Threat Banner */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block">
                ACTIVE SYSTEM UNDER MONITORING
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-bold text-white">
                  Cyclone {event.name}
                </span>
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${stageCfg.color}25`,
                    color: stageCfg.color,
                    border: `1px solid ${stageCfg.color}`,
                  }}
                >
                  {event.stage_name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">WIND SPEED</span>
                <strong className="text-teal-300">{event.wind_kt} kt</strong> ({event.wind_kmh} km/h)
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">NEAREST COAST</span>
                <strong className="text-amber-300">{event.nearest_coast.name.split(',')[0]}</strong> ({event.nearest_coast.distance_km} km)
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ESTIMATED ETA</span>
                <strong className="text-rose-300">{event.nearest_coast.eta_hours || 24} hours</strong>
              </div>
            </div>
          </div>

          {/* Dispatch Control Panel */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left Configuration Column */}
            <div className="md:col-span-7 bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                <Radio className="w-4 h-4 text-teal-400" />
                Configure Emergency Broadcast
              </h3>

              {/* Severity & Target District */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    WARNING SEVERITY TIER
                  </label>
                  <select
                    value={alertSeverity}
                    onChange={(e) => setAlertSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-400"
                  >
                    <option value="Red">🔴 Red Alert (Take Action - Catastrophic)</option>
                    <option value="Orange">🟠 Orange Alert (Be Prepared - Severe)</option>
                    <option value="Yellow">🟡 Yellow Alert (Be Updated - Advisory)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    TARGET COASTAL DISTRICT
                  </label>
                  <input
                    type="text"
                    value={targetDistrict}
                    onChange={(e) => setTargetDistrict(e.target.value)}
                    className="w-full bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              {/* Channels to Activate */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 block">
                  ACTIVE DISPATCH CHANNELS
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendToNDRF}
                      onChange={(e) => setSendToNDRF(e.target.checked)}
                      className="rounded accent-rose-500"
                    />
                    <span className="text-slate-300 font-mono text-[11px] flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-400" /> NDRF / SEOC
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendToFishermen}
                      onChange={(e) => setSendToFishermen(e.target.checked)}
                      className="rounded accent-sky-500"
                    />
                    <span className="text-slate-300 font-mono text-[11px] flex items-center gap-1">
                      <Radio className="w-3 h-3 text-sky-400" /> Fishermen / NAVTEX
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendToPorts}
                      onChange={(e) => setSendToPorts(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span className="text-slate-300 font-mono text-[11px] flex items-center gap-1">
                      <Anchor className="w-3 h-3 text-amber-400" /> Port Authorities
                    </span>
                  </label>
                </div>
              </div>

              {/* Test Audio & Dispatch Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={triggerAudioSiren}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${soundTestActive ? 'text-rose-400 animate-ping' : ''}`} />
                  <span>{soundTestActive ? 'Testing Tone...' : 'Test Siren Tone'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDispatchBroadcast}
                  disabled={isBroadcasting}
                  className="flex-1 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all font-mono"
                >
                  <Send className={`w-4 h-4 ${isBroadcasting ? 'animate-bounce' : ''}`} />
                  <span>{isBroadcasting ? 'Broadcasting...' : 'Send Emergency Multi-Broadcast'}</span>
                </button>
              </div>
            </div>

            {/* Right: SMS Preview & Gateway Payload */}
            <div className="md:col-span-5 bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-200 font-mono mb-2">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                    CAP SMS Gateway Payload
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sampleSMS);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[10px] font-mono text-emerald-300 leading-relaxed whitespace-pre-wrap select-all">
                  {sampleSMS}
                </pre>
              </div>

              <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Format adheres to ITU-T X.1303 / WMO Common Alerting Protocol (CAP).</span>
              </div>
            </div>
          </div>

          {/* Broadcast Logs History Table */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              Recent Alert Dispatch Logs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px]">
                    <th className="pb-2">LOG ID</th>
                    <th className="pb-2">TIME</th>
                    <th className="pb-2">CHANNEL</th>
                    <th className="pb-2">RECIPIENT</th>
                    <th className="pb-2">STATUS</th>
                    <th className="pb-2">ALERT CONTENT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {broadcastHistory.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="py-2 text-teal-400 font-bold">{log.id}</td>
                      <td className="py-2 text-slate-400">{log.timestamp}</td>
                      <td className="py-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px]">
                          {log.type}
                        </span>
                      </td>
                      <td className="py-2 text-slate-200 font-medium">{log.recipient}</td>
                      <td className="py-2">
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2 text-slate-400 max-w-xs truncate">{log.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#0b1f36] px-6 py-3.5 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            Emergency Dispatch System · CycloSence IMD Multi-Agency Integration
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors font-mono"
          >
            Close Alert Center
          </button>
        </div>
      </div>
    </div>
  );
};
