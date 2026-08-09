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
