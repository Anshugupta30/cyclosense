import React, { useState } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  FolderArchive,
  Terminal,
  Play,
  Monitor,
  Apple,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { downloadProjectAsZip } from '../utils/zipExporter';

interface DownloadPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadPackageModal: React.FC<DownloadPackageModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloadSuccess(false);
      await downloadProjectAsZip((msg) => setStatusMsg(msg));
      setDownloadSuccess(true);
      setStatusMsg('Download initiated! Check your browser downloads.');
    } catch (err: any) {
      setStatusMsg('Error creating ZIP: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#081729] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#0b1f36] to-slate-900 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40">
              <FolderArchive className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                1-Click Ready-to-Run Offline Package
              </h2>
              <p className="text-xs font-mono text-emerald-300">
                Download complete source code with automated Windows &amp; Mac launchers
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
        <div className="p-6 space-y-5 text-xs text-slate-200">
          {/* Main Download Action Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-xl border border-slate-800 text-center space-y-4">
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base font-bold text-white">
                Download All Files in 1 ZIP Archive
              </h3>
              <p className="text-xs text-slate-400">
                Includes all source code, machine learning models, UI components, and double-click launcher scripts.
              </p>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full max-w-md mx-auto py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2.5 transition-all font-mono text-sm"
            >
              <Download className={`w-5 h-5 ${downloading ? 'animate-bounce' : ''}`} />
              <span>
                {downloading
                  ? 'Packaging Source Files...'
                  : downloadSuccess
                  ? 'Download Again (ZIP)'
                  : 'Download Ready-to-Run ZIP'}
              </span>
            </button>

            {statusMsg && (
              <div
                className={`text-xs font-mono py-1 px-3 rounded-lg inline-block ${
                  downloadSuccess
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                    : 'bg-slate-900 text-slate-300'
                }`}
              >
                {statusMsg}
              </div>
            )}
          </div>

          {/* How to run once downloaded */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              How to Run on Your Computer (In 2 Clicks):
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Windows Instructions */}
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Monitor className="w-4 h-4 text-sky-400" />
                  <span>On Windows:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 font-mono leading-relaxed">
                  <li>Extract the downloaded ZIP folder.</li>
                  <li>Double-click <strong className="text-emerald-400">START-APP-WINDOWS.bat</strong>.</li>
                  <li>It will auto-install dependencies and open <strong className="text-teal-300">http://localhost:3000</strong>.</li>
                </ol>
              </div>

              {/* Mac/Linux Instructions */}
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Apple className="w-4 h-4 text-slate-300" />
                  <span>On Mac / Linux:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 font-mono leading-relaxed">
                  <li>Extract the downloaded ZIP folder.</li>
                  <li>Open Terminal in that folder.</li>
                  <li>Run <strong className="text-emerald-400">./start-app-mac-linux.sh</strong>.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Prerequisite Check */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
            <div className="text-[11px] text-slate-400 font-mono">
              <strong className="text-slate-200">Only Prerequisite:</strong> Ensure{' '}
              <a
                href="https://nodejs.org/"
                target="_blank"
                rel="noreferrer"
                className="text-teal-400 underline hover:text-teal-300"
              >
                Node.js LTS
              </a>{' '}
              is installed on your computer. Everything else is 100% self-contained and offline.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#0b1f36] px-6 py-3.5 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            CycloSense AI · Complete Standalone Offline Bundle
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs font-mono transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
