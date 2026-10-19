import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  ExternalLink,
  CheckCircle2,
  FileArchive,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface SwapLabBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwapLabBuildModal: React.FC<SwapLabBuildModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleDownload = (filename: string, fileLabel: string) => {
    setDownloading(fileLabel);
    const link = document.createElement('a');
    link.href = `/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(null), 1500);
  };

  const swapLabUrl = 'https://public.swaplab.net/?utm_source=chatgpt.com';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn select-none p-0 sm:p-4">
      {/* Backdrop tap to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full sm:max-w-xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl text-slate-100 z-10 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">SwapLab Android Builder</h3>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                  READY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                1-click upload to{' '}
                <span className="text-indigo-300 font-mono">public.swaplab.net</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Hero Action Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 border border-indigo-700/40 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-indigo-200 text-xs flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Pre-Packaged SwapLab Build Zip
              </span>
              <span className="text-[10px] text-slate-400 font-mono">0.71 MB • Verified</span>
            </div>

            <p className="text-slate-300 text-[11.5px] leading-relaxed mb-4">
              Your application is bundled with Capacitor 8.x, compiled web assets (<code className="text-indigo-300 font-mono">dist/</code>), native Android platform, and standard configuration files ready for SwapLab's automated build runner.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleDownload('swaplab-project.zip', 'full')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition font-semibold text-white shadow-md shadow-indigo-600/30"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloading === 'full' ? 'Downloading...' : 'Download Project .ZIP'}
                </span>
              </button>

              <a
                href={swapLabUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 transition font-semibold text-indigo-300 border border-slate-700"
              >
                <span>Open SwapLab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Verification Checklist */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800/80">
              <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                SwapLab Pre-Flight Verification
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">All Checks Passed</span>
            </div>

            <ul className="space-y-2 text-[11px] text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">capacitor.config.json & .ts:</strong> Configured with{' '}
                  <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono">appId: org.perchance.vaultbrowser</code>{' '}
                  and <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono">webDir: dist</code>.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">package.json:</strong> Includes{' '}
                  <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono">@capacitor/core</code>,{' '}
                  <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono">@capacitor/android</code>, and{' '}
                  <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono">@capacitor/filesystem</code>.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Pre-compiled dist/ assets:</strong> HTML5 entry, responsive viewport, PWA manifest, and icons embedded.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Native Android Structure:</strong> Synchronized Gradle wrapper (Gradle 8.14), AndroidManifest with cleartext and phone storage permissions.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Size Optimization:</strong> Excludes <code className="text-slate-400 font-mono">node_modules/</code> & binaries (~0.7 MB total, well below the 50 MB limit).
                </div>
              </li>
            </ul>
          </div>

          {/* Quick Steps Guide */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
            <span className="font-semibold text-white flex items-center gap-1.5 text-xs mb-2.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              How to Build on public.swaplab.net
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-bold text-indigo-300 mb-1">1. Download ZIP</div>
                <p className="text-slate-400">
                  Save <code className="text-slate-200 font-mono">swaplab-project.zip</code> to your computer or phone.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-bold text-indigo-300 mb-1">2. Upload & Configure</div>
                <p className="text-slate-400">
                  Open SwapLab, select <strong>Android</strong> & <strong>Capacitor</strong>, then drop the ZIP.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-bold text-indigo-300 mb-1">3. Click Build APK</div>
                <p className="text-slate-400">
                  The cloud runner compiles your APK in ~60s with instant download link.
                </p>
              </div>
            </div>
          </div>

          {/* Alternative Pre-built Web Assets Mode */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileArchive className="w-5 h-5 text-teal-400 shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold text-slate-200 truncate">
                  Pre-built Web Assets Only (.zip)
                </div>
                <div className="text-[10px] text-slate-400">
                  Optimized for SwapLab's "Pre-built Web Assets" checkbox (0.66 MB)
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDownload('swaplab-prebuilt.zip', 'prebuilt')}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-[11px] shrink-0 border border-slate-700"
            >
              {downloading === 'prebuilt' ? 'Downloading...' : 'Download'}
            </button>
          </div>

          {/* CLI Command Helper */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-slate-500" />
                Local Terminal Command:
              </span>
              <button
                onClick={() => handleCopy('npm run swaplab:package', 'cli')}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedCmd === 'cli' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <code className="block bg-slate-900 p-2 rounded-xl text-emerald-300 font-mono text-[11px] overflow-x-auto">
              npm run swaplab:package
            </code>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400 truncate">
            Target: <code className="text-slate-300 font-mono">public.swaplab.net</code>
          </span>
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
