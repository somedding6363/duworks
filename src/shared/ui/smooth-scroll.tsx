"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollSmoother, ScrollTrigger, useGSAP } from "@/shared/lib/gsap";

type SmoothScrollProps = {
  children: ReactNode;
};

const smoothCatchUpDuration = 0.65;

export function SmoothScroll({ children }: SmoothScrollProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(
        "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)",
        () => {
          const wrapperElement = wrapper.current;
          const contentElement = content.current;
          if (!wrapperElement || !contentElement) return;

          ScrollSmoother.get()?.kill();
          const smoother = ScrollSmoother.create({
            wrapper: wrapperElement,
            content: contentElement,
            smooth: smoothCatchUpDuration,
            smoothTouch: 0,
          });

          ScrollTrigger.refresh();

          return () => smoother.kill();
        },
      );

      return () => media.revert();
    },
    { scope: wrapper },
  );

  return (
    <div ref={wrapper} id="smooth-wrapper">
      <div ref={content} id="smooth-content">
        {children}
      </div>
    </div>
  );
}
