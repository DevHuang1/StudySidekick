import { formatDate } from "./date-utils";

/** Create a date-aware, multi-action example. Selecting it never sends the request. */
export function buildDemoRequest(dates: readonly string[]): string | null {
  const today = dates[0];
  const tomorrow = dates[1];
  if (!today || !tomorrow) return null;

  const labelDate = (date: string) =>
    `${formatDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} (${date})`;

  return `Add a Biology lab report for Biology, due ${labelDate(tomorrow)}, with an estimated effort of 3 hours (180 minutes). Set my available study time on ${labelDate(today)} to 90 minutes and on ${labelDate(tomorrow)} to 30 minutes. Build my study week, remind me to review the lab sources, and start a 25-minute focus session.`;
}
