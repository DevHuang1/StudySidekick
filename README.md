# Study Sidekick

Study Sidekick is a local-first study planner for students who feel buried by assignments. It turns due dates, estimated effort, and the hours a student actually has into an adjustable seven-day plan. It is an Alexa+-style simulated experience for the Amazon Developer Hackathon alternate experience path; it does not connect to Alexa or Amazon services.

The app is a Next.js web application with six tools: **Weekly plan**, **Sidekick**, **Assignments**, **Focus timer**, **Reminders**, and **Insights**. It runs entirely in the browser: study data stays in local storage, there is no account system or database, and the only server-side work is an optional AI request the user explicitly sends. An optional AI assistant can turn a natural-language request into a reviewed plan, availability change, reminder, or focus session, using either a local Ollama model or Groq's cloud API.

## License

MIT. See [LICENSE](LICENSE).
