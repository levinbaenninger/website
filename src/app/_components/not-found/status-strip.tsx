"use client";

import type { MotionValue } from "motion/react";
import { motion, useTransform } from "motion/react";

import { Button } from "@/shared/ui/button";

const Coordinate = ({
  axis,
  value,
}: {
  axis: string;
  value: MotionValue<number>;
}) => {
  const readout = useTransform(value, (position) => position.toFixed(1));

  return (
    <span className="inline-flex gap-1">
      {axis}:
      <motion.span
        // fallow-ignore-next-line css-token-drift
        className="inline-block w-[5ch] text-right text-foreground"
      >
        {readout}
      </motion.span>
    </span>
  );
};

export const StatusStrip = ({
  onReplot,
  path,
  penX,
  penY,
}: {
  onReplot: () => void;
  path: string;
  penX: MotionValue<number>;
  penY: MotionValue<number>;
}) => (
  <div className="screen-line-bottom flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 font-mono text-xs text-muted-foreground">
    <span className="inline-flex min-w-0 gap-1">
      PATH:
      <span className="truncate text-foreground">{path}</span>
    </span>

    <span aria-hidden className="inline-flex gap-4 select-none">
      <Coordinate axis="X" value={penX} />
      <Coordinate axis="Y" value={penY} />
    </span>

    <Button
      className="font-mono text-xs"
      onClick={onReplot}
      size="xs"
      variant="outline"
    >
      [ REPLOT ]
    </Button>
  </div>
);
