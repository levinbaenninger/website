import type { Metadata } from "next";

import { NotFoundView } from "@/app/_components/not-found/not-found-view";
import { NOT_FOUND_COPY } from "@/app/_config/not-found";

export const metadata: Metadata = {
  title: NOT_FOUND_COPY.generic.title,
  description: NOT_FOUND_COPY.generic.description,
};

export default function NotFound() {
  return <NotFoundView />;
}
