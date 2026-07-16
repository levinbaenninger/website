"use client";

import { ArrowUpIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/shared/ui/button";

const SCROLL_THRESHOLD = 400;

export const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(window.scrollY >= SCROLL_THRESHOLD);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateVisibility);
    };
  }, []);

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-sm"
      aria-hidden={!visible}
      aria-label="Scroll to top"
      data-visible={visible}
      tabIndex={visible ? 0 : -1}
      className="fixed right-4 bottom-[calc(0.5rem+env(safe-area-inset-bottom,0px))] z-50 border-none opacity-0 shadow-sm transition-opacity duration-300 data-[visible=false]:pointer-events-none data-[visible=true]:opacity-100 sm:bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] lg:right-8 lg:bottom-[calc(2rem+env(safe-area-inset-bottom,0px))]"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      <ArrowUpIcon />
    </Button>
  );
};
