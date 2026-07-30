import type { Metadata } from "next";

import { NOT_FOUND_COPY } from "@/app/_not-found/content";
import { NotFoundView } from "@/app/_not-found/not-found-view";

export const metadata: Metadata = {
  title: NOT_FOUND_COPY.generic.title,
  description: NOT_FOUND_COPY.generic.description,
};

export default function NotFound() {
  return <NotFoundView />;
}
