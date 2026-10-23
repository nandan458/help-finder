// Appearance and text size, remembered on this device.
//
// Both work by setting an attribute on the <html> element:
//   data-theme="light" / "dark"   (no attribute = follow the phone's setting)
//   data-text="large"             (no attribute = normal size)
// tokens.css and base.css react to those attributes, so no component has
// to know about them.

import { loadSetting, saveSetting } from "./storage";

export type Theme = "auto" | "light" | "dark";
export type TextSize = "normal" | "large";

export function loadTheme(): Theme {
  const saved = loadSetting("theme");
  return saved === "light" || saved === "dark" ? saved : "auto";
}

export function loadTextSize(): TextSize {
  return loadSetting("textSize") === "large" ? "large" : "normal";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function applyTextSize(size: TextSize): void {
  const root = document.documentElement;
  if (size === "large") root.setAttribute("data-text", "large");
  else root.removeAttribute("data-text");
}

export function setTheme(theme: Theme): void {
  saveSetting("theme", theme);
  applyTheme(theme);
}

export function setTextSize(size: TextSize): void {
  saveSetting("textSize", size);
  applyTextSize(size);
}

/** Called once, before the app draws, so it never flashes the wrong colors. */
export function applySavedSettings(): void {
  applyTheme(loadTheme());
  applyTextSize(loadTextSize());
}
