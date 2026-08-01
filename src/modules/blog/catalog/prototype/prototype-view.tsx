// PROTOTYPE — throwaway. Delete this directory once issue #32 is decided.
//
// Three catalog compositions for issue #32, mounted on the real /blog route
// inside the real shell rail, switchable with ?variant=a|b|c, ?state=… and
// (variant B only) ?align=…, ?snippet=… and ?card=…

"use client";

import { PROTOTYPE_TAGS } from "./fixtures";
import type {
  Alignment,
  CardLayout,
  PrototypeState,
  SnippetMode,
  VariantKey,
} from "./params";
import { PrototypeSwitcher } from "./prototype-switcher";
import { usePrototypeCatalog } from "./use-prototype-search";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

export const BlogCatalogPrototype = ({
  alignment,
  cardLayout,
  snippetMode,
  state,
  variant,
}: {
  alignment: Alignment;
  cardLayout: CardLayout;
  snippetMode: SnippetMode;
  state: PrototypeState;
  variant: VariantKey;
}) => {
  const catalog = usePrototypeCatalog(state);

  return (
    <>
      {/* pt-12 matches the reference pages layout: 48 px between the header and
          the tagline. */}
      <div className="mx-auto w-full border-x border-line pt-12 md:w-3xl">
        {variant === "a" ? <VariantA {...catalog} /> : null}
        {variant === "b" ? (
          <VariantB
            {...catalog}
            alignment={alignment}
            cardLayout={cardLayout}
            snippetMode={snippetMode}
            tags={PROTOTYPE_TAGS}
          />
        ) : null}
        {variant === "c" ? (
          <VariantC {...catalog} tags={PROTOTYPE_TAGS} />
        ) : null}
      </div>

      <PrototypeSwitcher
        alignment={alignment}
        cardLayout={cardLayout}
        snippetMode={snippetMode}
        state={state}
        variant={variant}
      />
    </>
  );
};
