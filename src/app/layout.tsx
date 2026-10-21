import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import { StudyProvider } from "@/app/study-provider";
import { themeInitScript } from "@/lib/theme";
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
    // The inline head script sets data-theme before hydration, so React must
    // accept the DOM value instead of reconciling it.
    <html lang="en" data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <StudyProvider><AppShell>{children}</AppShell></StudyProvider>
      </body>
    </html>
  );
}
