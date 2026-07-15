import { Footer } from "./footer/footer";
import { Header } from "./header/header";

export const AppShell = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <main>{children}</main>
    <Footer />
  </>
);
