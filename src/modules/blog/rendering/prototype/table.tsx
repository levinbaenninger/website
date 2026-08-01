// PROTOTYPE — throwaway. Delete this directory once issue #34 is decided.
//
// The reference renders a table inside a full-bleed horizontal scroll container
// with a 150 px minimum cell width; production's `ArticleTable` renders a bare
// `<table>`, which `.typeset` then wraps rather than scrolls. `.typeset-scroll`
// is this repository's own answer to the same problem, so the prototype applies
// it here. A wrapper element cannot be added from CSS, which is why this is a
// component and not a rule. Finding for #37.

import type { ComponentPropsWithoutRef } from "react";

export const PrototypeTable = (props: ComponentPropsWithoutRef<"table">) => (
  <div className="typeset-scroll">
    <table {...props} />
  </div>
);
