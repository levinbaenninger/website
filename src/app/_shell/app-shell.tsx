import { Footer } from "./footer/footer";
import { Header } from "./header/header";
import { ScrollToTop } from "./scroll-to-top";

export const AppShell = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <main className="px-2 md:px-0">{children}</main>
    <Footer />
    <ScrollToTop />
  </>
);
