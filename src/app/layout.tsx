import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "@/app/_components/app-shell/app-shell";
import { DevTools } from "@/app/_components/dev-tools";
import { createRootMetadata } from "@/app/_config/site-metadata";
import { ThemeProvider } from "@/app/_providers/theme-provider";
import { TooltipProvider } from "@/shared/ui/tooltip";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const metadata: Metadata = createRootMetadata();

/* `env(safe-area-inset-*)` resolves to 0 unless the viewport opts into the
   display cutout area. The bottom-anchored mobile UI in `header.tsx` and
   `scroll-to-top.tsx` already reads those insets, so without `cover` they
   were reading zero and never cleared the home indicator. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-x-clip antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col overflow-x-clip">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <AppShell>{children}</AppShell>
          </TooltipProvider>
          <DevTools />
        </ThemeProvider>
      </body>
    </html>
  );
}
