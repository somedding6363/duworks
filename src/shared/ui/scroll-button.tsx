"use client";

import type { ButtonHTMLAttributes } from "react";
import { ScrollSmoother } from "@/shared/lib/gsap";

type ScrollButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type"> & {
  focusTarget?: boolean;
  targetId: string;
};

export function ScrollButton({ focusTarget = false, targetId, ...props }: ScrollButtonProps) {
  const handleClick = () => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const smoother = ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTo(target, true, "top top");
    } else {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }

    if (focusTarget) {
      target.focus({ preventScroll: true });
    }
  };

  return <button type="button" onClick={handleClick} {...props} />;
}
