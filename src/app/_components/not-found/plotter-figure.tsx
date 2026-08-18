"use client";

import type { AnimationPlaybackControls, MotionValue } from "motion/react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";

import { metalLatchSound } from "@/shared/audio/sounds/metal-latch";
import { tick002Sound } from "@/shared/audio/sounds/tick-002";
import { useSound } from "@/shared/audio/use-sound";

import type { PlotterStroke } from "./digits";
import { PEN_PARK_POINT, PLOT_STROKES, PLOT_VIEWBOX } from "./digits";

const PLOT_DRAW_MS = 1400;
const PEN_UP_MS = 80;
const PLOT_TOTAL_MS = PLOT_DRAW_MS + PEN_UP_MS * (PLOT_STROKES.length - 1);
const INK_FADE_S = 0.12;
const RE_INK_S = 0.22;

const TICK_PLAYBACK_RATES = [1, 1.09, 0.94, 1.05, 0.97, 1.12] as const;
const TICK_VOLUME = 0.3;
const LATCH_VOLUME = 0.45;

const POINTER_SPRING = { stiffness: 300, damping: 30, mass: 0.1 } as const;

const INK_STROKE_WIDTH = 10;

interface PlotPass extends PlotterStroke {
  start: number;
  end: number;
}

const createPlotPasses = (): readonly PlotPass[] => {
  const totalLength = PLOT_STROKES.reduce(
    (sum, stroke) => sum + stroke.length,
    0
  );
  let elapsed = 0;

  return PLOT_STROKES.map((stroke, index) => {
    const start = elapsed + (index > 0 ? PEN_UP_MS : 0);
    const end = start + (stroke.length / totalLength) * PLOT_DRAW_MS;
    elapsed = end;

    return {
      ...stroke,
      start: start / PLOT_TOTAL_MS,
      end: end / PLOT_TOTAL_MS,
    };
  });
};

const PLOT_PASSES = createPlotPasses();

interface PenPoint {
  x: number;
  y: number;
}

const pointOnPass = (
  path: SVGPathElement,
  distance: number,
  pass: PlotPass
): PenPoint => {
  const point = path.getPointAtLength(distance);

  return { x: point.x + pass.offsetX, y: point.y + pass.offsetY };
};

const lerp = (from: number, to: number, ratio: number) =>
  from + (to - from) * ratio;

const traversePoint = (
  progress: number,
  from: { pass: PlotPass; path: SVGPathElement },
  to: { pass: PlotPass; path: SVGPathElement }
): PenPoint => {
  const origin = pointOnPass(from.path, from.path.getTotalLength(), from.pass);
  const target = pointOnPass(to.path, 0, to.pass);
  const ratio = (progress - from.pass.end) / (to.pass.start - from.pass.end);

  return {
    x: lerp(origin.x, target.x, ratio),
    y: lerp(origin.y, target.y, ratio),
  };
};

/** `null` when SVG paths have no measurable geometry (non-browser). */
const resolvePenPoint = (
  paths: readonly (SVGPathElement | null | undefined)[],
  progress: number
): PenPoint | null => {
  let previous: { pass: PlotPass; path: SVGPathElement } | null = null;

  for (const [index, pass] of PLOT_PASSES.entries()) {
    const path = paths[index];

    if (!path || path.getTotalLength() <= 0) {
      return null;
    }

    if (progress < pass.start) {
      return previous
        ? traversePoint(progress, previous, { pass, path })
        : pointOnPass(path, 0, pass);
    }

    if (progress <= pass.end) {
      const ratio = (progress - pass.start) / (pass.end - pass.start);

      return pointOnPass(path, ratio * path.getTotalLength(), pass);
    }

    previous = { pass, path };
  }

  return previous
    ? pointOnPass(previous.path, previous.path.getTotalLength(), previous.pass)
    : null;
};

const PlotterPass = ({
  onMount,
  pass,
  plotProgress,
}: {
  onMount: (path: SVGPathElement | null) => void;
  pass: PlotPass;
  plotProgress: MotionValue<number>;
}) => {
  const pathLength = useTransform(plotProgress, [pass.start, pass.end], [0, 1]);
  // A round cap on a zero-length dash paints a dot, so hide until the pen reaches it.
  const opacity = useTransform(plotProgress, (progress) =>
    progress > pass.start ? 1 : 0
  );

  return (
    <motion.path
      ref={onMount}
      className="stroke-foreground"
      d={pass.d}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={INK_STROKE_WIDTH}
      style={{ opacity, pathLength }}
      transform={`translate(${pass.offsetX} ${pass.offsetY})`}
    />
  );
};

