import React from 'react';
import {
  X,
  Bookmark,
  Sliders,
  HardDrive,
  Download,
  FolderOpen,
  ExternalLink,
  RotateCw,
  Share2,
  Smartphone,
  Shield,
} from 'lucide-react';
import { phoneStorage } from '../../services/storage/fileSystemBridge';

interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onOpenBookmarks: () => void;
  onOpenCache: () => void;
  onOpenFiles: () => void;
  onRefresh: () => void;
}

export const MobileMenuSheet: React.FC<MobileMenuSheetProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onOpenBookmarks,
  onOpenCache,
  onOpenFiles,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Perchance Generator',
          url: currentUrl,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(currentUrl);
      alert('URL copied to clipboard!');
    }
    onClose();
  };

  const handleMountFolder = async () => {
    onClose();
    const res = await phoneStorage.mountNativeFolder();
    if (res.success) {
      alert(`Mounted phone folder: "${res.name}"`);
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleExportZip = async () => {
    onClose();
    try {
      const blob = await phoneStorage.exportAllAsZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `perchance-vault-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-xs animate-fadeIn select-none">
      {/* Background overlay */}
      <div className="flex-1" onClick={onClose} />

      {/* Bottom Sheet Modal */}
      <div className="w-full bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] shadow-2xl text-slate-100 max-h-[85vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Mobile Browser Controls</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Generator Hub */}
          <button
            onClick={() => {
              onClose();
              onOpenBookmarks();
            }}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800/80 active:scale-98 transition text-left"
          >
            <Bookmark className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Generator Hub</div>
              <div className="text-[10px] text-slate-400">Bookmarks & List</div>
            </div>
          </button>

          {/* Cache Quota Manager */}
          <button
            onClick={() => {
              onClose();
              onOpenCache();
            }}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800/80 active:scale-98 transition text-left"
          >
            <Sliders className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Cache Quota</div>
              <div className="text-[10px] text-slate-400">Change MB & Eviction</div>
            </div>
          </button>

          {/* Phone Files & Vault */}
          <button
            onClick={() => {
              onClose();
              onOpenFiles();
            }}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800/80 active:scale-98 transition text-left"
          >
            <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Phone Storage</div>
              <div className="text-[10px] text-slate-400">Files, Saves & Lore</div>
            </div>
          </button>

          {/* Mount Phone Folder */}
          <button
            onClick={handleMountFolder}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800/80 active:scale-98 transition text-left"
          >
            <FolderOpen className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Mount Folder</div>
              <div className="text-[10px] text-slate-400">Android Documents</div>
            </div>
          </button>

          {/* Backup ZIP */}
          <button
            onClick={handleExportZip}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800/80 active:scale-98 transition text-left"
          >
            <Download className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Backup ZIP</div>
              <div className="text-[10px] text-slate-400">Save to Downloads</div>
            </div>
          </button>

          {/* Open Native Tab */}
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800/80 active:scale-98 transition text-left"
          >
            <ExternalLink className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Native Tab</div>
              <div className="text-[10px] text-slate-400">Chrome/Safari tab</div>
            </div>
          </a>
        </div>

        {/* Secondary Row */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              onClose();
              onRefresh();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reload Generator</span>
          </button>

          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share URL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
