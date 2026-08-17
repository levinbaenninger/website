import { NuqsAdapter } from "nuqs/adapters/next/app";

/**
 * Catalog discovery state needs this adapter above the client island. Mounted
 * here rather than the root layout so Portfolio, which has no URL state, does
 * not ship the provider.
 */
export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
