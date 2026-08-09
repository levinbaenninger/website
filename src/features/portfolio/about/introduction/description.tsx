"use client";

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

export const IntroductionDescription = ({
  introductions,
}: {
  introductions: readonly string[];
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer =
      isInView && shouldReduceMotion !== true
        ? window.setInterval(() => {
            setCurrentIndex((index) => (index + 1) % introductions.length);
          }, 3000)
        : null;

    return () => {
      if (timer !== null) {
        window.clearInterval(timer);
      }
    };
  }, [introductions.length, isInView, shouldReduceMotion]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden border-t border-line p-2 ps-4 font-mono text-xs text-muted-foreground sm:text-sm"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.p
          key={currentIndex}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {introductions[currentIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};
