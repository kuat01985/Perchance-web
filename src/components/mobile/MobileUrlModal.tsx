import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Globe, Clipboard, ArrowRight, Sparkles, MessageSquare, BookOpen, Shield, Wrench } from 'lucide-react';

interface MobileUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onNavigate: (url: string) => void;
}

export const MobileUrlModal: React.FC<MobileUrlModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onNavigate,
}) => {
  const [inputVal, setInputVal] = useState(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputVal(currentUrl);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitUrl(inputVal);
  };

  const submitUrl = (val: string) => {
    let clean = val.trim();
    if (!clean) return;

    if (clean === 'local://playground' || clean === 'playground') {
      onNavigate('local://playground');
      onClose();
      return;
    }

    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.includes('perchance.org')) {
        clean = `https://${clean}`;
      } else if (clean.includes('.')) {
        clean = `https://${clean}`;
      } else {
        clean = `https://perchance.org/${clean}`;
      }
    }

    onNavigate(clean);
    onClose();
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setInputVal(clip);
    } catch {}
  };

  const quickLinks = [
    { title: 'Chatter1 (Character Chat)', url: 'https://perchance.org/chatter1', icon: MessageSquare, color: 'text-pink-400' },
    { title: 'Phone Storage Tester Lab', url: 'local://playground', icon: Wrench, color: 'text-emerald-400' },
    { title: 'AI Story Generator', url: 'https://perchance.org/ai-story-generator', icon: BookOpen, color: 'text-purple-400' },
    { title: 'AI Text RPG', url: 'https://perchance.org/ai-text-rpg', icon: Shield, color: 'text-indigo-400' },
    { title: 'Fantasy Name Generator', url: 'https://perchance.org/fantasy-name-generator', icon: Sparkles, color: 'text-amber-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/98 text-slate-100 animate-fadeIn select-none">
      {/* Top Input Bar */}
      <div className="px-3 pt-[calc(env(safe-area-inset-top,0px)+10px)] pb-3 border-b border-slate-800 flex items-center gap-2">
        <form onSubmit={handleSubmit} className="flex-1 flex items-center min-w-0">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-indigo-400" />
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search or enter perchance.org generator..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 shadow-inner"
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => setInputVal('')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        <button
          onClick={handlePaste}
          className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs shrink-0"
          title="Paste from clipboard"
        >
          <Clipboard className="w-4 h-4" />
        </button>

        <button
          onClick={onClose}
          className="px-3 py-2 text-sm text-slate-400 hover:text-white font-medium shrink-0"
        >
          Cancel
        </button>
      </div>

      {/* Suggested Perchance Generators */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
            Featured Generators
          </span>
          <div className="space-y-1.5">
            {quickLinks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => submitUrl(item.url)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 active:border-indigo-500 text-left transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate">
                        {item.url}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0 ml-2" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
