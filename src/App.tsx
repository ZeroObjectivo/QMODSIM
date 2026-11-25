import { useCallback, useMemo, useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  Flame,
  FlaskConical,
  Moon,
  ShieldCheck,
  Sun,
  Workflow,
} from 'lucide-react';
import type { ArchetypeTab } from './types/simulation';
import { useTheme } from './hooks/useTheme';
import { useLabState } from './hooks/useLabState';
import { runFullEngineValidation } from './engines/validation';
import { ScenariosView } from './views/ScenariosView';
import { LabView } from './views/LabView';
import { CodexView } from './views/CodexView';
import { ValidationDrawer } from './components/ValidationDrawer';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const { params, updateParam, resetParams } = useLabState();
  const [activeTab, setActiveTab] = useState<ArchetypeTab>('scenarios');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [validationNonce, setValidationNonce] = useState(0);

  const { results: validationResults, timestamp } = useMemo(() => {
    void validationNonce;
    const res = runFullEngineValidation(params);
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    return { results: res, timestamp: now };
  }, [params, validationNonce]);

  const passedCount = validationResults.filter((r) => r.passed).length;
  const allPassed = passedCount === validationResults.length;

  const handleRerunValidation = useCallback(() => {
    setValidationNonce((n) => n + 1);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 dark:bg-[#0E0D0C] dark:text-stone-100">
      {/* Top Retail Operations Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 dark:border-stone-800 dark:bg-[#171513]/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center border border-orange-700/40 bg-amber-50 text-orange-700 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-400">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  OLD YORKER'S
                </h1>
                <span className="border border-stone-200 bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
                  QMODSIM
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Multi-Branch Ordering & Inventory Telemetry
              </p>
            </div>
          </div>

          {/* 3-Archetype Tab Switcher */}
          <nav className="flex items-center border border-stone-200 bg-stone-100 p-0.5 dark:border-stone-800 dark:bg-[#0E0D0C]">
            {(
              [
                { id: 'scenarios', label: 'SCENARIOS', icon: Workflow },
                { id: 'lab', label: 'LAB', icon: FlaskConical },
                { id: 'codex', label: 'CODEX', icon: BookOpen },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-white text-orange-700 dark:bg-[#171513] dark:text-amber-400'
                      : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Utilities: Storefront Link + Validation Drawer + Theme Toggle */}
          <div className="flex items-center gap-2">
            <a
              href="https://old-yorkers.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 border border-stone-200 bg-white px-2.5 py-1.5 font-mono text-xs font-medium text-stone-700 hover:bg-stone-100 sm:inline-flex dark:border-stone-800 dark:bg-[#0E0D0C] dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <span>Live Store</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-xs font-semibold tabular-nums transition-colors ${
                allPassed
                  ? 'border-emerald-600/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400'
                  : 'border-rose-600/40 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-400'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>
                V&V {passedCount}/{validationResults.length}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center border border-stone-200 bg-white p-1.5 text-stone-700 hover:bg-stone-100 dark:border-stone-800 dark:bg-[#0E0D0C] dark:text-stone-300 dark:hover:bg-stone-800"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === 'scenarios' && <ScenariosView theme={theme} />}
        {activeTab === 'lab' && (
          <LabView
            theme={theme}
            params={params}
            onUpdate={updateParam}
            onReset={resetParams}
          />
        )}
        {activeTab === 'codex' && <CodexView />}
      </main>

      {/* Team Footer */}
      <footer className="mt-10 border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-[#171513]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-4 text-xs text-stone-500 sm:flex-row sm:items-center sm:px-6 dark:text-stone-400">
          <div className="font-mono">
            University of Makati · CCIS · Old Yorker's Multi-Branch Ordering & Inventory QMODSIM
          </div>
          <div>
            Calm Kaisha Boregas (Lead) · Peter Paul Marfil · Pepe Bayotlang · Christian Salazar · Princess Mariel Pagal
          </div>
        </div>
      </footer>

      <ValidationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        results={validationResults}
        lastRunAt={timestamp}
        onRerun={handleRerunValidation}
      />
    </div>
  );
}
export default App;
