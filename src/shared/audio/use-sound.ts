"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { decodeAudioData, getAudioContext } from "./sound-engine";
import type {
  SoundAsset,
  UseSoundOptions,
  UseSoundReturn,
} from "./sound-types";

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
  const [playbackDuration, setPlaybackDuration] = useState<{
    uri: string;
    duration: number;
  } | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const bufferPromiseRef = useRef<Promise<AudioBuffer> | null>(null);
  const soundRef = useRef(sound);
  const stopOnUnmountRef = useRef(stopOnUnmount);

  const duration =
    playbackDuration?.uri === sound.dataUri
      ? playbackDuration.duration
      : (sound.duration ?? null);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    stopOnUnmountRef.current = stopOnUnmount;
  });

  useEffect(() => {
    bufferRef.current = null;
    bufferPromiseRef.current = null;
  }, [sound.dataUri]);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // stop() throws if the source has already ended.
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
        const currentSound = soundRef.current;

        if (ctx.state === "suspended") {
          await ctx.resume();
        }

        bufferPromiseRef.current ??= decodeAudioData(currentSound.dataUri);
        const buffer = await bufferPromiseRef.current;
        bufferRef.current = buffer;
        setPlaybackDuration({
          uri: currentSound.dataUri,
          duration: buffer.duration,
        });

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
    [soundEnabled, interrupt, stop, playbackRate, volume, onEnd, onPlay]
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
          // stop() throws if the source has already ended.
        }
      }
      sourceRef.current = null;
    },
    []
  );

  return [play, { stop, pause, isPlaying, duration, sound }] as const;
};
