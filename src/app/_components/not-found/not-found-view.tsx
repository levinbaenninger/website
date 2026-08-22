"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { NotFoundPanel } from "./not-found-panel";

const unsubscribe = () => {
  // Hydration never reverts, so this store never notifies.
};
const subscribeToNothing = () => unsubscribe;
const onClient = () => true;
const onServer = () => false;

export const NotFoundView = () => {
  const pathname = usePathname();
  // Static 404 prerenders as `/_not-found`; the visited address is knowable
  // only after hydration.
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    onClient,
    onServer
  );

  return <NotFoundPanel path={isHydrated ? pathname : null} />;
};
