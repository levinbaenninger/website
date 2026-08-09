import { NuqsAdapter } from "nuqs/adapters/next/app";

/**
 * The Blog's URL-state adapter.
 *
 * Catalog discovery state lives in the query string, and the client island
 * that owns it needs an adapter above it. It is mounted here rather than in
 * the root layout so that only the Blog pays for it: the Portfolio keeps no
 * URL state and should not ship the provider.
 */
export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
