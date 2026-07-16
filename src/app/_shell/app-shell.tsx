import { Footer } from "./footer/footer";
import { Header } from "./header/header";
import { ScrollToTop } from "./scroll-to-top";

export const AppShell = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <main>{children}</main>
    <Footer />
    <ScrollToTop />
  </>
);
