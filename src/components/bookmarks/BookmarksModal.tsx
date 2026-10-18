import React, { useState } from 'react';
import { BookmarkItem } from '../../services/storage/types';
import { DEFAULT_BOOKMARKS } from '../../services/bookmarks/defaultBookmarks';
import {
  X,
  Bookmark,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  MessageSquare,
  Shield,
  Wrench,
  Search,
} from 'lucide-react';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUrl: (url: string, title: string) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({ isOpen, onClose, onSelectUrl }) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const saved = localStorage.getItem('perchance_vault_bookmarks');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_BOOKMARKS;
  });

  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  if (!isOpen) return null;

  const saveBookmarks = (items: BookmarkItem[]) => {
    setBookmarks(items);
    localStorage.setItem('perchance_vault_bookmarks', JSON.stringify(items));
  };

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let fullUrl = newUrl.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://') && !fullUrl.startsWith('local://')) {
      if (fullUrl.includes('perchance.org')) {
        fullUrl = `https://${fullUrl}`;
      } else {
        fullUrl = `https://perchance.org/${fullUrl}`;
      }
    }

    const item: BookmarkItem = {
      id: `bm_${Date.now()}`,
      title: newTitle.trim(),
      url: fullUrl,
      description: 'Custom saved Perchance generator',
      category: 'custom',
    };

    saveBookmarks([item, ...bookmarks]);
    setIsAdding(false);
    setNewTitle('');
    setNewUrl('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveBookmarks(bookmarks.filter((b) => b.id !== id));
  };

  const filtered = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'roleplay':
        return <MessageSquare className="w-4 h-4 text-pink-400" />;
      case 'story':
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      case 'rpg':
        return <Shield className="w-4 h-4 text-indigo-400" />;
      case 'tools':
        return <Wrench className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-sm animate-fadeIn">
      <div className="flex flex-col w-full max-w-lg h-[80vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Perchance Generator Hub</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Generator</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 bg-slate-900 border-b border-slate-800/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search generators or enter name..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Add Form */}
        {isAdding && (
          <form onSubmit={handleAddBookmark} className="p-3 bg-slate-950 border-b border-indigo-900/60 space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Generator Name (e.g. My Custom Story)"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
              autoFocus
            />
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Perchance URL (e.g. perchance.org/generator-name or generator-name)"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 text-xs rounded-lg text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* Generator List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectUrl(item.url, item.title);
                onClose();
              }}
              className="flex items-start justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 cursor-pointer transition group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-slate-900/80 mt-0.5 shrink-0">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-white group-hover:text-indigo-300 transition">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {item.description}
                  </div>
                  <div className="text-[10px] text-indigo-400/80 font-mono mt-1 truncate">
                    {item.url}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                {item.category === 'custom' && (
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
