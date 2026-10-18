import React, { useRef, useState, useEffect } from 'react';
import { GeneratorPlayground } from '../playground/GeneratorPlayground';
import { HardDrive, Sliders, ExternalLink, RefreshCw, Smartphone } from 'lucide-react';
import { phoneStorage } from '../../services/storage/fileSystemBridge';

interface PerchanceFrameProps {
  url: string;
  isMobileViewport: boolean;
  onOpenStorage: (tab?: 'files' | 'cache' | 'code' | 'logs') => void;
  onInsertNotice?: string | null;
}

export const PerchanceFrame: React.FC<PerchanceFrameProps> = ({
  url,
  isMobileViewport,
  onOpenStorage,
  onInsertNotice,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [cacheQuotaMB, setCacheQuotaMB] = useState(phoneStorage.getStorageStatus().cacheQuotaMB);

  useEffect(() => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  }, [url]);

  useEffect(() => {
    const unsub = phoneStorage.subscribe(() => {
      setCacheQuotaMB(phoneStorage.getStorageStatus().cacheQuotaMB);
    });
    return () => unsub();
  }, []);

  const isPlayground = url === 'local://playground';

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center bg-slate-950 overflow-hidden w-full h-full">
      {/* Toast Notice for injected files */}
      {onInsertNotice && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl animate-bounce">
          {onInsertNotice}
        </div>
      )}

      {isPlayground ? (
        <div className="w-full h-full flex flex-col">
          <GeneratorPlayground />
        </div>
      ) : (
        <div className="relative w-full h-full flex flex-col overflow-hidden bg-white">
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xs text-slate-300 gap-3">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs font-medium">Connecting generator to phone storage...</div>
              <div className="text-[11px] font-mono text-slate-500 truncate max-w-xs">{url}</div>
            </div>
          )}

          {/* The Live Generator Frame */}
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={url}
            title="Perchance Generator"
            onLoad={() => setIsLoading(false)}
            className="w-full flex-1 border-none bg-white"
            allow="clipboard-read; clipboard-write; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          />

          {/* Floating Action Button (FAB) Dock */}
          <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2">
            {/* Quick External Open */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 shadow-xl backdrop-blur-md transition active:scale-95"
              title="Open generator directly in native Chrome/Safari tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
              <span>Native Tab</span>
            </a>

            {/* Quick Cache Quota Button */}
            <button
              onClick={() => onOpenStorage('cache')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 shadow-xl backdrop-blur-md transition active:scale-95"
              title="Change amount of cache storage allocated for heavy files & pics"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono text-indigo-300 font-bold">{cacheQuotaMB} MB</span>
            </button>

            {/* Quick Open Vault Button */}
            <button
              onClick={() => onOpenStorage('files')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xl backdrop-blur-md transition active:scale-95 group"
              title="Open Phone Internal Storage"
            >
              <HardDrive className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>Phone Vault</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
