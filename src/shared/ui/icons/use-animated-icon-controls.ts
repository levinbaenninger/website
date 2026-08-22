"use client";

import { useAnimation } from "motion/react";
import type { MouseEvent, Ref } from "react";
import { useCallback, useImperativeHandle, useRef } from "react";

export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface UseAnimatedIconControlsOptions {
  onMouseEnter?: (event: MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLDivElement>) => void;
  ref: Ref<AnimatedIconHandle>;
}

const useAnimatedIconControls = ({
  onMouseEnter,
  onMouseLeave,
  ref,
}: UseAnimatedIconControlsOptions) => {
  const controls = useAnimation();
  const isControlledRef = useRef(false);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;

    return {
      startAnimation: () => {
        void controls.start("animate");
      },
      stopAnimation: () => {
        void controls.start("normal");
      },
    };
  }, [controls]);

  const handleMouseEnter = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (isControlledRef.current) {
        onMouseEnter?.(event);
      } else {
        void controls.start("animate");
      }
    },
    [controls, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (isControlledRef.current) {
        onMouseLeave?.(event);
      } else {
        void controls.start("normal");
      }
    },
    [controls, onMouseLeave]
  );

  return {
    controls,
    handleMouseEnter,
    handleMouseLeave,
    isControlledRef,
  };
};

export { useAnimatedIconControls };
