export type Theme = "light" | "dark";

const storageKey = "study-sidekick-theme";

const listeners = new Set<() => void>();

/** localStorage is unavailable in private modes and some embedded webviews. */
function readStoredTheme(): Theme | null {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function prefersDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

/** The chosen theme, falling back to the operating system preference. */
export function getTheme(): Theme {
  return readStoredTheme() ?? (prefersDark() ? "dark" : "light");
}

/** A fixed value so the unhydrated render matches what the server produced. */
export function getServerTheme(): Theme {
  return "light";
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToTheme(onChange: () => void): () => void {
  listeners.add(onChange);
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  media?.addEventListener("change", onChange);
  return () => {
    listeners.delete(onChange);
    media?.removeEventListener("change", onChange);
  };
}

/** Persist the choice and paint it; returns the next theme so callers can react. */
export function applyTheme(theme: Theme): Theme {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // Keep the current page usable if browser storage is unavailable.
  }
  emit();
  return theme;
}

/** Reflect the resolved theme on <html> without recording a user choice. */
export function paintTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}