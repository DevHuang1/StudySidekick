"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const storageKey = "study-sidekick-theme";

function setDocumentTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    let initial: Theme = "light";
    try {
      const saved = window.localStorage.getItem(storageKey);
      initial = saved === "light" || saved === "dark"
        ? saved
        : window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      initial = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    setDocumentTheme(initial);
    setTheme(initial);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setDocumentTheme(next);
    setTheme(next);
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // Keep the current page usable if browser storage is unavailable.
    }
  }

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === "dark"}
      title={`Switch to ${nextTheme} mode`}
    >
      <span className="theme-icon" aria-hidden="true">{theme === "dark" ? "☼" : "◐"}</span>
      <span className="theme-label">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
