import React, { useState, useEffect, useRef } from 'react';
import { VaultFile, StorageStatus } from '../../services/storage/types';
import { phoneStorage } from '../../services/storage/fileSystemBridge';
import { FileEditorModal } from './FileEditorModal';
import {
  Folder,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  HardDrive,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Search,
  RefreshCw,
  FolderPlus,
  FilePlus,
  ExternalLink,
  Smartphone,
  Info,
} from 'lucide-react';

interface FileExplorerProps {
  onInsertToGenerator?: (file: VaultFile, content: string) => void;
  compact?: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ onInsertToGenerator, compact = false }) => {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StorageStatus>(phoneStorage.getStorageStatus());
  const [search, setSearch] = useState('');
  const [editingFile, setEditingFile] = useState<VaultFile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('json');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const list = await phoneStorage.listFiles();
      setFiles(list);
      setStatus(phoneStorage.getStorageStatus());
    } catch (err: any) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
    const unsub = phoneStorage.subscribe(() => {
      loadFiles();
    });
    return () => unsub();
  }, []);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Mount native phone folder (e.g. Documents/Perchance)
  const handleMountPhoneFolder = async () => {
    const res = await phoneStorage.mountNativeFolder();
    if (res.success) {
      showNotice(`Mounted phone folder: "${res.name}"`);
    } else if (res.error) {
      alert(res.error);
    }
  };

  // Disconnect native phone folder and fall back to internal vault
  const handleDisconnect = () => {
    phoneStorage.disconnectNativeFolder();
    showNotice('Switched to Internal Phone Vault');
  };

  // Upload files from phone
  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;
    try {
      const count = await phoneStorage.importFiles(uploaded);
      showNotice(`Imported ${count} file(s) from phone`);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Import ZIP
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await phoneStorage.importZip(file);
      showNotice(`Extracted ${count} file(s) from ZIP`);
    } catch (err: any) {
      alert(`ZIP import failed: ${err.message}`);
    }
    if (zipInputRef.current) zipInputRef.current.value = '';
  };

  // Backup / Export everything as ZIP to phone's downloads
  const handleExportZip = async () => {
    try {
      showNotice('Creating ZIP archive...');
      const blob = await phoneStorage.exportAllAsZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `perchance-vault-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotice('Downloaded ZIP backup to phone storage!');
    } catch (err: any) {
      alert(`Backup failed: ${err.message}`);
    }
  };

  // Delete file
  const handleDelete = async (filePath: string) => {
    if (!window.confirm(`Delete "${filePath}" from phone storage?`)) return;
    try {
      await phoneStorage.deleteFile(filePath);
      showNotice(`Deleted ${filePath}`);
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  // Create new file
  const handleCreateNewFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let path = newFileName.trim();
    if (!path.includes('.')) {
      path = `${path}.${newFileType}`;
    }

    const defaultContent =
      newFileType === 'json'
        ? '{\n  "title": "New Lore",\n  "data": {}\n}'
        : newFileType === 'perchance'
        ? '// Perchance Table\noutput\n  A mysterious stranger appears\n  You discover an ancient rune\n'
        : '';

    try {
      const created = await phoneStorage.writeFile(path, defaultContent);
      setIsCreatingFile(false);
      setNewFileName('');
      setEditingFile(created);
      showNotice(`Created ${path}`);
    } catch (err: any) {
      alert(`Could not create file: ${err.message}`);
    }
  };

  // Copy file content directly to clipboard
  const handleCopyContent = async (file: VaultFile) => {
    try {
      let text = '';
      if (file.isText) {
        text = await phoneStorage.readFile(file.path);
      } else {
        text = await phoneStorage.readFileAsDataUrl(file.path);
      }
      await navigator.clipboard.writeText(text);
      setCopiedId(file.path);
      setTimeout(() => setCopiedId(null), 2000);
      showNotice(`Copied content of ${file.name}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Direct injection
  const handleInsert = async (file: VaultFile) => {
    if (!onInsertToGenerator) return;
    try {
      const content = file.isText
        ? await phoneStorage.readFile(file.path)
        : await phoneStorage.readFileAsDataUrl(file.path);
      onInsertToGenerator(file, content);
      showNotice(`Inserted ${file.name} to generator!`);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFiles = files.filter(
    (f) => f.path.toLowerCase().includes(search.toLowerCase()) || f.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalKb = (totalBytes / 1024).toFixed(1);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Storage Mode Banner */}
      <div className="px-3 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {status.mode === 'capacitor_native_storage' ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Android Native Storage (Documents)</span>
            </div>
          ) : status.mode === 'native_directory' ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Phone Folder: {status.folderName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/80 text-indigo-300 font-medium">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phone Internal Vault</span>
            </div>
          )}
          <span className="text-slate-400 hidden sm:inline">
            ({files.length} items • {totalKb} KB)
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {phoneStorage.isFileSystemAccessSupported() && status.mode !== 'native_directory' && status.mode !== 'capacitor_native_storage' && (
            <button
              onClick={handleMountPhoneFolder}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition active:scale-95 text-xs"
              title="Pick a specific folder from your phone storage"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Mount Phone Folder</span>
            </button>
          )}

          {status.mode === 'native_directory' && (
            <button
              onClick={handleDisconnect}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              title="Disconnect folder"
            >
              Unmount
            </button>
          )}

          <button
            onClick={loadFiles}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Refresh files"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="bg-indigo-600 px-3 py-1.5 text-xs text-white text-center font-medium shadow-md transition-all">
          {actionNotice}
        </div>
      )}

      {/* Toolbar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800/80 flex flex-wrap gap-2 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[140px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phone files..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsCreatingFile(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="Create new file"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">New File</span>
          </button>

          {/* Upload files input */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="Upload files from phone (Photos, JSON, TXT)"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Import Files</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFilesUpload}
          />

          {/* ZIP Backup / Restore */}
          <button
            onClick={handleExportZip}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="Export all files as a ZIP package to your phone"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Backup ZIP</span>
          </button>

          <button
            onClick={() => zipInputRef.current?.click()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
            title="Restore files from a ZIP archive"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
          </button>
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleZipUpload}
          />
        </div>
      </div>

      {/* New File Input Dropdown */}
      {isCreatingFile && (
        <form onSubmit={handleCreateNewFile} className="p-3 bg-slate-950 border-b border-indigo-900/60 flex items-center gap-2">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="e.g. characters/rogue.json or notes.txt"
            className="flex-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <select
            value={newFileType}
            onChange={(e) => setNewFileType(e.target.value)}
            className="px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
          >
            <option value="json">.json</option>
            <option value="txt">.txt</option>
            <option value="perchance">.perchance</option>
            <option value="md">.md</option>
          </select>
          <button
            type="submit"
            className="px-3 py-1 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingFile(false)}
            className="px-2 py-1 text-xs rounded-lg text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </form>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
            Loading phone storage files...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <HardDrive className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">No files found</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Import character cards, lore text, or prompts from your phone, or tap "New File" above.
            </p>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const ext = file.name.split('.').pop()?.toLowerCase();
            const isJson = ext === 'json';
            const isPerchance = ext === 'perchance';
            const isImage = !file.isText;

            return (
              <div
                key={file.path}
                className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-600/50 transition-all text-xs"
              >
                <div
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => setEditingFile(file)}
                >
                  <div className="p-1.5 rounded-lg bg-slate-700/60 shrink-0">
                    {isImage ? (
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                    ) : isJson ? (
                      <span className="w-4 h-4 text-amber-400 font-mono font-bold text-[10px] flex items-center justify-center">
                        {'{ }'}
                      </span>
                    ) : isPerchance ? (
                      <span className="w-4 h-4 text-purple-400 font-mono font-bold text-[10px] flex items-center justify-center">
                        🎲
                      </span>
                    ) : (
                      <FileText className="w-4 h-4 text-sky-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-100 truncate group-hover:text-indigo-300 transition">
                        {file.name}
                      </span>
                      {file.path.includes('/') && (
                        <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-900 truncate">
                          {file.path.substring(0, file.path.lastIndexOf('/'))}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* File Action Buttons */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {onInsertToGenerator && (
                    <button
                      onClick={() => handleInsert(file)}
                      className="px-2 py-1 rounded-md bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium flex items-center gap-1 shadow-sm transition"
                      title="Inject content into Perchance generator"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="hidden md:inline text-[11px]">Inject</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyContent(file)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition"
                    title="Copy content to clipboard"
                  >
                    {copiedId === file.path ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => setEditingFile(file)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition"
                    title="Edit file"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(file.path)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Editor Modal */}
      {editingFile && (
        <FileEditorModal
          file={editingFile}
          onClose={() => setEditingFile(null)}
          onSaved={() => loadFiles()}
        />
      )}
    </div>
  );
};
