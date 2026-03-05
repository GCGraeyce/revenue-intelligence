/**
 * Coaching Play Persistence — localStorage-backed progress tracking.
 *
 * Stores step statuses per play so progress survives page reloads.
 * Falls back gracefully if localStorage is unavailable.
 */

type StepStatus = 'pending' | 'in-progress' | 'completed' | 'skipped';

interface PlayProgress {
  playId: string;
  steps: Record<string, StepStatus>;
  updatedAt: string;
}

const STORAGE_KEY = 'revos_coaching_progress';

function readAll(): Record<string, PlayProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, PlayProgress>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silently degrade
  }
}

export function loadPlayProgress(playId: string): Record<string, StepStatus> | null {
  const all = readAll();
  return all[playId]?.steps ?? null;
}

export function savePlayProgress(playId: string, steps: Record<string, StepStatus>): void {
  const all = readAll();
  all[playId] = { playId, steps, updatedAt: new Date().toISOString() };
  writeAll(all);
}

export function clearPlayProgress(playId: string): void {
  const all = readAll();
  delete all[playId];
  writeAll(all);
}

export function clearAllProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

export function getAllPlayProgress(): Record<string, PlayProgress> {
  return readAll();
}
