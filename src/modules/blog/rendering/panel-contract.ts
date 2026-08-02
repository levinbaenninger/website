export interface ArticleAccordionPanel {
  readonly defaultOpen: boolean;
  readonly label: string;
  readonly value: string;
}

export interface ArticleTabPanel {
  readonly iconSlot?: string;
  readonly label: string;
  readonly value: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOnlyKeys = (
  value: Record<string, unknown>,
  keys: ReadonlySet<string>
): boolean => Object.keys(value).every((key) => keys.has(key));

const hasUniqueValues = (
  panels: readonly { readonly value: string }[]
): boolean => new Set(panels.map(({ value }) => value)).size === panels.length;

const accordionKeys = new Set(["defaultOpen", "label", "value"]);
const tabKeys = new Set(["iconSlot", "label", "value"]);

export const serializeArticlePanels = (
  panels: readonly (ArticleAccordionPanel | ArticleTabPanel)[]
): string => JSON.stringify(panels);

export const parseArticleAccordionPanels = (
  serializedPanels: string
): readonly ArticleAccordionPanel[] => {
  const panels: unknown = JSON.parse(serializedPanels);
  if (
    !Array.isArray(panels) ||
    panels.length < 1 ||
    !panels.every(
      (panel: unknown): panel is ArticleAccordionPanel =>
        isRecord(panel) &&
        hasOnlyKeys(panel, accordionKeys) &&
        typeof panel.label === "string" &&
        typeof panel.value === "string" &&
        typeof panel.defaultOpen === "boolean"
    ) ||
    !hasUniqueValues(panels)
  ) {
    throw new TypeError("Compiled Accordion panels are invalid.");
  }
  return panels;
};

export const parseArticleTabPanels = (
  serializedPanels: string
): readonly ArticleTabPanel[] => {
  const panels: unknown = JSON.parse(serializedPanels);
  if (
    !Array.isArray(panels) ||
    panels.length < 2 ||
    !panels.every(
      (panel: unknown): panel is ArticleTabPanel =>
        isRecord(panel) &&
        hasOnlyKeys(panel, tabKeys) &&
        typeof panel.label === "string" &&
        typeof panel.value === "string" &&
        (panel.iconSlot === undefined ||
          (typeof panel.iconSlot === "string" &&
            /^tabIcon\d+$/u.test(panel.iconSlot)))
    ) ||
    !hasUniqueValues(panels)
  ) {
    throw new TypeError("Compiled Tabs panels are invalid.");
  }
  return panels;
};