const playDuePlotTicks = (
  progress: number,
  ticksPlayedRef: RefObject<number>,
  playTick: (options: { playbackRate: number }) => void
): void => {
  const due = PLOT_PASSES.filter((pass) => progress >= pass.start).length;

  while (ticksPlayedRef.current < due) {
    const rate =
      TICK_PLAYBACK_RATES[ticksPlayedRef.current % TICK_PLAYBACK_RATES.length];

    playTick({ playbackRate: rate });
    ticksPlayedRef.current += 1;
  }
};

const startPlotOrReInk = (
  shouldReduceMotion: boolean,
  isAudible: boolean,
  runPlot: (isAudible: boolean) => void,
  runReInk: (isAudible: boolean) => void
): void => {
  if (shouldReduceMotion) {
    runReInk(isAudible);
    return;
  }

  runPlot(isAudible);
};

const usePlotterInkControls = ({
  pathsRef,
  penX,
  penY,
  plotOpacity,
  plotProgress,
}: {
  pathsRef: RefObject<(SVGPathElement | null)[]>;
  penX: MotionValue<number>;
  penY: MotionValue<number>;
  plotOpacity: MotionValue<number>;
  plotProgress: MotionValue<number>;
}) => {
  const plotRef = useRef<AnimationPlaybackControls | null>(null);
  const isPlottingRef = useRef(false);
  const isAudibleRef = useRef(false);
  const ticksPlayedRef = useRef(0);

  const [playTick] = useSound(tick002Sound, { volume: TICK_VOLUME });
  const [playLatch] = useSound(metalLatchSound, { volume: LATCH_VOLUME });

  const penOpacity = useMotionValue(0);
  const pointerX = useMotionValue(PEN_PARK_POINT.x);
  const pointerY = useMotionValue(PEN_PARK_POINT.y);
  const trackedX = useSpring(pointerX, POINTER_SPRING);
  const trackedY = useSpring(pointerY, POINTER_SPRING);

  const movePenTo = useCallback(
    (progress: number) => {
      const point = resolvePenPoint(pathsRef.current, progress);

      if (point) {
        penX.set(point.x);
        penY.set(point.y);
      }
    },
    [pathsRef, penX, penY]
  );

  const parkPen = useCallback(() => {
    isPlottingRef.current = false;
    plotRef.current = null;
    animate(penOpacity, 0, { duration: 0.25, ease: "easeOut" });
    penX.set(PEN_PARK_POINT.x);
    penY.set(PEN_PARK_POINT.y);
    pointerX.jump(PEN_PARK_POINT.x);
    pointerY.jump(PEN_PARK_POINT.y);
    trackedX.jump(PEN_PARK_POINT.x);
    trackedY.jump(PEN_PARK_POINT.y);
  }, [penOpacity, penX, penY, pointerX, pointerY, trackedX, trackedY]);

  const runPlot = useCallback(
    (isAudible: boolean) => {
      plotRef.current?.stop();
      isPlottingRef.current = true;
      isAudibleRef.current = isAudible;
      ticksPlayedRef.current = 0;
      plotProgress.jump(0);
      penOpacity.jump(1);
      movePenTo(0);
      animate(plotOpacity, 1, { duration: INK_FADE_S, ease: "easeOut" });
      plotRef.current = animate(plotProgress, 1, {
        duration: PLOT_TOTAL_MS / 1000,
        ease: "linear",
        onComplete: () => {
          parkPen();

          if (isAudible) {
            playLatch();
          }
        },
      });
    },
    [movePenTo, parkPen, penOpacity, playLatch, plotOpacity, plotProgress]
  );

  const runReInk = useCallback(
    (isAudible: boolean) => {
      plotRef.current?.stop();
      isAudibleRef.current = false;
      plotProgress.jump(1);
      plotOpacity.jump(0);
      parkPen();
      animate(plotOpacity, 1, { duration: RE_INK_S, ease: "easeOut" });

      if (isAudible) {
        playLatch();
      }
    },
    [parkPen, playLatch, plotOpacity, plotProgress]
  );

  return {
    isAudibleRef,
    isPlottingRef,
    movePenTo,
    parkPen,
    penOpacity,
    playTick,
    plotRef,
    pointerX,
    pointerY,
    runPlot,
    runReInk,
    ticksPlayedRef,
    trackedX,
    trackedY,
  };
};

