import { NuqsAdapter } from "nuqs/adapters/next/app";

/** Catalog discovery needs this adapter above the island. Here, not root: Portfolio has no URL state and must not ship the provider. */
export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
