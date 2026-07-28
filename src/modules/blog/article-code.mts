import type { Root } from "hast";

export default function articleCode() {
  return (_root: Root): void => {
    // Code presentation is implemented by the separately scoped Article-code ticket.
    // Keeping this wrapper in the resolved transform position preserves the
    // serializable compiler boundary for that work.
  };
}
