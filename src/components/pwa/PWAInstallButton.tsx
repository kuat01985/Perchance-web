import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Smartphone, Download, X, Share2, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition active:scale-95"
        title="Install to your phone's home screen"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-700/60 bg-indigo-950/40 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-900/60 transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                  Install on iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                To run Perchance with full mobile phone storage access:
              </p>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <Share2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">Step 1:</span> Tap the <strong>Share</strong> button in Safari's bottom toolbar.
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <PlusSquare className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">Step 2:</span> Scroll down and tap <strong>Add to Home Screen</strong>.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Default fallback button to explain install or prompt
  return (
    <button
      onClick={() => alert("To install this browser on Android, tap browser menu (⋮) -> 'Add to Home screen' or 'Install App'.")}
      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
      title="Install to Phone"
    >
      <Download className="w-3.5 h-3.5 text-indigo-400" />
      <span>Install PWA</span>
    </button>
  );
};
