"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import {
  applyTheme,
  getServerTheme,
  getTheme,
  paintTheme,
  subscribeToTheme,
} from "@/lib/theme";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, getServerTheme);

  // Repaint the resolved theme before paint; this also re-applies the value
  // that React's development Strict Mode remount clears from <html>.
  useLayoutEffect(() => {
    paintTheme(theme);
  }, [theme]);

  function toggleTheme() {
    applyTheme(theme === "dark" ? "light" : "dark");
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