"use client";

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

const INTRODUCTIONS = [
  "Building useful things for the web.",
  "Writing down what I learn.",
  "Collecting ideas worth keeping.",
] as const;

export const IntroductionDescription = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer =
      isInView && shouldReduceMotion !== true
        ? window.setInterval(() => {
            setCurrentIndex((index) => (index + 1) % INTRODUCTIONS.length);
          }, 3000)
        : null;

    return () => {
      if (timer !== null) {
        window.clearInterval(timer);
      }
    };
  }, [isInView, shouldReduceMotion]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden font-mono text-xs text-muted-foreground p-2 sm:text-sm border-t border-line ps-4"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.p
          key={currentIndex}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {INTRODUCTIONS[currentIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};
