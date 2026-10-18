import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  HardDrive,
  Layers,
  Menu,
  Bookmark,
  Sliders,
} from 'lucide-react';
import { phoneStorage } from '../../services/storage/fileSystemBridge';

interface MobileBottomBarProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  tabCount: number;
  onOpenTabs: () => void;
  onOpenStorage: (tab?: 'files' | 'cache' | 'code' | 'logs') => void;
  onOpenMenu: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  tabCount,
  onOpenTabs,
  onOpenStorage,
  onOpenMenu,
}) => {
  const [fileCount, setFileCount] = useState(0);
  const [isMounted, setIsMounted] = useState(phoneStorage.getStorageStatus().isMounted);

  useEffect(() => {
    const update = async () => {
      const files = await phoneStorage.listFiles();
      setFileCount(files.length);
      setIsMounted(phoneStorage.getStorageStatus().isMounted);
    };
    update();
    const unsub = phoneStorage.subscribe(() => {
      update();
    });
    return () => unsub();
  }, []);

  return (
    <nav className="w-full bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] flex items-center justify-around shrink-0 z-30 select-none">
      {/* Back */}
      <button
        onClick={onGoBack}
        disabled={!canGoBack}
        className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-25 active:scale-90 transition min-w-[48px]"
        title="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Forward */}
      <button
        onClick={onGoForward}
        disabled={!canGoForward}
        className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-25 active:scale-90 transition min-w-[48px]"
        title="Forward"
      >
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Phone Storage Vault (Center Primary Action) */}
      <button
        onClick={() => onOpenStorage('files')}
        className="relative flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold shadow-lg shadow-indigo-600/30 transition min-w-[56px]"
        title="Phone Storage Vault"
      >
        <HardDrive className="w-4 h-4" />
        <span className="text-xs">Vault</span>
        <span className="ml-0.5 px-1.5 py-0.2 bg-indigo-950/80 text-indigo-200 rounded-full text-[10px] font-mono">
          {fileCount}
        </span>
        {isMounted && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
        )}
      </button>

      {/* Tabs Switcher */}
      <button
        onClick={onOpenTabs}
        className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white active:scale-90 transition min-w-[48px]"
        title="Open Tabs"
      >
        <div className="relative w-6 h-6 border-2 border-slate-400 rounded-lg flex items-center justify-center">
          <span className="text-[11px] font-bold font-mono text-slate-200">
            {tabCount}
          </span>
        </div>
      </button>

      {/* More Options / Browser Menu */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white active:scale-90 transition min-w-[48px]"
        title="Browser Menu"
      >
        <Menu className="w-5 h-5" />
      </button>
    </nav>
  );
};
