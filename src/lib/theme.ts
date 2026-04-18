/** localStorage key for light / dark preference (applies `class="dark"` on `<html>`). */
export const THEME_STORAGE_KEY = "zsta-theme";

export type ThemePreference = "light" | "dark";

export function getStoredTheme(): ThemePreference | null {
  if (typeof localStorage === "undefined") return null;
  const v = localStorage.getItem(THEME_STORAGE_KEY);
  if (v === "dark" || v === "light") return v;
  return null;
}

export function applyTheme(theme: ThemePreference): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function setTheme(theme: ThemePreference): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
  applyTheme(theme);
}

/** Inline script for `<head>` — runs before paint to avoid light/dark flash. */
export function themeBootstrapInlineScript(): string {
  const k = JSON.stringify(THEME_STORAGE_KEY);
  return `(function(){try{var k=${k};var p=localStorage.getItem(k);if(p==="dark")document.documentElement.classList.add("dark");else if(p==="light")document.documentElement.classList.remove("dark");}catch(e){}})();`;
}
