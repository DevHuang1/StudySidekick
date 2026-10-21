import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="landing-footer">
      <Link className="landing-brand" href="/" aria-label="Study Sidekick home">
        <span className="landing-brand-mark" aria-hidden="true">S</span>
        <span>Study Sidekick</span>
      </Link>
      <nav className="footer-links" aria-label="Legal and project links">
        <Link href="/terms">Terms of Service</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <a href="https://github.com/DevHuang1/StudySidekick/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT License</a>
        <a href="https://github.com/DevHuang1/StudySidekick" target="_blank" rel="noreferrer">GitHub</a>
      </nav>
      <span>© 2026 DevHuang1</span>
    </footer>
  );
}
