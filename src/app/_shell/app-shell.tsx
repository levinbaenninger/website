import { SmoothCursor } from "./cursor/smooth-cursor";
import { Footer } from "./footer/footer";
import { Header } from "./header/header";
import { ScrollToTop } from "./scroll-to-top";

export const AppShell = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <main className="flex flex-1 flex-col px-2 md:px-0">
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
