"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { decodeAudioData, getAudioContext } from "./sound-engine";
import type {
  SoundAsset,
  UseSoundOptions,
  UseSoundReturn,
} from "./sound-types";

const stopAudioNode = (source: AudioBufferSourceNode | null): void => {
  if (source === null) {
    return;
  }
  try {
    source.stop();
  } catch {
    // stop() throws if the source has already ended.
  }
};

const startDecodedPlayback = async ({
  bufferPromiseRef,
  bufferRef,
  gainRef,
  onEnd,
  onPlay,
  overrides,
  playbackRate,
  setIsPlaying,
  setPlaybackDuration,
  soundRef,
  sourceRef,
  volume,
}: {
  bufferPromiseRef: RefObject<Promise<AudioBuffer> | null>;
  bufferRef: RefObject<AudioBuffer | null>;
  gainRef: RefObject<GainNode | null>;
  onEnd?: () => void;
  onPlay?: () => void;
  overrides?: { volume?: number; playbackRate?: number };
  playbackRate: number;
  setIsPlaying: (value: boolean) => void;
  setPlaybackDuration: (value: { uri: string; duration: number }) => void;
  soundRef: RefObject<SoundAsset>;
  sourceRef: RefObject<AudioBufferSourceNode | null>;
  volume: number;
}): Promise<void> => {
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
};

const useSoundTransport = ({
  bufferPromiseRef,
  bufferRef,
  gainRef,
  interrupt,
  onEnd,
  onPause,
  onPlay,
  onStop,
  playbackRate,
  setIsPlaying,
  setPlaybackDuration,
  soundEnabled,
  soundRef,
  sourceRef,
  volume,
}: {
  bufferPromiseRef: RefObject<Promise<AudioBuffer> | null>;
  bufferRef: RefObject<AudioBuffer | null>;
  gainRef: RefObject<GainNode | null>;
  interrupt: boolean;
  onEnd?: () => void;
  onPause?: () => void;
  onPlay?: () => void;
  onStop?: () => void;
  playbackRate: number;
  setIsPlaying: (value: boolean) => void;
  setPlaybackDuration: (value: { uri: string; duration: number }) => void;
  soundEnabled: boolean;
  soundRef: RefObject<SoundAsset>;
  sourceRef: RefObject<AudioBufferSourceNode | null>;
  volume: number;
}) => {
  const stop = useCallback(() => {
    stopAudioNode(sourceRef.current);
    sourceRef.current = null;
    setIsPlaying(false);
    onStop?.();
  }, [onStop, setIsPlaying, sourceRef]);

  const play = useCallback(
    (overrides?: { volume?: number; playbackRate?: number }) => {
      if (!soundEnabled) {
        return;
      }
      if (interrupt && sourceRef.current) {
        stop();
      }
      void startDecodedPlayback({
        bufferPromiseRef,
        bufferRef,
        gainRef,
        onEnd,
        onPlay,
        overrides,
        playbackRate,
        setIsPlaying,
        setPlaybackDuration,
        soundRef,
        sourceRef,
        volume,
      });
    },
    [
      bufferPromiseRef,
      bufferRef,
      gainRef,
      interrupt,
      onEnd,
      onPlay,
      playbackRate,
      setIsPlaying,
      setPlaybackDuration,
      soundEnabled,
      soundRef,
      sourceRef,
      stop,
      volume,
    ]
  );

  const pause = useCallback(() => {
    stop();
    onPause?.();
  }, [onPause, stop]);

  return { pause, play, stop };
};

const useSoundLifecycle = ({
  bufferPromiseRef,
  bufferRef,
  gainRef,
  sound,
  soundRef,
  sourceRef,
  stopOnUnmount,
  stopOnUnmountRef,
  volume,
}: {
  bufferPromiseRef: RefObject<Promise<AudioBuffer> | null>;
  bufferRef: RefObject<AudioBuffer | null>;
  gainRef: RefObject<GainNode | null>;
  sound: SoundAsset;
  soundRef: RefObject<SoundAsset>;
  sourceRef: RefObject<AudioBufferSourceNode | null>;
  stopOnUnmount: boolean;
  stopOnUnmountRef: RefObject<boolean>;
  volume: number;
}) => {
  useEffect(() => {
    soundRef.current = sound;
  }, [sound, soundRef]);

  useEffect(() => {
    stopOnUnmountRef.current = stopOnUnmount;
  });

  useEffect(() => {
    bufferRef.current = null;
    bufferPromiseRef.current = null;
  }, [bufferPromiseRef, bufferRef, sound.dataUri]);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [gainRef, volume]);

  useEffect(
    () => () => {
      if (stopOnUnmountRef.current) {
        stopAudioNode(sourceRef.current);
      }
      sourceRef.current = null;
    },
    [sourceRef, stopOnUnmountRef]
  );
};

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

  const { pause, play, stop } = useSoundTransport({
    bufferPromiseRef,
    bufferRef,
    gainRef,
    interrupt,
    onEnd,
    onPause,
    onPlay,
    onStop,
    playbackRate,
    setIsPlaying,
    setPlaybackDuration,
    soundEnabled,
    soundRef,
    sourceRef,
    volume,
  });

  useSoundLifecycle({
    bufferPromiseRef,
    bufferRef,
    gainRef,
    sound,
    soundRef,
    sourceRef,
    stopOnUnmount,
    stopOnUnmountRef,
    volume,
  });

  return [play, { stop, pause, isPlaying, duration, sound }] as const;
};
