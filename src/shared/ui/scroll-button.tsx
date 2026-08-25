"use client";

import type { ButtonHTMLAttributes } from "react";
import { ScrollSmoother, ScrollTrigger } from "@/shared/lib/gsap";

type ScrollButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type"> & {
  focusTarget?: boolean;
  scrollTriggerId?: string;
  targetId: string;
};

export function ScrollButton({
  focusTarget = false,
  scrollTriggerId,
  targetId,
  ...props
}: ScrollButtonProps) {
  const handleClick = () => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const scrollTrigger = scrollTriggerId ? ScrollTrigger.getById(scrollTriggerId) : undefined;
    const scrollPosition = scrollTrigger?.end;
    const smoother = ScrollSmoother.get();
    if (smoother) {
      if (scrollPosition === undefined) {
        smoother.scrollTo(target, true, "top top");
      } else {
        smoother.scrollTo(scrollPosition, true);
      }
    } else if (scrollTrigger && scrollPosition !== undefined) {
      scrollTrigger.scroll(scrollPosition);
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
