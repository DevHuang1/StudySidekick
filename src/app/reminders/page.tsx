"use client";

import { useState, type FormEvent } from "react";
import { PageHeading } from "@/components/app-shell";
import { useStudy } from "@/app/study-provider";
import { formatInstant, newId } from "@/lib/format";
import type { Reminder } from "@/lib/types";

/** Fill a datetime-local input from an ISO instant in the reader's local time. */
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.valueOf())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

export default function RemindersPage() {
  const { reminders, setReminders } = useStudy();
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  function clearForm() {
    setEditingId(null);
    setText("");
    setDate("");
    setError("");
  }

  function submitReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) {
      setError("Write a short reminder first.");
      return;
    }
    // datetime-local has no timezone, so new Date() reads it as local time.
    const parsed = date ? new Date(date) : null;
    const dueAt = parsed && !Number.isNaN(parsed.valueOf()) ? parsed.toISOString() : null;

    if (editingId) {
      setReminders((current) => current.map((item) => item.id === editingId ? { ...item, text: cleanText, dueAt } : item));
      clearForm();
      return;
    }
    setReminders((current) => [{ id: newId(), text: cleanText, dueAt, done: false }, ...current]);
    clearForm();
  }

  function editReminder(reminder: Reminder) {
    setEditingId(reminder.id);
    setText(reminder.text);
    setDate(toLocalInputValue(reminder.dueAt));
    setError("");
  }

  function updateReminder(id: string, update: Partial<Reminder>) {
    setReminders((current) => current.map((item) => item.id === id ? { ...item, ...update } : item));
  }

  const sorted = [...reminders].sort((left, right) => {
    if (left.done !== right.done) return left.done ? 1 : -1;
    if (left.dueAt && right.dueAt) return left.dueAt.localeCompare(right.dueAt);
    if (left.dueAt) return -1;
    if (right.dueAt) return 1;
    return 0;
  });

  return <>
    <PageHeading title="Reminders" description="Keep small tasks and follow-ups together. Reminders do not send notifications." />
    <section className="panel reminders-page" aria-labelledby="reminders-heading">
      <h2 className="sr-only" id="reminders-heading">Your reminders</h2>
      <form className="reminders-form" onSubmit={submitReminder}>
        <div className="field full-field"><label htmlFor="reminder-text">{editingId ? "Edit reminder" : "What should you remember?"}</label><input id="reminder-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={180} placeholder="e.g. Bring notes to study group" /></div>
        <div className="field"><label htmlFor="reminder-datetime">Optional date and time</label><input id="reminder-datetime" type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} /></div>
        <button className="primary-button add-reminder-button" type="submit">{editingId ? "Save reminder" : "+ Save reminder"}</button>
        {editingId && <button className="quiet-button" type="button" onClick={clearForm}>Cancel edit</button>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
      <div className="reminder-list reminders-full-list">{reminders.length ? sorted.map((reminder) => {
        const when = formatInstant(reminder.dueAt);
        return <div className={`reminder-row${reminder.done ? " reminder-done" : ""}`} key={reminder.id}>
          <input type="checkbox" checked={reminder.done} onChange={(event) => updateReminder(reminder.id, { done: event.target.checked })} aria-label={`${reminder.done ? "Reopen" : "Complete"} reminder: ${reminder.text}`} />
          <div className="reminder-copy">{reminder.text}<span>{when ?? "No time set"}</span></div>
          <button className="reminder-edit" type="button" aria-label={`Edit reminder: ${reminder.text}`} onClick={() => editReminder(reminder)}>✎</button>
          <button className="reminder-delete" type="button" aria-label={`Delete reminder: ${reminder.text}`} onClick={() => setReminders((current) => current.filter((item) => item.id !== reminder.id))}>×</button>
        </div>;
      }) : <div className="reminders-empty"><strong>Nothing to remember just yet.</strong><span>Add a note above and let your mind move on.</span></div>}</div>
    </section>
  </>;
}
