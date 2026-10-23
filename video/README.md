# Study Sidekick video

A three-minute, silent product walkthrough with burned-in captions, rendered from the Remotion composition in `src/StudySidekickAd.tsx`.

## Story

- **0:00–0:15 — The gap:** a 3-hour Biology lab report is due tomorrow, but only 2 hours are available. The 60-minute shortfall is made explicit.
- **0:15–0:35 — The assignment:** enter the course, deadline, and total effort estimate, then save the assignment.
- **0:35–0:55 — Availability:** set 90 minutes today and 30 minutes tomorrow, before the deadline.
- **0:55–1:20 — The plan:** the schedule uses those two hours and keeps the remaining 60 minutes visible.
- **1:20–1:50 — Sidekick:** one example request becomes five reviewable actions. **Apply all** saves them only after approval.
- **1:50–2:10 — Plan and reminder:** the saved schedule and in-app reminder checklist appear together. The reminder does not send operating-system notifications.
- **2:10–2:30 — Focus:** a 25-minute timer runs for the Biology lab report and remains accurate after a reload.
- **2:30–2:45 — Progress:** the user marks a study block complete; progress changes only after the user checks it off.
- **2:45–3:00 — Close:** the five tools are named, with local storage and optional cloud AI described accurately.

The examples follow the app's demo flow. Assignments, availability, plans, reminders, and timer state are stored in browser storage. Groq is optional; the app asks before sending each cloud request. The video uses no external images, font downloads, or soundtrack.

## Render

Install the pinned packages, then render the actual composition through Remotion:

```sh
npm install
npm run typecheck
npm run render
```

The MP4 is written to `out/study-sidekick-3min.mp4` at 1920×1080, 30 fps. Captions are burned into the video from `src/captions.json`, and `npm run render` also writes a matching `out/study-sidekick-3min.srt`. Run `npm run captions` to regenerate the SRT without re-rendering the video. The SRT mirrors the burned-in track, so enable one or the other when publishing to avoid showing captions twice. For visual review, use `npm run render:stills` for nine chapter frames or `npm run render:gate` for timeline checkpoints. Both scripts invoke the Remotion `still` command; they do not use a separate slideshow renderer.

Remotion downloads its supported headless Chrome on first render. To use an existing Chrome or Chromium executable instead, set `REMOTION_BROWSER_EXECUTABLE` to its path before running the render command. The helper scripts apply the same browser choice to video and still renders.
