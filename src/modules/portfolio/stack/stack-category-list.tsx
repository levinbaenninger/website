import type { TechStackCategory as TechStackCategoryData } from "./data";
import { StackCategory } from "./stack-category";

interface StackCategoryListProps {
  categories: readonly TechStackCategoryData[];
}

export const StackCategoryList = ({ categories }: StackCategoryListProps) => (
  <div className="relative">
    <div
      className="pointer-events-none absolute inset-y-0 left-48 -z-1 w-px bg-[linear-gradient(to_bottom,var(--line)_4px,transparent_2px)] bg-size-[1px_6px] bg-repeat-y max-sm:hidden"
      aria-hidden
    />

    {categories.map((category, index) => (
      <StackCategory
        key={category.category}
        category={category}
        index={index}
      />
    ))}
  </div>
);
