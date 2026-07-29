const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((item: unknown) => typeof item === "string");

export const serializeCodeTabLabels = (labels: readonly string[]): string =>
  JSON.stringify(labels);

export const parseCodeTabLabels = (
  serializedLabels: string
): readonly string[] => {
  const labels: unknown = JSON.parse(serializedLabels);
  if (
    !isStringArray(labels) ||
    labels.length < 2 ||
    new Set(labels).size !== labels.length
  ) {
    throw new TypeError("Compiled CodeTabs labels are invalid.");
  }
  return labels;
};
