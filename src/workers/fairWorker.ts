import { runFairMonteCarlo } from '../engines/fairMonteCarlo';
import type { FairInput, FairSimulationResult } from '../types/simulation';

interface FairWorkerRequest {
  readonly requestId: number;
  readonly input: FairInput;
  readonly trials: number;
  readonly seed: number;
}

interface FairWorkerResponse {
  readonly requestId: number;
  readonly result: FairSimulationResult;
}

self.onmessage = (event: MessageEvent<FairWorkerRequest>) => {
  const { requestId, input, trials, seed } = event.data;
  const result = runFairMonteCarlo(input, trials, seed);
  const response: FairWorkerResponse = { requestId, result };
  self.postMessage(response);
};
