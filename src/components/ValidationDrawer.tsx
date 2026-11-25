import { CheckCircle2, RefreshCw, ShieldCheck, X, XCircle } from 'lucide-react';
import type { ValidationResult } from '../types/simulation';

interface ValidationDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly results: readonly ValidationResult[];
  readonly lastRunAt: string;
  readonly onRerun: () => void;
}

export function ValidationDrawer({
  open,
  onClose,
  results,
  lastRunAt,
  onRerun,
}: ValidationDrawerProps) {
  if (!open) return null;

  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = passedCount === results.length && results.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/50"
      role="dialog"
      aria-modal="true"
      aria-label="Mathematical Verification and Validation Drawer"
    >
      <div className="flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-sky-600 dark:text-cyan-400" />
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Verification & Validation Suite
              </h2>
              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                src/engines/validation.ts · Live Invariant Checks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Close validation drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                allPassed ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {passedCount}/{results.length} INVARIANTS PASSED
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
              {lastRunAt}
            </span>
            <button
              type="button"
              onClick={onRerun}
              className="inline-flex items-center gap-1.5 border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Re-Run
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {results.map((item) => (
            <div
              key={item.target}
              className="border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {item.target}
                  </h3>
                  <p className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    Standard: {item.standard}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 border px-2 py-0.5 font-mono text-[11px] font-semibold ${
                    item.passed
                      ? 'border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-rose-600/40 bg-rose-500/10 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {item.passed ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {item.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <div className="mt-2.5 border-t border-slate-200 pt-2 font-mono text-xs tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                {item.measured}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 px-5 py-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Every check executes directly against pure TypeScript engines under{' '}
          <code className="font-mono text-slate-700 dark:text-slate-300">src/engines/</code> using
          active LAB parameters.
        </div>
      </div>
    </div>
  );
}