const usePlotterProgressTicks = ({
  isAudibleRef,
  isPlottingRef,
  movePenTo,
  playTick,
  plotProgress,
  ticksPlayedRef,
}: {
  isAudibleRef: RefObject<boolean>;
  isPlottingRef: RefObject<boolean>;
  movePenTo: (progress: number) => void;
  playTick: (options: { playbackRate: number }) => void;
  plotProgress: MotionValue<number>;
  ticksPlayedRef: RefObject<number>;
}) => {
  useEffect(
    () =>
      plotProgress.on("change", (progress) => {
        if (!isPlottingRef.current) {
          return;
        }

        movePenTo(progress);

        if (!isAudibleRef.current) {
          return;
        }

        playDuePlotTicks(progress, ticksPlayedRef, playTick);
      }),
    [
      isAudibleRef,
      isPlottingRef,
      movePenTo,
      playTick,
      plotProgress,
      ticksPlayedRef,
    ]
  );
};

const useAutoPlotOnView = ({
  isInView,
  runPlot,
  runReInk,
  shouldReduceMotion,
}: {
  isInView: boolean;
  runPlot: (isAudible: boolean) => void;
  runReInk: (isAudible: boolean) => void;
  shouldReduceMotion: boolean | null;
}) => {
  const hasAutoPlottedRef = useRef(false);

  useEffect(() => {
    if (hasAutoPlottedRef.current || !isInView || shouldReduceMotion === null) {
      return;
    }

    hasAutoPlottedRef.current = true;

    // Sticky userActivation after a clicked dead link; a typed address has none
    // and playback would be rejected.
    startPlotOrReInk(
      shouldReduceMotion,

      navigator.userActivation?.hasBeenActive,
      runPlot,
      runReInk
    );
  }, [isInView, runPlot, runReInk, shouldReduceMotion]);
};

const useReplayOnPlotToken = ({
  plotToken,
  runPlot,
  runReInk,
  shouldReduceMotion,
}: {
  plotToken: number;
  runPlot: (isAudible: boolean) => void;
  runReInk: (isAudible: boolean) => void;
  shouldReduceMotion: boolean | null;
}) => {
  const handledTokenRef = useRef(0);

  useEffect(() => {
    if (plotToken === handledTokenRef.current) {
      return;
    }

    handledTokenRef.current = plotToken;
    startPlotOrReInk(shouldReduceMotion === true, true, runPlot, runReInk);
  }, [plotToken, runPlot, runReInk, shouldReduceMotion]);
};

const useStopPlotOnUnmount = (
  plotRef: RefObject<AnimationPlaybackControls | null>
) => {
  useEffect(
    () => () => {
      plotRef.current?.stop();
    },
    [plotRef]
  );
};

const usePlotterPlayback = ({
  isInView,
  pathsRef,
  penX,
  penY,
  plotOpacity,
  plotProgress,
  plotToken,
  shouldReduceMotion,
}: {
  isInView: boolean;
  pathsRef: RefObject<(SVGPathElement | null)[]>;
  penX: MotionValue<number>;
  penY: MotionValue<number>;
  plotOpacity: MotionValue<number>;
  plotProgress: MotionValue<number>;
  plotToken: number;
  shouldReduceMotion: boolean | null;
}) => {
  const controls = usePlotterInkControls({
    pathsRef,
    penX,
    penY,
    plotOpacity,
    plotProgress,
  });

  usePlotterProgressTicks({
    isAudibleRef: controls.isAudibleRef,
    isPlottingRef: controls.isPlottingRef,
    movePenTo: controls.movePenTo,
    playTick: controls.playTick,
    plotProgress,
    ticksPlayedRef: controls.ticksPlayedRef,
  });
  useAutoPlotOnView({
    isInView,
    runPlot: controls.runPlot,
    runReInk: controls.runReInk,
    shouldReduceMotion,
  });
  useReplayOnPlotToken({
    plotToken,
    runPlot: controls.runPlot,
    runReInk: controls.runReInk,
    shouldReduceMotion,
  });
  useStopPlotOnUnmount(controls.plotRef);

  return {
    isPlottingRef: controls.isPlottingRef,
    penOpacity: controls.penOpacity,
    pointerX: controls.pointerX,
    pointerY: controls.pointerY,
    trackedX: controls.trackedX,
    trackedY: controls.trackedY,
  };
};

