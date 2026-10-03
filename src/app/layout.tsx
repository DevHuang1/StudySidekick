import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { StudyProvider } from "@/app/study-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Sidekick — a study week that fits your actual life",
  description: "A free, browser-based study planner to turn assignments into a realistic, adjustable week.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body><StudyProvider><AppShell>{children}</AppShell></StudyProvider></body>
    </html>
  );
}
