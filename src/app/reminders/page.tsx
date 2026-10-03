"use client";

import { useState, type FormEvent } from "react";
import { PageHeading } from "@/components/app-shell";
import { useStudy } from "@/app/study-provider";
import type { Reminder } from "@/lib/types";

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function RemindersPage() {
  const { reminders, setReminders } = useStudy();
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  function addReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) {
      setError("Write a short reminder first.");
      return;
    }
    const dueAt = date ? new Date(date).toLocaleString() : null;
    setReminders((current) => [{ id: newId(), text: cleanText, dueAt, done: false }, ...current]);
    setText("");
    setDate("");
    setError("");
  }

  function updateReminder(id: string, update: Partial<Reminder>) {
    setReminders((current) => current.map((item) => item.id === id ? { ...item, ...update } : item));
  }

  return <>
    <PageHeading title="Reminders" description="Keep small tasks and follow-ups together. Reminders do not send notifications." />
    <section className="panel reminders-page" aria-labelledby="reminders-heading">
      <h2 className="sr-only" id="reminders-heading">Your reminders</h2>
      <form className="reminders-form" onSubmit={addReminder}>
        <div className="field full-field"><label htmlFor="reminder-text">What should you remember?</label><input id="reminder-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={180} placeholder="e.g. Bring notes to study group" /></div>
        <div className="field"><label htmlFor="reminder-datetime">Optional date and time</label><input id="reminder-datetime" type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} /></div>
        <button className="primary-button add-reminder-button" type="submit">+ Save reminder</button>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
      <div className="reminder-list reminders-full-list">{reminders.length ? reminders.map((reminder) => <div className={`reminder-row${reminder.done ? " reminder-done" : ""}`} key={reminder.id}><input type="checkbox" checked={reminder.done} onChange={(event) => updateReminder(reminder.id, { done: event.target.checked })} aria-label={`${reminder.done ? "Reopen" : "Complete"} reminder: ${reminder.text}`} /><div className="reminder-copy">{reminder.text}<span>{reminder.dueAt || "No time set"}</span></div><button className="reminder-delete" type="button" aria-label={`Delete reminder: ${reminder.text}`} onClick={() => setReminders((current) => current.filter((item) => item.id !== reminder.id))}>×</button></div>) : <div className="reminders-empty"><strong>Nothing to remember just yet.</strong><span>Add a note above and let your mind move on.</span></div>}</div>
    </section>
  </>;
}
