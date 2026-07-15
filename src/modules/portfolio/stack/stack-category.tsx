import type { TechStackCategory as TechStackCategoryData } from "./data";
import { StackItem } from "./stack-item";

interface StackCategoryProps {
  category: TechStackCategoryData;
  index: number;
}

export const StackCategory = ({ category, index }: StackCategoryProps) => (
  <section className="grid items-start gap-y-2 border-b border-line py-4 last:border-none sm:grid-cols-[12rem_1fr]">
    <h3 className="pl-4 text-sm/6 text-muted-foreground">
      <span
        className="mr-1.5 font-mono text-muted-foreground/50 select-none"
        aria-hidden
      >
        {(index + 1).toString().padStart(2, "0")}
      </span>
      {category.category}
    </h3>

    <ul className="flex flex-wrap gap-1.5 px-4">
      {category.items.map((item) => (
        <StackItem key={item.title} {...item} />
      ))}
    </ul>
  </section>
);
