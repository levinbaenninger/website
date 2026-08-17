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

/* `--safe-area-bottom` is 0 without `viewport-fit: cover`. Bottom-anchored
   mobile UI in `header.tsx` and `scroll-to-top.tsx` reads that token, so
   without `cover` it never cleared the home indicator. */
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
      {/* The shell gutter lives here so the header, main and footer rails all
          inset by the same amount. It drops at `md` because the rails are
          `w-3xl` (48rem) at exactly the `md` breakpoint: a gutter would
          overconstrain them in the 768-784px band and push the right border
          out of the clipped viewport. */}
      <body className="flex min-h-full flex-col overflow-x-clip px-2 md:px-0">
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
