export const isXml10CompatibleText = (value: string): boolean => {
  for (const character of value) {
    const codePoint = character.codePointAt(0);

    if (
      codePoint === 0x09 ||
      codePoint === 0x0a ||
      codePoint === 0x0d ||
      (codePoint !== undefined &&
        ((codePoint >= 0x20 && codePoint <= 0xd7_ff) ||
          (codePoint >= 0xe0_00 && codePoint <= 0xff_fd) ||
          (codePoint >= 0x1_00_00 && codePoint <= 0x10_ff_ff)))
    ) {
      continue;
    }

    return false;
  }

  return true;
};
