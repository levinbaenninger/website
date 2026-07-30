"use client";

import { useEffect, useRef } from "react";

/** Per-frame catch-up factors. The ring trails the dot, so motion reads as lag. */
const DOT_SMOOTHING = 0.2;
const RING_SMOOTHING = 0.1;

const INTERACTIVE_SELECTOR =
  "a, button, img, input, textarea, select, [role='button'], [contenteditable='true']";

const lerp = (from: number, to: number, factor: number) =>
  from + (to - from) * factor;

const noCleanup = () => {
  // The custom cursor never started, so there is nothing to tear down.
};

export const SmoothCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const ringShapeRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Touch has no cursor to replace, and the trail is motion a visitor may
    // have asked not to see.
    const canReplaceCursor =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canReplaceCursor) {
      return noCleanup;
    }

    const root = document.documentElement;
    root.dataset.customCursor = "true";

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const dot = { ...pointer };
    const ring = { ...pointer };
    let hasMoved = false;
    let frame = 0;

    const place = (element: HTMLDivElement | null, x: number, y: number) => {
      if (element) {
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (!hasMoved) {
        hasMoved = true;
        dot.x = pointer.x;
        dot.y = pointer.y;
        ring.x = pointer.x;
        ring.y = pointer.y;

        if (layerRef.current) {
          layerRef.current.style.opacity = "1";
        }
      }

      if (ringShapeRef.current) {
        // Delegated so it keeps working for anything rendered later.
        const isInteractive =
          event.target instanceof Element &&
          event.target.closest(INTERACTIVE_SELECTOR) !== null;

        ringShapeRef.current.dataset.hovering = String(isInteractive);
      }
    };

    const handlePointerLeave = () => {
      if (layerRef.current) {
        layerRef.current.style.opacity = "0";
      }
    };

    const handlePointerEnter = () => {
      if (layerRef.current && hasMoved) {
        layerRef.current.style.opacity = "1";
      }
    };

    const advance = () => {
      dot.x = lerp(dot.x, pointer.x, DOT_SMOOTHING);
      dot.y = lerp(dot.y, pointer.y, DOT_SMOOTHING);
      ring.x = lerp(ring.x, pointer.x, RING_SMOOTHING);
      ring.y = lerp(ring.y, pointer.y, RING_SMOOTHING);

      place(dotRef.current, dot.x, dot.y);
      place(ringRef.current, ring.x, ring.y);

      frame = window.requestAnimationFrame(advance);
    };

    frame = window.requestAnimationFrame(advance);
    document.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    document.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("pointerenter", handlePointerEnter);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("pointerenter", handlePointerEnter);
      delete root.dataset.customCursor;
    };
  }, []);

  return (
    <div
      ref={layerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-60 opacity-0 transition-opacity duration-200"
    >
      <div ref={dotRef} className="absolute top-0 left-0 will-change-transform">
        <div className="size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" />
      </div>

      <div
        ref={ringRef}
        className="absolute top-0 left-0 will-change-transform"
      >
        <div
          ref={ringShapeRef}
          className="size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground transition-[scale] duration-300 ease-out data-[hovering=true]:scale-[1.57]"
        />
      </div>
    </div>
  );
};
