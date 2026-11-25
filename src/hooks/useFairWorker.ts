import { useEffect, useRef, useState } from 'react';
import type { FairInput, FairSimulationResult } from '../types/simulation';
import { runFairMonteCarlo } from '../engines/fairMonteCarlo';

interface FairWorkerResponse {
  readonly requestId: number;
  readonly result: FairSimulationResult;
}

/**
 * Runs 10,000-trial FAIR Monte Carlo simulations off the main UI thread
 * via a dedicated ES Module Web Worker, with synchronous fallback if Workers
 * are unavailable.
 */
export function useFairWorker(
  input: FairInput,
  trials = 10000,
  seed = 104729
): { result: FairSimulationResult; isComputing: boolean } {
  const [result, setResult] = useState<FairSimulationResult>(() =>
    runFairMonteCarlo(input, 2000, seed)
  );
  const [isComputing, setIsComputing] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (typeof Worker === 'undefined') return;
    const worker = new Worker(new URL('../workers/fairWorker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<FairWorkerResponse>) => {
      if (event.data.requestId === requestIdRef.current) {
        setResult(event.data.result);
        setIsComputing(false);
      }
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const nextId = requestIdRef.current + 1;
    requestIdRef.current = nextId;

    if (workerRef.current) {
      setIsComputing(true);
      workerRef.current.postMessage({ requestId: nextId, input, trials, seed });
    } else {
      setResult(runFairMonteCarlo(input, trials, seed));
    }
  }, [
    input.tefMin,
    input.tefLikely,
    input.tefMax,
    input.lossLogMu,
    input.lossLogSigma,
    input.secondaryLossMultiplier,
    input.mitigationFactor,
    input.controlCostPhp,
    trials,
    seed,
  ]);

  return { result, isComputing };
}
