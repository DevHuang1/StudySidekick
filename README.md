# Study Sidekick

Study Sidekick is a local-first study planner for students who feel buried by assignments. It turns due dates, estimated effort, and the hours a student actually has into an adjustable seven-day plan. It is an Alexa+-style simulated experience for the Amazon Developer Hackathon alternate experience path; it does not connect to Alexa or Amazon services.

The app opens on a public-facing landing page (`/`). Its five tools are **Weekly plan** (`/week`), **Sidekick** (`/sidekick`), **Assignments** (`/assignments`), **Focus timer** (`/focus`), and **Reminders** (`/reminders`). The app sidebar is shared across tool pages, and browser-saved data remains available as you navigate.

## Run the app

Requirements: Node.js 20.9 or newer and npm.

```sh
npm install
npm run dev
```

Open <http://localhost:3000>. The five tool pages use a local demo login: choose **User** or **Judge**, then enter `DEVPOST` (the password is also shown on the login screen). It is a browser-only gate and creates no account. No API key, AWS account, paid API, or physical device is needed. The planner, reminders, and timer work without a language model.

## Deploy on Vercel

The app deploys to [Vercel](https://vercel.com/new) as a standard Next.js project. Import the repository and Vercel reads `vercel.json`, which pins the framework, the install command (`npm ci`), and the build command (`npm run build`). Node.js 20.9 or newer is used (the range is declared in `package.json`).

Set the server-side environment variables in the Vercel project (Settings → Environment Variables) for Production and Preview. Vercel does not read `.env.local`:

- `GROQ_API_KEY` — optional; enables **Groq · cloud** on the deployed site.
- `GROQ_MODEL` — optional; defaults to `openai/gpt-oss-20b`.
- `ASSISTANT_ALLOWED_ORIGINS` — optional; comma-separated extra origins allowed to call `/api/assistant`, such as a custom domain used before the main domain moves.

Leave `OLLAMA_BASE_URL` unset in the cloud environment. The assistant only contacts an explicitly configured loopback Ollama address, so on Vercel every **Local / guided** request falls back to guided actions without attempting a local connection; local AI works when the app runs on the same computer as Ollama.

The assistant endpoint applies a best-effort per-IP rate limit (20 requests per minute) and rejects cross-origin browser requests. Limiting is per server instance, so it reduces abuse rather than eliminating it. The route declares a 50-second `maxDuration` so the host returns the provider's own error message instead of cutting the request off.

Study data never leaves the browser. The deployment has no database, no account system, and no server-side storage; the only server-side work is the AI request you explicitly send.

After the first deploy, check the landing page, all five tools, browser-storage persistence across a reload, `/privacy`, `/terms`, and the Sidekick guided fallback.

## Assignments, focus, and reminders

Add or edit assignment details on the **Assignments** page. Estimates are total effort; completed planned time is tracked separately and the app shows what remains. Set your focus length and start a countdown on **Focus timer**; it continues while you navigate to another page. Keep a browser-only checklist on **Reminders**. Reminders do not send operating-system notifications.

Assignments, availability, plans, completion state, reminders, focus-length preference, and any in-progress focus timer stay in this browser's local storage. Clearing browser storage removes that data. There is no account, sync, or hosted database, and study data is never uploaded; the hosted deployment only processes the AI request you explicitly send (see [Privacy Policy](/privacy)).

A running focus timer is stored as a wall-clock deadline rather than a countdown, so closing or reloading the tab does not lose the session; reopening the page shows the true time remaining. The seven-day window rolls forward on its own when the date changes, and assignment-level completion credit carries across the rollover. Reminder due times are stored as ISO 8601 instants so they stay sortable, and older records saved as display strings are migrated on load.

The light/dark appearance follows your device preference until you choose a mode. A manual choice is saved in this browser.

## Build a study week

1. Add each assignment's title, course, due date, and estimated total effort.
2. Set your available study hours for each of the next seven days. The initial suggestion is two hours per day; change it to match your real schedule.
3. Choose **Build my week**. The deterministic planner schedules the nearest deadlines first, divides larger assignments into short blocks, and never allocates more than the daily capacity you set.
4. If work cannot fit before its due date, the planner shows the remaining time and possible trade-offs. Later deadlines appear in the backlog.
5. Check off completed blocks, or choose a new day and confirm the move. Moves past a due date or beyond a day's capacity are rejected. Checked time updates the assignment's done/total/left figures.

Progress is completed planned minutes divided by the seven-day plan on screen. Assignment-level done/total/left figures persist across plan rebuilds and week rollovers. Assignments and availability edits do not silently rewrite a saved plan; choose **Review replan** to preview the remaining schedule and any deadline shortfall, then **Use this week** to apply it or **Keep current plan** to discard the preview. Checked blocks in the active seven-day window remain checked and reserve their time; unfinished placements are regenerated within the updated capacity.

## Let Sidekick handle a request

The **Sidekick** page can turn one natural-language request into a reviewed handoff: add or edit assignments, change study hours during the next seven days, build a plan, save a reminder, or start a focus timer. For assignment or availability changes, it previews the resulting deterministic schedule alongside every proposed change. Choose **Apply all** to save; **Not now** discards the proposal. Deletion, completion, and manual session moves are not assistant actions.

Choose **Local / guided** to try Ollama on your computer first, **Ollama · local** to explicitly use it, or **Groq · cloud** to opt in to Groq. Without a running Ollama or configured Groq key, guided actions remain available.

To enable local AI, install [Ollama](https://ollama.com/download), then run:

```sh
ollama serve
ollama pull qwen3:4b
```

The model is optional and runs on your computer. Ollama receives the prompt, recent chat, and current assignments and study hours on the local machine. Ollama must run on the same computer as the app; the hosted deployment cannot reach it, so **Local / guided** there falls back to guided actions. If Ollama is unavailable locally, **Local / guided** uses guided actions and never falls back to Groq. Chat history is kept only for the current visit and is not written to browser storage.

To enable Groq, create a Groq API key and put it in the server-side `.env.local` file for local development (or in the Vercel project settings when deployed):

```sh
GROQ_API_KEY=your_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

Restart the dev server, then select **Groq · cloud** on Sidekick. Before every request, Sidekick asks you to confirm that the prompt, recent chat, and current date will go to Groq. An unchecked-by-default option separately controls whether saved assignments and study hours are included for that one request. Cancel sends nothing. The key stays server-side. Groq limits or charges may apply; check its current [model pricing](https://console.groq.com/docs/models) before upgrading. Never commit `.env.local` or share its key.

## Demo recording flow

For a repeatable recording, use a fresh browser profile rather than clearing existing browser data. At the demo login, choose **Judge** and enter `DEVPOST`. Configure the server-side Groq key as described above, start the app, and select **Groq · cloud** on **Sidekick**.

1. Select **Try demo request**. It fills the message box with a request using today and tomorrow's dates; it does not send anything. The example adds a 3-hour Biology lab report due tomorrow, sets study time to 90 minutes today and 30 minutes tomorrow, asks for a week plan and reminder, and starts a 25-minute focus session.
2. Choose **Ask Sidekick**, confirm the per-request Groq notice, and leave **Also include saved assignments and study hours** unchecked. The prompt contains the new assignment and exact dates; the schedule preview is calculated locally from browser data.
3. Review the proposed actions and schedule. With an empty browser profile, the sample shows the 60 minutes that cannot fit before the deadline. Choose **Apply all** to save the assignment, availability, plan, and reminder and start the timer.
4. Open **Weekly plan**, **Reminders**, and **Focus timer** to show the resulting schedule, saved reminder, and running countdown. Keep the recording under three minutes and do not show the API key.

The hackathon requires a repository link and a public video under three minutes on YouTube or Vimeo for the simulated experience path. Before submitting, confirm the repository is accessible and its open-source license is visible, add the project description, identify the Alexa+ track and any mini-challenges, and complete product feedback for every tool, API, or SDK used. A friction log is optional; only submit genuine, specific issues. Check the [official rules](https://amazonappdev2026.devpost.com/rules) for current requirements.

### The `video/` project

`video/` is a separate [Remotion](https://www.remotion.dev/) project for the promo video. It has its own `package.json` and `tsconfig.json` and its own dependencies, so it is kept out of the web app:

- the root `tsconfig.json` excludes `video`, so `npm run typecheck` and `npm run build` never type-check Remotion sources;
- `eslint.config.mjs` ignores `video/**`;
- `.vercelignore` excludes `video/`, so the deployment upload stays limited to the app.

Install and run it on its own from that directory:

```sh
cd video
npm install
npm run dev
```

## Development checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run lint` uses the ESLint CLI with the Next.js flat config (`eslint.config.mjs`); `next lint` was removed in Next.js 16. `npm test` runs Vitest, configured in `vitest.config.mts`.

## License

MIT. See [LICENSE](LICENSE). The deployed app links the [Terms of Service](/terms) and [Privacy Policy](/privacy) from its footer and sidebar.
