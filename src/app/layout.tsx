import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import { StudyProvider } from "@/app/study-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Study Sidekick — a study week that fits your actual life",
    template: "%s · Study Sidekick",
  },
  description: "A free, browser-based study planner to turn assignments into a realistic, adjustable week.",
  applicationName: "Study Sidekick",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#211f22" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body><StudyProvider><AppShell>{children}</AppShell></StudyProvider></body>
    </html>
  );
}
