// Small helpers for saving settings on this device (localStorage).
// localStorage can throw in private browsing or when storage is full,
// so every read and write is wrapped. If saving fails, the app keeps working;
// it just won't remember the setting next time.

const PREFIX = "help-finder:";

export function loadSetting(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function saveSetting(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // Ignore: see note at the top of this file.
  }
}

export function removeSetting(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Ignore: see note at the top of this file.
  }
}

/** Read a saved list or object. Returns null if missing or damaged. */
export function loadJSON<T>(key: string): T | null {
  const text = loadSetting(key);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function saveJSON(key: string, value: unknown): void {
  saveSetting(key, JSON.stringify(value));
}
