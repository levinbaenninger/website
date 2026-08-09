import type { Metadata } from "next";
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
