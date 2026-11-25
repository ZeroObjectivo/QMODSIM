import { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  BookOpen,
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090E1A] dark:text-slate-100">
      {/* Top Clinical Instrument Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center border border-sky-600/40 bg-sky-50 text-sky-700 dark:border-cyan-400/40 dark:bg-cyan-950/40 dark:text-cyan-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  AEGIS-ER
                </h1>
                <span className="border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  QMODSIM v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Clinical Triage & Hospital ER Telemetry Hub
              </p>
            </div>
          </div>

          {/* 3-Archetype Tab Switcher */}
          <nav className="flex items-center border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-950">
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
                      ? 'bg-white text-sky-700 dark:bg-slate-800 dark:text-cyan-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Utilities: Validation Drawer + Theme Toggle */}
          <div className="flex items-center gap-2">
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
              className="inline-flex items-center justify-center border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
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
      <footer className="mt-10 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6 dark:text-slate-400">
          <div className="font-mono">
            AEGIS-ER · QMODSIM Interactive Web Artifact · RA 10173 & DOH AO 2016-0042 Aligned
          </div>
          <div>
            Team: Calm Kaisha Boregas · Peter Paul Marfil · Pepe Bayotlang · Christian Salazar · Mayel Pagal
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
