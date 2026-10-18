import React, { useState, useEffect } from 'react';
import { phoneStorage } from '../../services/storage/fileSystemBridge';
import { Play, Save, RefreshCw, CheckCircle, Code, FileText, Database, Shield, Zap } from 'lucide-react';

export const GeneratorPlayground: React.FC = () => {
  const [characterData, setCharacterData] = useState<any>(null);
  const [questText, setQuestText] = useState<string>('');
  const [selectedQuest, setSelectedQuest] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [customScript, setCustomScript] = useState<string>(
`// Test reading/writing phone storage live!
async function run() {
  const files = await PerchanceStorage.listFiles();
  const hero = await PerchanceStorage.readJson("lorebooks/character_sample.json");
  return { filesCount: files.length, heroName: hero.name, inventory: hero.inventory };
}`
  );
  const [scriptResult, setScriptResult] = useState<string>('');
  const [scriptRunning, setScriptRunning] = useState(false);

  // Load sample character on mount
  const loadHeroFromPhone = async () => {
    try {
      const txt = await phoneStorage.readFile('lorebooks/character_sample.json');
      const parsed = JSON.parse(txt);
      setCharacterData(parsed);
    } catch (err: any) {
      console.warn('Could not load hero:', err);
    }
  };

  const loadQuestTable = async () => {
    try {
      const txt = await phoneStorage.readFile('tables/quest_hooks.txt');
      setQuestText(txt);
      const lines = txt.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const randomLine = lines[Math.floor(Math.random() * lines.length)];
        setSelectedQuest(randomLine);
      }
    } catch (err: any) {
      console.warn('Could not load quests:', err);
    }
  };

  useEffect(() => {
    loadHeroFromPhone();
    loadQuestTable();
  }, []);

  const handleSaveState = async () => {
    try {
      const state = {
        character: characterData?.name || 'Unknown',
        currentQuest: selectedQuest || 'None',
        health: (characterData?.stats?.hp || 100) - Math.floor(Math.random() * 10),
        savedAt: new Date().toLocaleTimeString(),
        device: 'Phone Internal Storage',
      };
      await phoneStorage.writeFile('saves/playground_save.json', JSON.stringify(state, null, 2));
      setSaveStatus(`Saved to saves/playground_save.json at ${state.savedAt}!`);
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    }
  };

  const handleRunCustomScript = async () => {
    setScriptRunning(true);
    setScriptResult('Executing on Phone Storage Bridge...');

    // Mock bridge environment for sandbox
    const mockPerchanceStorage = {
      listFiles: async (sub?: string) => await phoneStorage.listFiles(sub),
      readFile: async (p: string) => await phoneStorage.readFile(p),
      readJson: async (p: string) => JSON.parse(await phoneStorage.readFile(p)),
      writeFile: async (p: string, c: any) => await phoneStorage.writeFile(p, c),
      writeJson: async (p: string, obj: any) => await phoneStorage.writeFile(p, JSON.stringify(obj, null, 2)),
    };

    try {
      const userFn = new Function('PerchanceStorage', `
        ${customScript}
        return run();
      `);
      const result = await userFn(mockPerchanceStorage);
      setScriptResult(JSON.stringify(result, null, 2));
    } catch (err: any) {
      setScriptResult(`Error executing code: ${err.message}`);
    } finally {
      setScriptRunning(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 text-slate-100 space-y-6">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-700/50 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Phone Storage Test Lab</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live Bridge Active
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            This interactive simulator demonstrates how any Perchance.org generator accesses your phone's internal files.
          </p>
        </div>

        <button
          onClick={() => {
            loadHeroFromPhone();
            loadQuestTable();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Phone Files</span>
        </button>
      </div>

      {saveStatus && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs shadow-md animate-fadeIn">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Grid of Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Test Card 1: Character Card Reader */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              1. Reading JSON Lorebook from Phone
            </span>
            <span className="text-[11px] font-mono text-slate-400">lorebooks/character_sample.json</span>
          </div>

          {characterData ? (
            <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{characterData.name}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-medium">
                  {characterData.role}
                </span>
              </div>
              <p className="text-slate-300 italic">"{characterData.lore}"</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {characterData.inventory?.map((item: string, i: number) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                    ⚔️ {item}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-500 bg-slate-950 rounded-xl">
              Character not found on phone storage.
            </div>
          )}

          <button
            onClick={loadHeroFromPhone}
            className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-700/50 transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-read from Phone Storage</span>
          </button>
        </div>

        {/* Test Card 2: Procedural Table Hook */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              2. Procedural Random Table
            </span>
            <span className="text-[11px] font-mono text-slate-400">tables/quest_hooks.txt</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs min-h-[90px] flex flex-col justify-center">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
              Generated Random Quest:
            </div>
            <p className="text-amber-200 font-medium leading-relaxed">
              "{selectedQuest || 'Roll to pick a quest from phone storage...'}"
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadQuestTable}
              className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Roll from Phone Table</span>
            </button>

            <button
              onClick={handleSaveState}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5"
              title="Save current game state to phone"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save State</span>
            </button>
          </div>
        </div>
      </div>

      {/* Test Card 3: Custom Perchance Code Runner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <Code className="w-4 h-4" />
            3. Interactive Perchance Script Console
          </span>
          <span className="text-xs text-slate-400">
            Directly calls <code className="text-indigo-400 font-mono">PerchanceStorage</code> API
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <textarea
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              className="w-full h-36 font-mono text-xs bg-slate-950 text-indigo-200 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              spellCheck={false}
            />
            <button
              onClick={handleRunCustomScript}
              disabled={scriptRunning}
              className="mt-2 w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{scriptRunning ? 'Executing...' : 'Run Code on Phone Storage'}</span>
            </button>
          </div>

          <div className="flex flex-col">
            <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Output Console:</div>
            <pre className="flex-1 min-h-[140px] max-h-48 overflow-auto font-mono text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-400 whitespace-pre-wrap">
              {scriptResult || '// Output will appear here...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