const usePlotterPointer = ({
  isInView,
  isPlottingRef,
  penX,
  penY,
  pointerX,
  pointerY,
  shouldReduceMotion,
  svgRef,
  trackedX,
  trackedY,
}: {
  isInView: boolean;
  isPlottingRef: RefObject<boolean>;
  penX: MotionValue<number>;
  penY: MotionValue<number>;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  shouldReduceMotion: boolean | null;
  svgRef: RefObject<SVGSVGElement | null>;
  trackedX: MotionValue<number>;
  trackedY: MotionValue<number>;
}) => {
  useEffect(() => {
    const followPointer = (value: number, target: MotionValue<number>) => {
      if (!isPlottingRef.current) {
        target.set(value);
      }
    };
    const unsubscribe = [
      trackedX.on("change", (value) => {
        followPointer(value, penX);
      }),
      trackedY.on("change", (value) => {
        followPointer(value, penY);
      }),
    ];

    return () => {
      for (const stop of unsubscribe) {
        stop();
      }
    };
  }, [isPlottingRef, penX, penY, trackedX, trackedY]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const bounds = svgRef.current?.getBoundingClientRect();

      if (!bounds || bounds.width === 0 || bounds.height === 0) {
        return;
      }

      pointerX.set(
        ((event.clientX - bounds.left) / bounds.width) * PLOT_VIEWBOX.width
      );
      pointerY.set(
        ((event.clientY - bounds.top) / bounds.height) * PLOT_VIEWBOX.height
      );
    };

    const canTrackPointer =
      shouldReduceMotion === false &&
      isInView &&
      !window.matchMedia("(hover: none)").matches;

    if (canTrackPointer) {
      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [isInView, pointerX, pointerY, shouldReduceMotion, svgRef]);
};

export const PlotterFigure = ({
  penX,
  penY,
  plotToken,
}: {
  penX: MotionValue<number>;
  penY: MotionValue<number>;
  plotToken: number;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathsRef = useRef<(SVGPathElement | null)[]>([]);

  const shouldReduceMotion = useReducedMotion();
  const isInView = useInView(svgRef, { margin: "80px" });

  const plotProgress = useMotionValue(0);
  const plotOpacity = useMotionValue(0);

  const { isPlottingRef, penOpacity, pointerX, pointerY, trackedX, trackedY } =
    usePlotterPlayback({
      isInView,
      pathsRef,
      penX,
      penY,
      plotOpacity,
      plotProgress,
      plotToken,
      shouldReduceMotion,
    });

  usePlotterPointer({
    isInView,
    isPlottingRef,
    penX,
    penY,
    pointerX,
    pointerY,
    shouldReduceMotion,
    svgRef,
    trackedX,
    trackedY,
  });

  return (
    <motion.svg
      ref={svgRef}
      aria-hidden
      className="block h-auto w-full"
      fill="none"
      style={{ opacity: plotOpacity }}
      viewBox={`0 0 ${PLOT_VIEWBOX.width} ${PLOT_VIEWBOX.height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {PLOT_PASSES.map((pass, index) => (
        <PlotterPass
          key={`${pass.offsetX}-${pass.d}`}
          onMount={(path) => {
            pathsRef.current[index] = path;
          }}
          pass={pass}
          plotProgress={plotProgress}
        />
      ))}

      <motion.g
        className="stroke-foreground/40"
        style={{ opacity: penOpacity, x: penX, y: penY }}
      >
        <circle r="7" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path
          d="M-18 0h11M7 0h11M0 -18v11M0 7v11"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>
    </motion.svg>
  );
};
