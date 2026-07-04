"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { decodeAudioData, getAudioContext } from "@/sounds/sound-engine";
import type {
  SoundAsset,
  UseSoundOptions,
  UseSoundReturn,
} from "@/sounds/sound-types";

export const useSound = (
  sound: SoundAsset,
  options: UseSoundOptions = {}
): UseSoundReturn => {
  const {
    volume = 0.5,
    playbackRate = 1,
    interrupt = false,
    soundEnabled = true,
    stopOnUnmount = true,
    onPlay,
    onEnd,
    onPause,
    onStop,
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(
    sound.duration ?? null
  );
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const bufferPromiseRef = useRef<Promise<AudioBuffer> | null>(null);
  const stopOnUnmountRef = useRef(stopOnUnmount);

  useEffect(() => {
    stopOnUnmountRef.current = stopOnUnmount;
  });

  useEffect(() => {
    bufferRef.current = null;
    bufferPromiseRef.current = null;
    setDuration(sound.duration ?? null);
  }, [sound.dataUri, sound.duration]);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // Already stopped
      }
      sourceRef.current = null;
    }
    setIsPlaying(false);
    onStop?.();
  }, [onStop]);

  const play = useCallback(
    (overrides?: { volume?: number; playbackRate?: number }) => {
      if (!soundEnabled) {
        return;
      }

      if (interrupt && sourceRef.current) {
        stop();
      }

      void (async () => {
        const ctx = getAudioContext();

        if (ctx.state === "suspended") {
          await ctx.resume();
        }

        bufferPromiseRef.current ??= decodeAudioData(sound.dataUri);
        const buffer = await bufferPromiseRef.current;
        bufferRef.current = buffer;
        setDuration(buffer.duration);

        const source = ctx.createBufferSource();
        const gain = ctx.createGain();

        source.buffer = buffer;
        source.playbackRate.value = overrides?.playbackRate ?? playbackRate;
        gain.gain.value = overrides?.volume ?? volume;

        source.connect(gain);
        gain.connect(ctx.destination);

        source.addEventListener("ended", () => {
          setIsPlaying(false);
          onEnd?.();
        });

        source.start(0);
        sourceRef.current = source;
        gainRef.current = gain;
        setIsPlaying(true);
        onPlay?.();
      })();
    },
    [
      soundEnabled,
      interrupt,
      stop,
      sound.dataUri,
      playbackRate,
      volume,
      onEnd,
      onPlay,
    ]
  );

  const pause = useCallback(() => {
    stop();
    onPause?.();
  }, [stop, onPause]);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  useEffect(
    () => () => {
      if (stopOnUnmountRef.current && sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {
          // Already stopped
        }
      }
      sourceRef.current = null;
    },
    []
  );

  return [play, { stop, pause, isPlaying, duration, sound }] as const;
};
