"use client";

import type { Transition } from "motion/react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useEffect, useId, useRef } from "react";

import {
  BRAND_MARK_OUTLINE_PATH,
  BRAND_MARK_PATH,
} from "@/app/_shell/branding/brand-mark-path";
import { metalClickSound } from "@/shared/audio/sounds/metal-click";
import { useSound } from "@/shared/audio/use-sound";

const VIEWBOX_WIDTH = 555;
const VIEWBOX_HEIGHT = 344;
const ISOMETRIC_X_SCALE = 0.72;
const ISOMETRIC_Y_SCALE = 0.416;
const ISOMETRIC_X_OFFSET = 1;
const ISOMETRIC_Y_OFFSET = 214;
const EXTRUSION_DEPTH = 22;
const ISOMETRIC_TRANSFORM = `matrix(${ISOMETRIC_X_SCALE} -${ISOMETRIC_Y_SCALE} ${ISOMETRIC_X_SCALE} ${ISOMETRIC_Y_SCALE} ${ISOMETRIC_X_OFFSET} ${ISOMETRIC_Y_OFFSET})`;
const GUIDE_TRANSFORM = `matrix(${ISOMETRIC_X_SCALE} -${ISOMETRIC_Y_SCALE} ${ISOMETRIC_X_SCALE} ${ISOMETRIC_Y_SCALE} ${ISOMETRIC_X_OFFSET} ${ISOMETRIC_Y_OFFSET + EXTRUSION_DEPTH})`;
const PRESSED_OFFSET = 12;
const VISIBLE_SIDE_EDGES = [
  [
    [0, 0],
    [0, 256],
  ],
  [
    [0, 256],
    [192, 256],
  ],
  [
    [256, 0],
    [256, 256],
  ],
  [
    [320, 51],
    [448, 51],
  ],
  [
    [448, 51],
    [448, 102],
  ],
  [
    [448, 102],
    [512, 102],
  ],
  [
    [320, 154],
    [448, 154],
  ],
  [
    [448, 154],
    [448, 205],
  ],
  [
    [448, 205],
    [512, 205],
  ],
  [
    [256, 256],
    [448, 256],
  ],
] as const;

const formatCoordinate = (value: number) => Math.round(value * 100) / 100;

const projectPoint = ([x, y]: readonly [number, number]) => ({
  x: formatCoordinate(
    ISOMETRIC_X_SCALE * x + ISOMETRIC_X_SCALE * y + ISOMETRIC_X_OFFSET
  ),
  y: formatCoordinate(
    -ISOMETRIC_Y_SCALE * x + ISOMETRIC_Y_SCALE * y + ISOMETRIC_Y_OFFSET
  ),
});

const createSideFacesPath = (topOffset: number) =>
  VISIBLE_SIDE_EDGES.map(([start, end]) => {
    const startPoint = projectPoint(start);
    const endPoint = projectPoint(end);

    return [
      `M${startPoint.x} ${formatCoordinate(startPoint.y + topOffset)}`,
      `L${endPoint.x} ${formatCoordinate(endPoint.y + topOffset)}`,
      `L${endPoint.x} ${formatCoordinate(endPoint.y + EXTRUSION_DEPTH)}`,
      `L${startPoint.x} ${formatCoordinate(startPoint.y + EXTRUSION_DEPTH)}Z`,
    ].join("");
  }).join("");

const sideFaces = {
  normal: createSideFacesPath(0),
  pressed: createSideFacesPath(PRESSED_OFFSET),
};

const transition: Transition = {
  type: "spring",
  mass: 0.5,
  damping: 18,
  stiffness: 200,
};

