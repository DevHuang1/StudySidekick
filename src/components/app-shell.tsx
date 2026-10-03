"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useStudy } from "@/app/study-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const pages = [
  { href: "/week", label: "Weekly plan", icon: "◉" },
  { href: "/sidekick", label: "Sidekick", icon: "✦" },
  { href: "/assignments", label: "Assignments", icon: "✎" },
  { href: "/focus", label: "Focus timer", icon: "◷" },
  { href: "/reminders", label: "Reminders", icon: "♧" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready, toast } = useStudy();

  if (pathname === "/") return <>{children}</>;

  return (
    <div className="app-shell min-h-screen">
      <aside className="sidebar" aria-label="App navigation">
        <Link className="brand" href="/week" aria-label="Study Sidekick weekly plan"><span className="brand-mark" aria-hidden="true">S</span><span className="brand-name">Study <span>Sidekick</span></span></Link>
        {pages.map((page) => <Link className={`nav-link${pathname === page.href ? " active" : ""}`} href={page.href} key={page.href} aria-label={page.label} title={page.label} aria-current={pathname === page.href ? "page" : undefined}>
          <span className="nav-icon" aria-hidden="true">{page.icon}</span><span className="nav-copy">{page.label}</span>
        </Link>)}
        <ThemeToggle />
      </aside>

      <main className="main-area">
        <div className="content-wrap">
          {ready ? children : <div className="loading-shell"><span><i className="loading-dot" />Opening your private study space…</span></div>}
          <p className="privacy-note">Your study data stays in this browser. No account or sync.</p>
        </div>
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export function PageHeading({ title, description, aside }: { title: string; description: string; aside?: ReactNode }) {
  return <div className="page-heading"><div><h1>{title}<span style={{ color: "#a77e69" }}>.</span></h1><p>{description}</p></div>{aside}</div>;
}
