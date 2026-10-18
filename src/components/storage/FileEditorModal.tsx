import React, { useState, useEffect } from 'react';
import { VaultFile } from '../../services/storage/types';
import { phoneStorage } from '../../services/storage/fileSystemBridge';
import { X, Save, Copy, Check, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface FileEditorModalProps {
  file: VaultFile | null;
  onClose: () => void;
  onSaved?: () => void;
}

export const FileEditorModal: React.FC<FileEditorModalProps> = ({ file, onClose, onSaved }) => {
  const [content, setContent] = useState('');
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;

    setLoading(true);
    setJsonError(null);

    if (file.isText) {
      phoneStorage
        .readFile(file.path)
        .then((txt) => {
          setContent(txt);
          setDataUrl(null);
        })
        .catch((err) => {
          setContent(`Error loading file: ${err.message}`);
        })
        .finally(() => setLoading(false));
    } else {
      phoneStorage
        .readFileAsDataUrl(file.path)
        .then((url) => {
          setDataUrl(url);
          setContent('');
        })
        .catch(() => {
          setDataUrl(null);
        })
        .finally(() => setLoading(false));
    }
  }, [file]);

  if (!file) return null;

  const handleSave = async () => {
    setSaving(true);
    setJsonError(null);

    // Validate JSON if applicable
    if (file.path.endsWith('.json')) {
      try {
        JSON.parse(content);
      } catch (e: any) {
        setJsonError(`Invalid JSON syntax: ${e.message}`);
        setSaving(false);
        return;
      }
    }

    try {
      await phoneStorage.writeFile(file.path, content);
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(content);
      setContent(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (e: any) {
      setJsonError(`Cannot format: ${e.message}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm animate-fadeIn">
      <div className="flex flex-col w-full max-w-3xl h-[85vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-2.5 min-w-0">
            {file.isText ? (
              <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
            ) : (
              <ImageIcon className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">{file.name}</h2>
              <p className="text-xs text-slate-400 font-mono truncate">{file.path}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {file.isText && file.path.endsWith('.json') && (
              <button
                onClick={handleFormatJson}
                className="hidden sm:inline-flex px-2 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:text-white"
              >
                Prettify JSON
              </button>
            )}

            {file.isText && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            {file.isText && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save File'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* JSON Syntax Error alert */}
        {jsonError && (
          <div className="px-4 py-2 bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{jsonError}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Loading file from phone storage...
            </div>
          ) : file.isText ? (
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setJsonError(null);
              }}
              className="w-full h-full font-mono text-xs sm:text-sm bg-transparent text-slate-200 border-none outline-none resize-none leading-relaxed selection:bg-indigo-500/30"
              placeholder="Empty file content..."
              spellCheck={false}
            />
          ) : dataUrl ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
              <img
                src={dataUrl}
                alt={file.name}
                className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-lg border border-slate-800"
              />
              <span className="text-xs text-slate-400">
                Binary media asset ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Binary asset cannot be displayed in text editor.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Size: {(file.size / 1024).toFixed(2)} KB</span>
          <span>Last modified: {new Date(file.lastModified).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
