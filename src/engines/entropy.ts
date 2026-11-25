import type { EntropyInput, EntropyResult } from '../types/simulation';
import { clamp } from './arrivals';

const CHARSET_MAP: Record<10 | 36 | 62 | 94, string> = {
  10: '0123456789',
  36: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  62: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  94: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()-_=+[]{}|;:,.<>?/~`',
};

export function formatCrackDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return '> 10¹² years';
  if (seconds < 1) return `${(seconds * 1000).toFixed(1)} ms`;
  if (seconds < 60) return `${seconds.toFixed(1)} sec`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hrs`;
  if (seconds < 31557600) return `${(seconds / 86400).toFixed(1)} days`;
  const years = seconds / 31557600;
  if (years < 1e6) return `${years.toFixed(1)} yrs`;
  const exp = Math.floor(Math.log10(years));
  const mantissa = years / Math.pow(10, exp);
  return `${mantissa.toFixed(2)} × 10^${exp} yrs`;
}

/**
 * Shannon Entropy H(X) = log₂(|Σ|^L) = L · log₂(|Σ|)
 * Keyspace S = |Σ|^L
 * Expected Time-to-Compromise T_crack = S / (2 · R_rate)
 */
export function computeEntropyMetrics(input: EntropyInput): EntropyResult {
  const length = Math.round(clamp(input.length, 4, 64));
  const guessesPerSecond = clamp(input.guessesPerSecond, 1, 1e14);
  const alphabetSize = input.alphabetSize;

  const entropyBits = length * Math.log2(alphabetSize);
  const keyspaceLog10 = length * Math.log10(alphabetSize);
  const keyspaceSize = Math.pow(alphabetSize, length);
  const timeToCrackSeconds = keyspaceSize / (2 * guessesPerSecond);

  let classification: EntropyResult['classification'] = 'STRONG';
  if (entropyBits < 40) classification = 'CRITICAL';
  else if (entropyBits < 64) classification = 'WEAK';
  else if (entropyBits < 96) classification = 'MODERATE';

  return {
    entropyBits,
    keyspaceSize,
    keyspaceLog10,
    timeToCrackSeconds,
    humanReadableCrackTime: formatCrackDuration(timeToCrackSeconds),
    classification,
  };
}

/**
 * Generates a cryptographically secure clinical session token using the Web Crypto API
 * (`crypto.getRandomValues`) with rejection sampling to avoid modulo bias.
 */
export function generateSecureClinicalToken(
  length: number,
  alphabetSize: 10 | 36 | 62 | 94
): string {
  const safeLength = Math.round(clamp(length, 4, 64));
  const charset = CHARSET_MAP[alphabetSize];
  const n = charset.length;
  const maxUnbiased = Math.floor(256 / n) * n;
  const buffer = new Uint8Array(safeLength * 2);
  let token = '';

  while (token.length < safeLength) {
    globalThis.crypto.getRandomValues(buffer);
    for (let i = 0; i < buffer.length && token.length < safeLength; i++) {
      const byte = buffer[i] ?? 0;
      if (byte < maxUnbiased) {
        token += charset.charAt(byte % n);
      }
    }
  }
  return token;
}
