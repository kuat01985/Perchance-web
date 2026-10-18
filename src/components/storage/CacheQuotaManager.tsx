import React, { useState, useEffect } from 'react';
import { phoneStorage } from '../../services/storage/fileSystemBridge';
import {
  HardDrive,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Smartphone,
  Cpu,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface CacheQuotaManagerProps {
  onUpdated?: () => void;
}

export const CacheQuotaManager: React.FC<CacheQuotaManagerProps> = ({ onUpdated }) => {
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMB, setSelectedMB] = useState<number>(500);
  const [selectedPolicy, setSelectedPolicy] = useState<'warn' | 'auto_evict_oldest' | 'unlimited'>('auto_evict_oldest');
  const [customInput, setCustomInput] = useState<string>('500');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const presets = [
    { label: '100 MB', value: 100 },
    { label: '250 MB', value: 250 },
    { label: '500 MB', value: 500 },
    { label: '1 GB', value: 1024 },
    { label: '2.5 GB', value: 2560 },
    { label: '5 GB', value: 5120 },
  ];

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const info = await phoneStorage.getCacheInfo();
      setCacheInfo(info);
      setSelectedMB(info.maxQuotaMB);
      setCustomInput(String(info.maxQuotaMB));
      setSelectedPolicy(info.policy);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const unsub = phoneStorage.subscribe(() => {
      loadMetrics();
    });
    return () => unsub();
  }, []);

  const handleApplyQuota = (mb: number, policy = selectedPolicy) => {
    phoneStorage.setCacheQuota(mb, policy);
    setSelectedMB(mb);
    setCustomInput(String(mb));
    setStatusMessage(`Cache quota adjusted to ${mb} MB (${(mb / 1024).toFixed(2)} GB)!`);
    setTimeout(() => setStatusMessage(null), 3000);
    if (onUpdated) onUpdated();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInput, 10);
    if (isNaN(val) || val < 10) {
      alert('Please enter a valid quota of at least 10 MB');
      return;
    }
    handleApplyQuota(val);
  };

  const handleRequestPersistence = async () => {
    const granted = await phoneStorage.requestStoragePersistence();
    if (granted) {
      setStatusMessage('Phone storage permanence granted! Cache will not be cleared by phone OS.');
    } else {
      setStatusMessage('Persistence request acknowledged by phone browser.');
    }
    await loadMetrics();
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleClearTemporaryCache = async () => {
    if (!window.confirm('Clear temporary generator cache and cached files? Your main lore and save files will remain safe.')) {
      return;
    }
    const count = await phoneStorage.clearCache('cache/');
    setStatusMessage(`Removed ${count} temporary cached items.`);
    await loadMetrics();
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto p-4 space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Cache & Storage Quota Allocation</h3>
            <p className="text-xs text-slate-400">
              Control the maximum internal cache available to Perchance generators
            </p>
          </div>
        </div>

        <button
          onClick={loadMetrics}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          title="Refresh metrics"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {statusMessage && (
        <div className="p-2.5 rounded-xl bg-indigo-600 text-white text-xs font-medium flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-200" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Usage Meter Card */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            Current Cache Utilization
          </span>
          <span className="font-mono text-indigo-300 font-bold">
            {cacheInfo?.currentUsedMB || 0} MB / {selectedMB} MB ({cacheInfo?.percentUsed || 0}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              (cacheInfo?.percentUsed || 0) > 85
                ? 'bg-rose-500'
                : (cacheInfo?.percentUsed || 0) > 60
                ? 'bg-amber-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(3, cacheInfo?.percentUsed || 0))}%` }}
          />
        </div>

        {/* Device Phone OS System Storage Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <span>Phone Available Storage:</span>
            <span className="font-mono text-slate-200 font-medium">
              {cacheInfo?.systemQuotaBytes ? formatBytes(cacheInfo.systemQuotaBytes) : 'Estimating...'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 justify-end">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>Browser Overall Usage:</span>
            <span className="font-mono text-slate-200 font-medium">
              {cacheInfo?.systemUsageBytes ? formatBytes(cacheInfo.systemUsageBytes) : '0 MB'}
            </span>
          </div>
        </div>
      </div>

      {/* Preset Quota Switcher */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Change Cache Storage Quota:
        </label>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleApplyQuota(preset.value)}
              className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all text-center ${
                selectedMB === preset.value
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <input
              type="number"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              min="10"
              max="50000"
              placeholder="Custom MB"
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
              MB
            </span>
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition"
          >
            Set Custom Quota
          </button>
        </form>
      </div>

      {/* Eviction & Quota Policy */}
      <div className="space-y-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
        <label className="text-xs font-semibold text-slate-200 block">
          Cache Limit Behavior (When Quota is Exceeded):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <button
            onClick={() => handleApplyQuota(selectedMB, 'auto_evict_oldest')}
            className={`p-2.5 rounded-xl border text-left transition ${
              selectedPolicy === 'auto_evict_oldest'
                ? 'bg-indigo-950/60 border-indigo-600 text-indigo-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-semibold text-white text-[11px] mb-0.5">Auto-Evict Old Cache</div>
            <div className="text-[10px] text-slate-400 leading-tight">
              Removes oldest cached assets to make room for new generations.
            </div>
          </button>

          <button
            onClick={() => handleApplyQuota(selectedMB, 'warn')}
            className={`p-2.5 rounded-xl border text-left transition ${
              selectedPolicy === 'warn'
                ? 'bg-indigo-950/60 border-indigo-600 text-indigo-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-semibold text-white text-[11px] mb-0.5">Warning Alert</div>
            <div className="text-[10px] text-slate-400 leading-tight">
              Alerts when generator exceeds quota without deleting files.
            </div>
          </button>

          <button
            onClick={() => handleApplyQuota(selectedMB, 'unlimited')}
            className={`p-2.5 rounded-xl border text-left transition ${
              selectedPolicy === 'unlimited'
                ? 'bg-indigo-950/60 border-indigo-600 text-indigo-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-semibold text-white text-[11px] mb-0.5">Unlimited Mode</div>
            <div className="text-[10px] text-slate-400 leading-tight">
              Allows generator to use entire phone storage capacity.
            </div>
          </button>
        </div>
      </div>

      {/* Persistence & Cleaning Actions */}
      <div className="space-y-2">
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${cacheInfo?.isPersistentGranted ? 'text-emerald-400' : 'text-amber-400'}`} />
            <div>
              <div className="text-xs font-semibold text-white">
                Phone OS Eviction Protection
              </div>
              <div className="text-[11px] text-slate-400">
                {cacheInfo?.isPersistentGranted
                  ? 'Active: Android/Phone OS will not delete cache when storage is low.'
                  : 'Standard: Phone OS could clear cache if internal storage runs low.'}
              </div>
            </div>
          </div>

          {!cacheInfo?.isPersistentGranted && (
            <button
              onClick={handleRequestPersistence}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-amber-300 border border-amber-500/40 shrink-0"
            >
              Lock Cache
            </button>
          )}
        </div>

        {/* Clear Temp Cache */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-200">
              Clear Generator Temporary Files
            </div>
            <div className="text-[11px] text-slate-400">
              Purges temporary assets in <code className="text-indigo-300 font-mono">cache/</code> without touching save files.
            </div>
          </div>

          <button
            onClick={handleClearTemporaryCache}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Cache</span>
          </button>
        </div>
      </div>

      {/* Code snippet for Generator Creators */}
      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
        <div className="font-semibold text-indigo-300">
          How to change cache amount inside your Perchance Generator code:
        </div>
        <pre className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
{`// Expand generator cache storage to 2000 MB (2 GB):
await PerchanceStorage.setCacheQuota(2000, "auto_evict_oldest");

// Check current cache quota:
const cache = await PerchanceStorage.getCacheInfo();
console.log("Allowed MB:", cache.maxQuotaMB, "Used MB:", cache.currentUsedMB);`}
        </pre>
      </div>
    </div>
  );
};
