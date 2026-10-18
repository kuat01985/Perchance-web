import React from 'react';
import { BrowserTab } from '../../services/storage/types';
import { X, Plus, Globe, Check, Smartphone } from 'lucide-react';

interface MobileTabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: BrowserTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: (url?: string) => void;
}

export const MobileTabsModal: React.FC<MobileTabsModalProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}) => {
  if (!isOpen) return null;

  const getCleanTitle = (tab: BrowserTab) => {
    if (tab.url === 'local://playground') return 'Phone Storage Lab';
    try {
      const parsed = new URL(tab.url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      return parts.length > 0 ? parts[parts.length - 1] : parsed.hostname;
    } catch {
      return tab.title || 'Generator';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 select-none animate-fadeIn">
      {/* Top Header */}
      <div className="px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">Open Generator Tabs ({tabs.length})</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNewTab('https://perchance.org/chatter1')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Tab</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => {
                onSelectTab(tab.id);
                onClose();
              }}
              className={`relative flex flex-col h-40 rounded-2xl border p-3 cursor-pointer transition-all active:scale-98 ${
                isActive
                  ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/50 shadow-xl'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-xs font-semibold text-white truncate">
                    {getCleanTitle(tab)}
                  </span>
                </div>

                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Card Preview Body */}
              <div className="flex-1 rounded-xl bg-slate-950/80 border border-slate-800/60 p-2 flex flex-col justify-between overflow-hidden">
                <span className="font-mono text-[10px] text-slate-400 break-all line-clamp-3">
                  {tab.url}
                </span>

                {isActive && (
                  <div className="flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-semibold">
                    <Check className="w-3 h-3 text-indigo-400" />
                    <span>Active</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
