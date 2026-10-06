const DATE_TIME = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/** Human-readable minutes, e.g. 90 becomes "1h 30m". */
export function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 60) return `${Math.max(0, Math.round(minutes))} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/** Compact hours for tight spots, e.g. 90 becomes "1.5h". */
export function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

/** Display an ISO instant in the reader's locale; null when unset or unparseable. */
export function formatInstant(iso: string | null): string | null {
  if (!iso) return null;
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return null;
  return DATE_TIME.format(new Date(parsed));
}

/** Generate a unique id for locally created records. */
export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
