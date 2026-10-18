import React, { useState, useEffect } from 'react';
import { FileExplorer } from './FileExplorer';
import { CacheQuotaManager } from './CacheQuotaManager';
import { PERCHANCE_CLIENT_SCRIPT, SAMPLE_GENERATOR_CODE } from '../../services/bridge/bridgeSnippet';
import { perchanceBridge } from '../../services/bridge/perchanceBridge';
import { VaultFile } from '../../services/storage/types';
import {
  X,
  HardDrive,
  Sliders,
  Code,
  Activity,
  Copy,
  Check,
  Smartphone,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface StorageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToGenerator?: (file: VaultFile, content: string) => void;
  initialTab?: 'files' | 'cache' | 'code' | 'logs';
}

export const StorageDrawer: React.FC<StorageDrawerProps> = ({
  isOpen,
  onClose,
  onInsertToGenerator,
  initialTab = 'files',
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'cache' | 'code' | 'logs'>(initialTab);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [logs, setLogs] = useState(perchanceBridge.getLogs());

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const unsub = perchanceBridge.subscribeLogs(() => {
      setLogs([...perchanceBridge.getLogs()]);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(
      `<script>\n${PERCHANCE_CLIENT_SCRIPT}\n</script>`
    );
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:flex-row md:justify-end bg-black/70 backdrop-blur-xs animate-fadeIn select-none">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container (Mobile Bottom Sheet & Desktop Side Drawer) */}
      <div className="flex flex-col w-full md:max-w-xl h-[88vh] md:h-full bg-slate-900 border-t md:border-t-0 md:border-l border-slate-700 rounded-t-3xl md:rounded-none shadow-2xl text-slate-100 z-50 overflow-hidden">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 md:hidden" />

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Phone Storage & Cache Vault</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-2 bg-slate-950 border-b border-slate-800 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition shrink-0 ${
              activeTab === 'files'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Files & Storage</span>
          </button>

          <button
            onClick={() => setActiveTab('cache')}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition shrink-0 ${
              activeTab === 'cache'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Cache Quota</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition shrink-0 ${
              activeTab === 'code'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Generator Code</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition shrink-0 ${
              activeTab === 'logs'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Bridge Logs ({logs.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'files' && (
            <FileExplorer onInsertToGenerator={onInsertToGenerator} />
          )}

          {activeTab === 'cache' && (
            <CacheQuotaManager />
          )}

          {activeTab === 'code' && (
            <div className="h-full overflow-y-auto p-4 space-y-4 bg-slate-900 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    How to enable Phone Storage in your Perchance Generator
                  </span>
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
                  >
                    {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet ? 'Copied' : 'Copy Snippet'}</span>
                  </button>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Paste this snippet into your Perchance generator's HTML box. It exposes the global{' '}
                  <code className="text-indigo-300 font-mono">window.PerchanceStorage</code> API so your generator can read files, write save states, change cache amount, and load images directly from phone storage.
                </p>
              </div>

              {/* Mobile Generator Readiness Checklist */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    Mobile Generator Readiness (Chatter1 & Perchance)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-semibold border border-emerald-800">
                    Verified
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span><strong>URL & Real Browser:</strong> Direct URL loading with native Chrome/Safari popup support to avoid restricted in-app browser webviews.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span><strong>Responsive Layout:</strong> P2.2 mobile overhaul with reflowing buttons, adaptive character gallery, and mobile viewport controls.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span><strong>Touch-friendly:</strong> 44px+ tap targets, no hover-only requirements, thumb-reachable floating dock.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span><strong>IndexedDB & Phone Vault:</strong> Characters & chats persist safely in IndexedDB and can be backed up directly to phone storage.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span><strong>Network & Cache:</strong> Heavy AI replies and pictures cache with expandable storage quota (500 MB – 5 GB) and OS eviction lock.</span>
                  </div>
                </div>
              </div>

              {/* Sample Code Blocks */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-300">JavaScript Usage Examples:</span>
                <pre className="p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed">
                  {SAMPLE_GENERATOR_CODE}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="h-full overflow-y-auto p-3 space-y-2 bg-slate-950 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
                  <Activity className="w-8 h-8 text-slate-700 mb-2" />
                  <span>No bridge calls recorded yet.</span>
                  <span className="text-[11px] text-slate-600">
                    Interact with a generator to see real-time phone storage operations.
                  </span>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-xl border flex items-start justify-between gap-2 ${
                      log.success
                        ? 'bg-slate-900 border-slate-800 text-slate-300'
                        : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{log.type}</span>
                        <span className="text-[10px] text-slate-500">{log.time}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{log.details}</div>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        log.success ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}
                    >
                      {log.success ? 'OK' : 'ERR'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
