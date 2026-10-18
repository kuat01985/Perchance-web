import React, { useState, useEffect } from 'react';
import { Lock, RotateCw, Sliders, Smartphone, Search, Globe } from 'lucide-react';
import { phoneStorage } from '../../services/storage/fileSystemBridge';

interface MobileTopBarProps {
  currentUrl: string;
  onOpenUrlInput: () => void;
  onRefresh: () => void;
  onOpenCache: () => void;
  isLoading?: boolean;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  currentUrl,
  onOpenUrlInput,
  onRefresh,
  onOpenCache,
  isLoading = false,
}) => {
  const [cacheQuotaMB, setCacheQuotaMB] = useState(phoneStorage.getStorageStatus().cacheQuotaMB);

  useEffect(() => {
    const unsub = phoneStorage.subscribe(() => {
      setCacheQuotaMB(phoneStorage.getStorageStatus().cacheQuotaMB);
    });
    return () => unsub();
  }, []);

  // Display friendly title or domain
  const getDisplayUrl = () => {
    if (currentUrl === 'local://playground') {
      return 'perchance-vault // storage-lab';
    }
    try {
      const parsed = new URL(currentUrl);
      const path = parsed.pathname.replace(/^\/+/, '');
      return path ? `${parsed.hostname}/${path}` : parsed.hostname;
    } catch {
      return currentUrl.replace(/^https?:\/\//, '');
    }
  };

  return (
    <header className="w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-3 pt-[calc(env(safe-area-inset-top,0px)+8px)] pb-2.5 flex items-center justify-between gap-2 shrink-0 z-30 select-none">
      {/* Mobile URL Omnibox Button */}
      <button
        onClick={onOpenUrlInput}
        className="flex-1 flex items-center justify-between px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:bg-slate-800 transition text-left min-w-0 shadow-inner group"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {currentUrl.startsWith('https://') ? (
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          )}

          <span className="font-mono text-xs text-slate-200 truncate font-medium group-active:text-white">
            {getDisplayUrl()}
          </span>
        </div>

        <Search className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
      </button>

      {/* Quick Cache Storage Quota Chip (Thumb Tap) */}
      <button
        onClick={onOpenCache}
        className="flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/60 active:scale-95 transition shrink-0"
        title="Adjust Cache Storage Quota"
      >
        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
        <span className="font-mono text-[11px] font-bold text-indigo-200">
          {cacheQuotaMB}M
        </span>
      </button>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        className="p-2 rounded-2xl text-slate-400 hover:text-white active:bg-slate-800 transition shrink-0"
        title="Reload Page"
      >
        <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
      </button>
    </header>
  );
};
