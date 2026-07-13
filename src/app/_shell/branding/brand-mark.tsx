import { BRAND_MARK_PATH } from "@/app/_shell/branding/brand-mark-path";

export const BrandMark = (props: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 512 256"
    aria-hidden
    {...props}
  >
    <path fill="currentColor" d={BRAND_MARK_PATH} />
  </svg>
);
