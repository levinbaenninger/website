import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { DevTools } from "@/app/_devtools/devtools";
import { AppShell, SITE_CONTENT } from "@/app/_shell";
import { ThemeProvider } from "@/app/_theme/theme-provider";
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
export const metadata: Metadata = {
  title: SITE_CONTENT.metadata.title,
  description: SITE_CONTENT.metadata.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col overflow-x-hidden">
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
