"use client";

import { PageHeading } from "@/components/app-shell";
import { useStudy } from "@/app/study-provider";

export default function FocusPage() {
  const { focusMinutes, setFocusMinutes, secondsRemaining, setSecondsRemaining, timerRunning, setTimerRunning, startTimer, pauseTimer, resetTimer } = useStudy();
  const focusClock = `${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`;
  const paused = secondsRemaining > 0 && secondsRemaining < focusMinutes * 60;

  return <>
    <PageHeading title="Make room to focus" description="Set aside a small stretch for one task. The timer keeps going if you visit another page." />
    <div className="focus-layout">
      <section className="panel focus-card" aria-labelledby="focus-heading">
        <h2 className="sr-only" id="focus-heading">Focus timer</h2>
        <div className="timer-face focus-timer-face" aria-live="off">{focusClock.slice(0, 2)}<span>:</span>{focusClock.slice(3)}</div>
        <div className="timer-state" aria-live="polite">{timerRunning ? "Focus session in progress" : secondsRemaining === 0 ? "Session complete — nice work" : paused ? "Paused" : `${focusMinutes}-minute session ready`}</div>
        <div className="timer-controls"><button className="primary-button" type="button" onClick={() => timerRunning ? pauseTimer() : paused ? setTimerRunning(true) : startTimer()}>{timerRunning ? "Pause focus" : paused ? "Resume focus" : secondsRemaining === 0 ? "Start again" : "Start focus"}</button><button className="timer-reset" type="button" onClick={resetTimer} aria-label="Reset focus timer">↻</button></div>
        <div className="field focus-duration"><label htmlFor="focus-duration">Focus length</label><select id="focus-duration" value={focusMinutes} disabled={timerRunning} onChange={(event) => { const value = Number(event.target.value); setFocusMinutes(value); setSecondsRemaining(value * 60); }}><option value={15}>15 minutes</option><option value={25}>25 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></div>
      </section>
    </div>
  </>;
}
