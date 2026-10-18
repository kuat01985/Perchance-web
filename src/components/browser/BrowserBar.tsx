import React, { useState, useEffect } from 'react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { phoneStorage } from '../../services/storage/fileSystemBridge';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Bookmark,
  HardDrive,
  Sliders,
  Smartphone,
  Monitor,
  Search,
  ExternalLink,
} from 'lucide-react';

interface BrowserBarProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onRefresh: () => void;
  onOpenStorage: (tab?: 'files' | 'cache' | 'code' | 'logs') => void;
  onOpenBookmarks: () => void;
  isMobileViewport: boolean;
  onToggleViewport: () => void;
}

export const BrowserBar: React.FC<BrowserBarProps> = ({
  currentUrl,
  onNavigate,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onRefresh,
  onOpenStorage,
  onOpenBookmarks,
  isMobileViewport,
  onToggleViewport,
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl);
  const [storageStatus, setStorageStatus] = useState(phoneStorage.getStorageStatus());
  const [fileCount, setFileCount] = useState(0);

  useEffect(() => {
    setInputUrl(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    const updateStats = async () => {
      setStorageStatus(phoneStorage.getStorageStatus());
      const files = await phoneStorage.listFiles();
      setFileCount(files.length);
    };
    updateStats();
    const unsub = phoneStorage.subscribe(() => {
      updateStats();
    });
    return () => unsub();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let url = inputUrl.trim();
    if (!url) return;

    if (url === 'local://playground' || url === 'playground') {
      onNavigate('local://playground');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('perchance.org')) {
        url = `https://${url}`;
      } else if (url.includes('.')) {
        url = `https://${url}`;
      } else {
        // e.g. user typed "ai-character-chat"
        url = `https://perchance.org/${url}`;
      }
    }

    onNavigate(url);
  };

  return (
    <header className="flex flex-col bg-slate-950 border-b border-slate-800 shrink-0 text-slate-100 z-30 select-none">
      {/* Main Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-2">
        {/* Navigation Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onGoForward}
            disabled={!canGoForward}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Go Forward"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Reload Generator"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {!currentUrl.startsWith('local://') && (
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition"
              title="Open directly in native browser tab (Chrome/Safari)"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Address Input */}
        <form onSubmit={handleSubmit} className="flex-1 flex items-center min-w-0">
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-2.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>URL</span>
            </span>

            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="perchance.org/generator-name or generator keyword"
              className="w-full pl-12 pr-8 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />

            <button
              type="submit"
              className="absolute right-2 text-slate-400 hover:text-white p-0.5"
              title="Navigate"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Bookmarks */}
          <button
            onClick={onOpenBookmarks}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
            title="Perchance Generators Hub"
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
          </button>

          {/* Quick Cache Storage Quota Chip */}
          <button
            onClick={() => onOpenStorage('cache')}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-slate-300 transition"
            title="Adjust cache storage quota for generators"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-indigo-300 font-medium">
              {storageStatus.cacheQuotaMB} MB Cache
            </span>
          </button>

          {/* Storage Vault Drawer Button */}
          <button
            onClick={() => onOpenStorage('files')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition active:scale-95"
            title="Open Phone Storage Vault"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Phone Vault</span>
            <span className="px-1.5 py-0.2 bg-indigo-950/70 text-indigo-200 rounded-full text-[10px] font-mono">
              {fileCount}
            </span>
          </button>

          {/* Viewport switch (Phone portrait mode vs Desktop mode) */}
          <button
            onClick={onToggleViewport}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isMobileViewport ? 'Switch to Fullscreen / Desktop View' : 'Switch to Phone Viewport'}
          >
            {isMobileViewport ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
