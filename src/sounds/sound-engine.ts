let audioContext: AudioContext | null = null;
const bufferCache = new Map<string, AudioBuffer>();

export const getAudioContext = (): AudioContext => {
  audioContext ??= new AudioContext();
  return audioContext;
};

export const decodeAudioData = async (
  dataUri: string
): Promise<AudioBuffer> => {
  const cached = bufferCache.get(dataUri);
  if (cached) {
    return cached;
  }

  const ctx = getAudioContext();
  const [, base64] = dataUri.split(",");
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.codePointAt(i) ?? 0;
  }

  const audioBuffer = await ctx.decodeAudioData(new Uint8Array(bytes).buffer);
  bufferCache.set(dataUri, audioBuffer);
  return audioBuffer;
};

export interface PlaySoundOptions {
  volume?: number;
  playbackRate?: number;
  onEnd?: () => void;
}

export interface SoundPlayback {
  stop: () => void;
}

export const playSound = async (
  dataUri: string,
  options: PlaySoundOptions = {}
): Promise<SoundPlayback> => {
  const { volume = 1, playbackRate = 1, onEnd } = options;
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  const buffer = await decodeAudioData(dataUri);
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();

  source.buffer = buffer;
  source.playbackRate.value = playbackRate;
  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(ctx.destination);

  source.addEventListener("ended", () => {
    onEnd?.();
  });

  source.start(0);

  return {
    stop: () => {
      try {
        source.stop();
      } catch {
        // No-op if already stopped.
      }
    },
  };
};
