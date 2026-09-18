"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollSmoother, ScrollTrigger, useGSAP } from "@/shared/lib/gsap";

type SmoothScrollProps = {
  children: ReactNode;
};

const smoothCatchUpDuration = 1.1;

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

      // ScrollTrigger의 기본 resize 재계산은 입력이 멈춘 뒤에 실행되어 pin 위치가 늦게 따라온다.
      // 데스크톱 창 크기 조절 중에는 프레임마다 바로 재계산한다. 모바일 주소창 변화는 기본 동작을 따른다.
      let resizeFrame = 0;
      const refreshOnResize = () => {
        if (ScrollTrigger.isTouch === 1) return;
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
      };
      window.addEventListener("resize", refreshOnResize);

      return () => {
        window.removeEventListener("resize", refreshOnResize);
        cancelAnimationFrame(resizeFrame);
        media.revert();
      };
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
