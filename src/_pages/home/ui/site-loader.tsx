"use client";

import { useEffect, useState } from "react";

const PROGRESS_CEILING = 94;
const MINIMUM_VISIBLE_TIME = 1_150;
const COMPLETION_TIME = 380;
const COMPLETION_HOLD_TIME = 240;
const EXIT_TIME = 820;
const WORDMARK = "DUWORKS";

type LoaderPhase = "loading" | "exiting" | "complete";

function setPageInteractionBlocked(blocked: boolean) {
  const pageContent = document.querySelector<HTMLElement>("[data-site-content]");
  const scrollContainers = [document.documentElement, document.body];

  if (blocked) {
    pageContent?.setAttribute("inert", "");
    pageContent?.setAttribute("aria-hidden", "true");
    scrollContainers.forEach((element) => {
      element.style.overflow = "hidden";
      element.style.overscrollBehavior = "none";
    });
    return;
  }

  pageContent?.removeAttribute("inert");
  pageContent?.removeAttribute("aria-hidden");
  scrollContainers.forEach((element) => {
    element.style.removeProperty("overflow");
    element.style.removeProperty("overscroll-behavior");
  });
}

export function SiteLoader() {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<LoaderPhase>("loading");

  // 퇴장 애니메이션이 끝나기를 기다리면 화면이 이미 드러난 뒤에도 스크롤이 막혀 입력이 버려진다.
  // 로더가 올라가기 시작하는 순간(pointer-events 해제 시점)에 바로 스크롤을 넘겨준다.
  useEffect(() => {
    setPageInteractionBlocked(phase === "loading");
    return () => setPageInteractionBlocked(false);
  }, [phase]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = performance.now();
    const minimumVisibleTime = reducedMotion ? 160 : MINIMUM_VISIBLE_TIME;
    const completionTime = reducedMotion ? 80 : COMPLETION_TIME;
    const completionHoldTime = reducedMotion ? 80 : COMPLETION_HOLD_TIME;
    const exitTime = reducedMotion ? 100 : EXIT_TIME;
    let pageLoaded = document.readyState === "complete";
    let completionStartedAt: number | null = null;
    let completionStartedFrom = 0;
    let currentProgress = 0;
    let animationFrame = 0;
    let holdTimer = 0;
    let exitTimer = 0;

    const handlePageLoad = () => {
      pageLoaded = true;
    };

    const finish = () => {
      holdTimer = window.setTimeout(() => {
        setPhase("exiting");
        exitTimer = window.setTimeout(() => setPhase("complete"), exitTime);
      }, completionHoldTime);
    };

    const updateProgress = (now: number) => {
      const elapsed = now - startedAt;

      if (pageLoaded && elapsed >= minimumVisibleTime) {
        if (completionStartedAt === null) {
          completionStartedAt = now;
          completionStartedFrom = currentProgress;
        }

        const completionRatio = Math.min((now - completionStartedAt) / completionTime, 1);
        currentProgress = Math.round(
          completionStartedFrom + (100 - completionStartedFrom) * completionRatio,
        );
      } else {
        const estimatedProgress = Math.floor(PROGRESS_CEILING * (1 - Math.exp(-elapsed / 720)));
        currentProgress = Math.max(currentProgress, estimatedProgress);
      }

      setProgress((previousProgress) => Math.max(previousProgress, currentProgress));

      if (currentProgress >= 100) {
        finish();
        return;
      }

      animationFrame = window.requestAnimationFrame(updateProgress);
    };

    window.addEventListener("load", handlePageLoad, { once: true });
    animationFrame = window.requestAnimationFrame(updateProgress);

    return () => {
      window.removeEventListener("load", handlePageLoad);
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(holdTimer);
      window.clearTimeout(exitTimer);
    };
  }, []);

  if (phase === "complete") return null;

  const visibleCharacterCount = Math.min(
    WORDMARK.length,
    Math.floor((progress / 85) * WORDMARK.length),
  );

  return (
    <div
      className={`fixed inset-0 z-[100] grid min-h-svh grid-rows-[1fr_auto] overflow-hidden bg-ink pt-[max(1.25rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))] pb-[max(1.25rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] text-white-soft touch-none [contain:paint] transition-[transform,box-shadow] duration-[820ms] ease-fluid will-change-transform md:pt-[max(2rem,env(safe-area-inset-top))] md:pr-[max(2.5rem,env(safe-area-inset-right))] md:pb-[max(2rem,env(safe-area-inset-bottom))] md:pl-[max(2.5rem,env(safe-area-inset-left))] motion-reduce:duration-100 ${
        phase === "exiting"
          ? "pointer-events-none -translate-y-full shadow-[0_30px_80px_rgb(0_0_0/0.45)]"
          : "translate-y-0"
      }`}
      data-site-loader
      role="progressbar"
      aria-label="처음 화면 불러오기"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-valuetext={`${progress}% 완료`}
    >
      <div className="row-start-2" aria-hidden="true">
        <div className="mb-[clamp(1.5rem,3vw,2.5rem)] flex justify-center overflow-hidden pt-[0.16em] pb-[0.08em] text-[clamp(0.8rem,3.375vw,3.1875rem)] leading-[0.72] font-display tracking-[-0.04em] whitespace-nowrap tabular-nums">
          {Array.from(WORDMARK).map((character, index) => (
            <span
              className="inline-block translate-y-[0.72em] opacity-0 blur-[8px] transition-[transform,opacity,filter] duration-[680ms] ease-fluid will-change-[transform,opacity,filter] data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 data-[visible=true]:blur-none motion-reduce:translate-y-0 motion-reduce:blur-none motion-reduce:transition-opacity"
              data-visible={index < visibleCharacterCount}
              key={`${character}-${index}`}
            >
              {character}
            </span>
          ))}
        </div>

        <div className="mb-3 flex items-baseline justify-between gap-8 text-micro text-white-soft/60">
          <span className="tracking-[0.1em]">LOADING</span>
          <span className="text-interface tracking-[-0.015em] text-white-soft tabular-nums">
            {String(progress).padStart(3, "0")}%
          </span>
        </div>
        <div className="h-px overflow-hidden bg-white-soft/20">
          <div
            className="h-full w-full origin-left bg-white-soft will-change-transform"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
      </div>
    </div>
  );
}
