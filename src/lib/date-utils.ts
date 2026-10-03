export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateFromKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

export function addDays(key: string, amount: number): string {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

export function getWeekDates(today = new Date()): string[] {
  const first = localDateKey(today);
  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
}

export function formatDate(key: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(undefined, options ?? { weekday: "short", month: "short", day: "numeric" }).format(dateFromKey(key));
}

export function formatDueDate(key: string, today: string): string {
  if (key === today) return "Due today";
  if (key === addDays(today, 1)) return "Due tomorrow";
  return `Due ${formatDate(key, { month: "short", day: "numeric" })}`;
}