export const SpotlightLogo = () => {
  const id = useId();
  const ids = {
    mark: `spotlight-logo-mark-${id}`,
    outline: `spotlight-logo-outline-${id}`,
    pattern: `spotlight-logo-pattern-${id}`,
    radialGradient: `spotlight-logo-radial-gradient-${id}`,
  };
  const ref = useRef<SVGSVGElement>(null);
  const [play] = useSound(metalClickSound);
  const shouldReduceMotion = useReducedMotion();
  const isInView = useInView(ref, { margin: "80px" });
  const pointerX = useMotionValue(256);
  const pointerY = useMotionValue(128);
  const cx = useSpring(pointerX, {
    stiffness: 300,
    damping: 30,
    mass: 0.1,
  });
  const cy = useSpring(pointerY, {
    stiffness: 300,
    damping: 30,
    mass: 0.1,
  });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const bounds = ref.current?.getBoundingClientRect();

      if (!bounds) {
        return;
      }

      const viewBoxX =
        ((event.clientX - bounds.left) / bounds.width) * VIEWBOX_WIDTH;
      const viewBoxY =
        ((event.clientY - bounds.top) / bounds.height) * VIEWBOX_HEIGHT;
      const isometricX = viewBoxX - ISOMETRIC_X_OFFSET;
      const isometricY = viewBoxY - ISOMETRIC_Y_OFFSET;

      pointerX.set(
        (isometricX / ISOMETRIC_X_SCALE - isometricY / ISOMETRIC_Y_SCALE) / 2
      );
      pointerY.set(
        (isometricX / ISOMETRIC_X_SCALE + isometricY / ISOMETRIC_Y_SCALE) / 2
      );
    };

    const canTrackPointer =
      shouldReduceMotion !== true &&
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
  }, [isInView, pointerX, pointerY, shouldReduceMotion]);

  return (
    <div className="relative w-full">
      <svg
        className="pointer-events-none absolute inset-0 -z-1 h-auto w-full overflow-visible"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <g
          transform={GUIDE_TRANSFORM}
          stroke="var(--line)"
          strokeWidth="1"
          strokeDasharray="4 2"
        >
          <path d="M0 -2048V2048" vectorEffect="non-scaling-stroke" />
          <path d="M256 -2048V2048" vectorEffect="non-scaling-stroke" />
          <path d="M-2048 256H2048" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>

      <motion.svg
        ref={ref}
        className="block h-auto w-full touch-manipulation cursor-pointer [--pattern:color-mix(in_oklab,var(--foreground)_12%,var(--background))] [--stroke:color-mix(in_oklab,var(--foreground)_18%,var(--background))]"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        initial="normal"
        whileTap={shouldReduceMotion === true ? undefined : "pressed"}
        onTap={() => {
          play();
        }}
      >
        <defs>
          <path id={ids.mark} d={BRAND_MARK_PATH} />
          <path id={ids.outline} d={BRAND_MARK_OUTLINE_PATH} />

          <pattern
            id={ids.pattern}
            x="0"
            y="0"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M-1 1l2-2M0 10 10 0M9 11l2-2"
              stroke="var(--pattern)"
              strokeWidth="1"
            />
          </pattern>

          <motion.radialGradient
            id={ids.radialGradient}
            cx={cx}
            cy={cy}
            r="184"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              className="dark:[stop-color:#fff]"
              stopColor="var(--color-zinc-700)"
            />
            <stop
              className="dark:[stop-color:var(--color-zinc-600)]"
              offset="1"
              stopColor="var(--color-zinc-400)"
              stopOpacity="0"
            />
          </motion.radialGradient>
        </defs>

        <motion.path
          variants={{
            normal: { d: sideFaces.normal },
            pressed: { d: sideFaces.pressed },
          }}
          transition={transition}
          className="fill-background"
          stroke="var(--stroke)"
        />

        <motion.g
          variants={{
            normal: { transform: "translateY(0px)" },
            pressed: { transform: `translateY(${PRESSED_OFFSET}px)` },
          }}
          transition={transition}
        >
          <g transform={ISOMETRIC_TRANSFORM}>
            <use href={`#${ids.mark}`} className="fill-background" />
            <use href={`#${ids.mark}`} fill={`url(#${ids.pattern})`} />
            <use href={`#${ids.outline}`} stroke="var(--stroke)" />
            <use
              href={`#${ids.outline}`}
              stroke={`url(#${ids.radialGradient})`}
            />
          </g>
        </motion.g>
      </motion.svg>
    </div>
  );
};
