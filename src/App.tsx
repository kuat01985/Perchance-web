import React, { useState, useEffect } from 'react';
import { MobileTopBar } from './components/mobile/MobileTopBar';
import { MobileBottomBar } from './components/mobile/MobileBottomBar';
import { MobileUrlModal } from './components/mobile/MobileUrlModal';
import { MobileTabsModal } from './components/mobile/MobileTabsModal';
import { MobileMenuSheet } from './components/mobile/MobileMenuSheet';
import { PerchanceFrame } from './components/browser/PerchanceFrame';
import { StorageDrawer } from './components/storage/StorageDrawer';
import { BookmarksModal } from './components/bookmarks/BookmarksModal';
import { SwapLabBuildModal } from './components/swaplab/SwapLabBuildModal';
import { BrowserTab, VaultFile } from './services/storage/types';

export default function App() {
  const initialUrl = 'https://perchance.org/chatter1';

  // Tabs state for genuine mobile browser multi-tabbing
  const [tabs, setTabs] = useState<BrowserTab[]>(() => {
    try {
      const saved = localStorage.getItem('perchance_vault_tabs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'tab_1',
        title: 'Chatter1',
        url: initialUrl,
        history: [initialUrl],
        historyIndex: 0,
        isLoading: false,
      },
    ];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('perchance_active_tab_id');
      if (saved) return saved;
    } catch {}
    return 'tab_1';
  });

  // Modals state
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isTabsModalOpen, setIsTabsModalOpen] = useState(false);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [storageInitialTab, setStorageInitialTab] = useState<'files' | 'cache' | 'code' | 'logs'>('files');
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isSwapLabOpen, setIsSwapLabOpen] = useState(false);
  const [insertNotice, setInsertNotice] = useState<string | null>(null);

  // Sync tabs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('perchance_vault_tabs', JSON.stringify(tabs));
      localStorage.setItem('perchance_active_tab_id', activeTabId);
    } catch {}
  }, [tabs, activeTabId]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const navigateTo = (newUrl: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === activeTab.id) {
          const nextHist = t.history.slice(0, t.historyIndex + 1);
          nextHist.push(newUrl);
          return {
            ...t,
            url: newUrl,
            history: nextHist,
            historyIndex: nextHist.length - 1,
            isLoading: false,
          };
        }
        return t;
      })
    );
  };

  const handleGoBack = () => {
    if (activeTab.historyIndex > 0) {
      const nextIndex = activeTab.historyIndex - 1;
      const targetUrl = activeTab.history[nextIndex];
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTab.id ? { ...t, url: targetUrl, historyIndex: nextIndex } : t))
      );
    }
  };

  const handleGoForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const nextIndex = activeTab.historyIndex + 1;
      const targetUrl = activeTab.history[nextIndex];
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTab.id ? { ...t, url: targetUrl, historyIndex: nextIndex } : t))
      );
    }
  };

  const handleRefresh = () => {
    const cur = activeTab.url;
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, url: '' } : t))
    );
    setTimeout(() => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTab.id ? { ...t, url: cur } : t))
      );
    }, 50);
  };

  const handleNewTab = (newUrl: string = 'https://perchance.org/chatter1') => {
    const newId = `tab_${Date.now()}`;
    const newTab: BrowserTab = {
      id: newId,
      title: 'New Tab',
      url: newUrl,
      history: [newUrl],
      historyIndex: 0,
      isLoading: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (tabId: string) => {
    if (tabs.length <= 1) return;
    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(remaining);
    if (activeTabId === tabId) {
      setActiveTabId(remaining[remaining.length - 1].id);
    }
  };

  const handleOpenStorage = (tab: 'files' | 'cache' | 'code' | 'logs' = 'files') => {
    setStorageInitialTab(tab);
    setIsStorageOpen(true);
  };

  const handleInsertToGenerator = async (file: VaultFile, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setInsertNotice(`📋 Copied "${file.name}" to clipboard! Ready to paste into generator.`);
      setTimeout(() => setInsertNotice(null), 3500);
      setIsStorageOpen(false);
    } catch {}
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none fixed inset-0">
      {/* Mobile Top Header */}
      <MobileTopBar
        currentUrl={activeTab.url}
        onOpenUrlInput={() => setIsUrlModalOpen(true)}
        onRefresh={handleRefresh}
        onOpenCache={() => handleOpenStorage('cache')}
        onOpenSwapLab={() => setIsSwapLabOpen(true)}
        isLoading={activeTab.isLoading}
      />

      {/* Full-Bleed Generator Canvas */}
      <main className="relative flex-1 w-full h-full min-h-0 overflow-hidden bg-white">
        {activeTab.url ? (
          <PerchanceFrame
            url={activeTab.url}
            isMobileViewport={false}
            onOpenStorage={handleOpenStorage}
            onInsertNotice={insertNotice}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400 text-xs">
            Loading generator...
          </div>
        )}
      </main>

      {/* Mobile Bottom Thumb Bar */}
      <MobileBottomBar
        canGoBack={activeTab.historyIndex > 0}
        canGoForward={activeTab.historyIndex < activeTab.history.length - 1}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        tabCount={tabs.length}
        onOpenTabs={() => setIsTabsModalOpen(true)}
        onOpenStorage={handleOpenStorage}
        onOpenMenu={() => setIsMenuSheetOpen(true)}
      />

      {/* Mobile URL & Search Omnibox Modal */}
      <MobileUrlModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        currentUrl={activeTab.url}
        onNavigate={navigateTo}
      />

      {/* Mobile Visual Tabs Switcher */}
      <MobileTabsModal
        isOpen={isTabsModalOpen}
        onClose={() => setIsTabsModalOpen(false)}
        tabs={tabs}
        activeTabId={activeTab.id}
        onSelectTab={(id) => setActiveTabId(id)}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
      />

      {/* Mobile Bottom Sheet Menu */}
      <MobileMenuSheet
        isOpen={isMenuSheetOpen}
        onClose={() => setIsMenuSheetOpen(false)}
        currentUrl={activeTab.url}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenCache={() => handleOpenStorage('cache')}
        onOpenFiles={() => handleOpenStorage('files')}
        onOpenSwapLab={() => setIsSwapLabOpen(true)}
        onRefresh={handleRefresh}
      />

      {/* Phone Storage & Cache Quota Bottom Sheet */}
      <StorageDrawer
        isOpen={isStorageOpen}
        onClose={() => setIsStorageOpen(false)}
        onInsertToGenerator={handleInsertToGenerator}
        initialTab={storageInitialTab}
      />

      {/* Bookmarks & Generator Hub */}
      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        onSelectUrl={(selectedUrl) => navigateTo(selectedUrl)}
      />

      {/* SwapLab Android APK Builder Modal */}
      <SwapLabBuildModal
        isOpen={isSwapLabOpen}
        onClose={() => setIsSwapLabOpen(false)}
      />
    </div>
  );
}
