import { SmoothCursor } from "./cursor/smooth-cursor";
import { Footer } from "./footer/footer";
import { Header } from "./header/header";
import { ScrollToTop } from "./scroll-to-top";

export const AppShell = ({ children }: { children: React.ReactNode }) => (
  <>
    <a
      href="#main-content"
      className="sr-only fixed top-2 left-2 z-60 rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground shadow-md ring-1 ring-ring focus:not-sr-only focus:fixed"
    >
      Skip to content
    </a>
    <Header />
    <main id="main-content" className="flex flex-1 flex-col px-2 md:px-0">
      {children}

      {/* Carries the column rails through the leftover space, so a short page
          does not leave the borders hanging above the footer. */}
      <div
        aria-hidden
        className="mx-auto w-full flex-1 border-x border-line md:w-3xl"
      />
    </main>
    <Footer />
    <ScrollToTop />
    <SmoothCursor />
  </>
);
