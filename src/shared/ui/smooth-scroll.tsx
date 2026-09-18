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

      // iOS는 관성 스크롤 중 window.scrollY를 프레임마다 갱신하지 않는다. 5~8프레임 멈춰 있다가
      // 한 번에 300~500px씩 건너뛰고, 그동안 화면은 컴포지터가 부드럽게 스크롤한다. 그래서
      // ScrollTrigger가 아는 위치가 실제 보이는 위치보다 최대 500px 뒤처지고, more to come의 pin은
      // 섹션이 이미 지나간 뒤에야 걸려 stage를 화면 중앙으로 되돌린다.
      // CSS sticky로 바꾸면 이 지연은 사라지지만, stage가 스크롤 레이어에 남아 3D 씬을 매 프레임
      // 다시 그리므로 실기기에서 끊긴다. normalizeScroll이 되돌림과 끊김을 모두 통과한 유일한 방법이다.
      if (ScrollTrigger.isTouch === 1) {
        ScrollTrigger.normalizeScroll(true);
      }

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
        ScrollTrigger.normalizeScroll(false);
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
