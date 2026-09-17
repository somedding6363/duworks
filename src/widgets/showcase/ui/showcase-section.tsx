"use client";

import { useRef, useState, type CSSProperties } from "react";
import { liveServices } from "@/entities/service";
import { ArrowUpRightIcon } from "@/shared/icons";
import { gsap, ScrollTrigger, useGSAP } from "@/shared/lib/gsap";
import { ShowcaseIntroFace, ShowcaseServiceFace } from "./showcase-face";

const WORDMARK = "DUWORKS";
// iOS는 JS로 오는 스크롤 이벤트가 불규칙해 카드가 뚝뚝 따라가므로, 터치에서는 추종을 조금 늦춰 부드럽게 잇는다.
const touchScrubDuration = 0.3;
const heroCopyMinGap = 48;
const scaleBleed = 4;
// 타임라인 길이 단위. 스크롤 거리도 같은 비율(1단위 = max(100svh, 643px))로 CSS에서 만든다.
const handoffUnits = 1.4;
const stepUnits = 0.8;
// 원통을 6칸으로 나눠 양옆 카드가 비스듬히 보이게 한다. 칸보다 카드가 적으면 뒤쪽 칸은 비워 둔다.
const ringSlots = 6;
const ringAngle = 360 / ringSlots;
const stepCount = liveServices.length;

// 크기·위치는 CSS가 진행도(--p)로 계산해, 화면 크기가 바뀌면 재계산을 기다리지 않고 즉시 따라간다.
const sceneStyle = {
  // 폭·높이 기준 중 작은 값을 쓰되, 좁거나 낮은 화면에서도 카드 높이 20rem(폭 15rem) 아래로는 줄이지 않는다.
  "--card-h-base": "calc(max(15rem, min(clamp(16rem, 88vw, 34rem), calc(78svh * 0.75))) * 4 / 3)",
  // 단, 화면이 그보다 낮으면 최소 크기보다 화면 안에 다 보이는 것을 우선한다.
  // 카드 아래 CTA 자리를 남긴다.
  "--card-h": "min(var(--card-h-base), calc(100svh - 8rem))",
  "--card-w": "calc(var(--card-h) * 3 / 4)",
  "--showcase-height": "max(100svh, var(--showcase-content, 0px))",
  // 전환이 진행되는 스크롤 거리. 섹션을 이만큼 더 길게 두고, 그 동안 stage를 화면에 붙여 둔다.
  // sticky는 부모의 content box 안에서만 움직이므로 padding이 아닌 height로 늘린다.
  "--showcase-distance": `calc(${handoffUnits + stepUnits * stepCount} * max(100svh, 643px))`,
  // pin 중에는 stage 하단만 보이므로, 카드는 보이는 화면의 가운데(위아래 여백 동일)에 착지한다.
  "--landing-y": "calc((var(--showcase-height) - 100svh) / 2)",
  // 원통 반경. 앞면이 z=0에 오도록 원통 전체를 이만큼 뒤로 민다.
  "--ring-r": `calc(var(--card-w) / 2 / tan(${ringAngle / 2}deg) + 1rem)`,
} as CSSProperties;

// 카드 크기·잘라내기를 매 프레임 바꾸면 모바일에서 다시 그리는 비용이 커 끊긴다.
// 요소는 착지 카드 크기로 고정하고, 처음에는 scale로 화면만큼 키워 두었다가 줄인다.
// scale·rotate·translate만 바뀌므로 합성 단계에서 처리된다.
// --sx0/--sy0(화면 ÷ 카드)은 CSS에서 길이끼리 나눌 수 없어 JS가 넣는다.
const heroCardStyle = {
  "--p": 0,
  // 모서리는 카드 크기와 같은 진행도(--p)에서 계산해, 카드가 실제로 줄어드는 만큼만 둥글어지게 한다.
  // 카드가 거의 화면 가득한데 모서리만 둥글면 그 바깥으로 뒷배경이 비친다.
  "--r": "min(1, var(--p) * 20)",
  "--sx": "calc(var(--sx0, 1) + (1 - var(--sx0, 1)) * var(--p))",
  "--sy": "calc(var(--sy0, 1) + (1 - var(--sy0, 1)) * var(--p))",
  // 90° 회전 후 세로 카드로 보이도록, 회전 전 기준으로 가로는 카드 높이, 세로는 카드 폭이다.
  width: "var(--card-h)",
  height: "var(--card-w)",
  translate: "-50% calc(-50% + var(--landing-y) * var(--p))",
  rotate: "calc(90deg * var(--p))",
  scale: "var(--sx) var(--sy)",
  // 배율만큼 나눠 보이는 반경을 일정하게 둔다. 첫 화면은 꽉 찬 사각형이다.
  borderRadius: "calc(1.5rem * var(--r) / var(--sx)) / calc(1.5rem * var(--r) / var(--sy))",
} as CSSProperties;

const ringViewStyle = {
  translate: "0 var(--landing-y)",
} as CSSProperties;

// CTA는 카드 아래 남은 여백의 가운데에 둔다.
const ctaStyle = {
  translate: "-50% calc(var(--landing-y) + var(--card-h) / 2 + (100svh - var(--card-h)) / 4 - 50%)",
} as CSSProperties;

const ringOffsetStyle = {
  transform: "translateZ(calc(var(--ring-r) * -1))",
} as CSSProperties;

// 카드 안의 글자는 카드 배율의 역수로 되돌려 찌그러지지 않게 한다.
const unscaleStyle = {
  scale: "calc(1 / var(--sx)) calc(1 / var(--sy))",
} as CSSProperties;

export function ShowcaseSection() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const heroCard = useRef<HTMLDivElement>(null);
  const heroCopy = useRef<HTMLDivElement>(null);
  const cardCopy = useRef<HTMLDivElement>(null);
  const ringView = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const cta = useRef<HTMLDivElement>(null);
  // 0은 hero 카드, 1부터 서비스 카드. 착지 전에는 -1.
  const [activeFace, setActiveFace] = useState(-1);

  useGSAP(
    () => {
      const sectionElement = section.current;
      const stageElement = stage.current;
      const cardElement = heroCard.current;
      const heroCopyElement = heroCopy.current;
      const cardCopyElement = cardCopy.current;
      const ringViewElement = ringView.current;
      const ringElement = ring.current;
      const ctaElement = cta.current;
      if (
        !ringViewElement ||
        !ringElement ||
        !ctaElement ||
        !sectionElement ||
        !stageElement ||
        !cardElement ||
        !heroCopyElement ||
        !cardCopyElement
      ) {
        return;
      }

      // 첫 화면에서 카드가 stage를 꽉 채우도록 배율을 넣는다. 크기가 바뀌면 바로 다시 계산한다.
      const measureScale = () => {
        const cardWidth = cardElement.offsetWidth;
        const cardHeight = cardElement.offsetHeight;
        if (!cardWidth || !cardHeight) return;

        // 확대된 층의 가장자리 픽셀은 반투명하게 그려져 뒤 배경이 선처럼 비치므로, 화면보다 조금 더 키운다.
        const bleed = scaleBleed * 2;
        sectionElement.style.setProperty(
          "--sx0",
          String((stageElement.clientWidth + bleed) / cardWidth),
        );
        sectionElement.style.setProperty(
          "--sy0",
          String((stageElement.clientHeight + bleed) / cardHeight),
        );
      };

      measureScale();
      const scaleObserver = new ResizeObserver(measureScale);
      scaleObserver.observe(stageElement);
      scaleObserver.observe(cardElement);

      const media = gsap.matchMedia();

      // 터치에서는 stage를 CSS sticky로 붙여 둔다. JS pin은 스크롤 중 stage를 fixed로 바꿨다 되돌리며
      // 레이아웃을 바꾸는데, iOS에서는 이 전환이 관성 스크롤·맨 위 튕김과 부딪혀 어색해진다.
      // ScrollSmoother가 켜지는 환경(smooth-scroll.tsx와 같은 조건)에서는 sticky가 동작하지 않으므로 JS pin을 쓴다.
      media.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          smooth: "(hover: hover) and (pointer: fine)",
        },
        (context) => {
          const { motion, smooth } = context.conditions ?? {};
          if (!motion) return;

          // sticky 위치 속성을 CSS로 늘 두면, 데스크톱 pin이 그 top 값을 pin 여백 요소로 복사해
          // stage 전체가 (stage 높이 - 화면 높이)만큼 위로 밀린다. JS pin을 쓰지 않을 때만 붙인다.
          if (!smooth) {
            stageElement.style.position = "sticky";
            stageElement.style.top = "min(0px, calc(100svh - var(--showcase-height)))";
          }

          // 화면이 hero 내용보다 낮으면 stage를 늘려 하단까지 스크롤로 보여준 뒤 pin을 시작한다.
          // 결과(섹션 높이)에 영향을 받지 않는 값만 읽어, 측정 → 높이 변경 → 재측정 순환이 생기지 않게 한다.
          const heroCopyChildren = Array.from(heroCopyElement.children) as HTMLElement[];
          let contentHeight = 0;
          let refreshFrame = 0;
          const measureContent = () => {
            const copyStyle = getComputedStyle(heroCopyElement);
            const childrenHeight = heroCopyChildren.reduce(
              (total, child) => total + child.offsetHeight,
              0,
            );
            const nextHeight = Math.ceil(
              childrenHeight +
                Number.parseFloat(copyStyle.paddingTop) +
                Number.parseFloat(copyStyle.paddingBottom) +
                heroCopyMinGap,
            );
            if (nextHeight === contentHeight) return;

            const isFirstMeasure = contentHeight === 0;
            contentHeight = nextHeight;
            sectionElement.style.setProperty("--showcase-content", `${contentHeight}px`);
            if (isFirstMeasure) return;

            // 창 크기 변경 시 ScrollTrigger 재계산이 이 측정보다 먼저 끝나면, pin 시작 지점이 이전 높이에 머문다.
            // 섹션 높이가 바뀌었으니 한 번 더 재계산한다.
            cancelAnimationFrame(refreshFrame);
            refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
          };

          measureContent();
          const resizeObserver = new ResizeObserver(measureContent);
          heroCopyChildren.forEach((child) => resizeObserver.observe(child));

          const H = handoffUnits;
          const S = stepUnits;
          const total = H + S * stepCount;

          const handoff = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              id: "showcase-handoff",
              trigger: stageElement,
              // 모바일에서 주소창이 사라져 화면이 stage보다 커지면 시작 지점이 0보다 앞서므로 0 이상으로 고정한다.
              start: "clamp(bottom bottom)",
              end: () => `+=${sectionElement.offsetHeight - stageElement.offsetHeight}`,
              // 전환 거리는 섹션 높이가 이미 만들고 있으므로 pin 여백은 더하지 않는다.
              pin: smooth ? stageElement : false,
              pinSpacing: false,
              scrub: ScrollTrigger.isTouch === 1 ? touchScrubDuration : true,
              invalidateOnRefresh: true,
            },
          });

          const sideFaces = gsap.utils.toArray<HTMLElement>("[data-showcase-side-face]");

          // 1. hero 카드가 회전하며 줄어들어 착지한다.
          handoff
            .fromTo(cardElement, { "--p": 0 }, { "--p": 1, duration: H, ease: "power2.inOut" }, 0)
            .to(heroCopyElement, { autoAlpha: 0, duration: 0.3 * H }, 0.05 * H)
            .fromTo(
              cardCopyElement,
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.3 * H },
              0.7 * H,
            );

          // 2. 착지하면 같은 모습의 원통 0번 면으로 바꾸고, 양옆 카드와 CTA를 드러낸다.
          handoff
            .set(ringViewElement, { autoAlpha: 1 }, H)
            .set(cardElement, { autoAlpha: 0 }, H)
            .fromTo(sideFaces, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 * S }, H)
            .fromTo(
              ctaElement,
              { autoAlpha: 0, y: 12 },
              { autoAlpha: 1, y: 0, duration: 0.25 * S },
              H,
            );

          // 3. 서비스마다 한 칸씩 돌리고, 각 카드에서 잠깐 머문다.
          gsap.set(ringElement, { rotationY: 0, transformStyle: "preserve-3d", force3D: true });
          for (let step = 1; step <= stepCount; step += 1) {
            handoff.to(
              ringElement,
              { rotationY: -ringAngle * step, duration: 0.7 * S, ease: "power2.inOut" },
              H + S * (step - 1) + 0.15 * S,
            );
          }

          // 마지막 카드에서 머무는 시간까지 포함해 타임라인 길이를 스크롤 거리(CSS)와 같은 비율로 맞춘다.
          handoff.to({}, { duration: 0 }, total);

          // 현재 앞에 있는 면을 CTA에 반영한다. 면이 바뀔 때만 상태를 갱신한다.
          const updateActiveFace = (progress: number) => {
            const time = progress * total;
            const face = time < H ? -1 : gsap.utils.clamp(0, stepCount, Math.round((time - H) / S));
            setActiveFace((current) => (current === face ? current : face));
          };
          handoff.eventCallback("onUpdate", () => updateActiveFace(handoff.progress()));

          return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(refreshFrame);
            stageElement.style.removeProperty("position");
            stageElement.style.removeProperty("top");
            sectionElement.style.removeProperty("--showcase-content");
            handoff.scrollTrigger?.kill();
            handoff.kill();
          };
        },
      );

      return () => {
        scaleObserver.disconnect();
        media.revert();
      };
    },
    { scope: section },
  );

  const activeService = activeFace >= 1 ? liveServices[activeFace - 1] : undefined;

  return (
    <section
      ref={section}
      id="showcase"
      className="relative isolate bg-paper motion-safe:h-[calc(var(--showcase-height)+var(--showcase-distance))]"
      style={sceneStyle}
      aria-labelledby="showcase-title"
    >
      <div ref={stage} className="relative h-[var(--showcase-height)] overflow-hidden">
        <div
          ref={heroCard}
          className="absolute top-1/2 left-1/2 overflow-hidden bg-[radial-gradient(120%_90%_at_70%_110%,var(--color-teal),var(--color-ink)_70%)] text-white-soft will-change-transform"
          style={heroCardStyle}
        >
          <div
            ref={heroCopy}
            className="absolute top-1/2 left-1/2 flex h-[var(--showcase-height)] w-screen -translate-1/2 flex-col justify-between p-[clamp(1.25rem,4vw,3.5rem)] will-change-transform"
            style={unscaleStyle}
          >
            <p className="text-hero-note font-hero-note tracking-[0.12em] text-white-soft/70">
              FOLLOW THE IDEA.
            </p>
            <div>
              <h1 id="showcase-title" className="text-hero font-display whitespace-nowrap">
                {WORDMARK}
              </h1>
              <p className="mt-6 max-w-[42.5rem] text-hero-support font-support text-white-soft/80 md:text-hero-support-wide">
                <span className="block">상상을 현실로 옮기고</span>
                <span className="block">그 결과를 세상에 내놓습니다.</span>
              </p>
            </div>
          </div>

          <div
            ref={cardCopy}
            className="invisible absolute top-1/2 left-1/2 flex h-[var(--card-h)] w-[var(--card-w)] -translate-1/2 -rotate-90 flex-col justify-end p-3 opacity-0"
            style={unscaleStyle}
            aria-hidden="true"
          >
            <p className="text-showcase-card-note tracking-[0.12em] text-white-soft/60">
              FOLLOW THE IDEA.
            </p>
            <p className="mt-1.5 text-showcase-card-title font-display">{WORDMARK}</p>
          </div>
        </div>

        {/* 착지 이후의 원통 캐러셀. 0번 면은 착지한 hero 카드와 같은 모습이다. */}
        <div
          ref={ringView}
          className="pointer-events-none invisible absolute top-1/2 left-1/2 size-0 opacity-0 [perspective:1400px] [transform-style:preserve-3d]"
          style={ringViewStyle}
          aria-hidden="true"
        >
          <div className="[transform-style:preserve-3d]" style={ringOffsetStyle}>
            <div ref={ring} className="will-change-transform">
              {Array.from({ length: stepCount + 1 }, (_, face) => (
                <div
                  key={face}
                  data-showcase-side-face={face > 0 ? "" : undefined}
                  className="absolute top-[calc(var(--card-h)/-2)] left-[calc(var(--card-w)/-2)] h-[var(--card-h)] w-[var(--card-w)] [backface-visibility:hidden]"
                  style={{ transform: `rotateY(${face * ringAngle}deg) translateZ(var(--ring-r))` }}
                >
                  {face === 0 ? (
                    <ShowcaseIntroFace />
                  ) : (
                    <ShowcaseServiceFace index={face - 1} service={liveServices[face - 1]} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2" style={ctaStyle}>
          <div ref={cta} className="invisible opacity-0">
            {activeService ? (
              <a
                href={activeService.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${activeService.name} 서비스 열기`}
                className="inline-flex min-h-11 items-center gap-2 rounded-control bg-ink px-5 text-interface font-bold whitespace-nowrap text-white-soft transition-transform duration-300 ease-fluid active:scale-[0.97]"
              >
                서비스 바로가기
                <ArrowUpRightIcon className="size-4" />
              </a>
            ) : (
              <p className="inline-flex min-h-11 items-center px-5 text-interface font-bold whitespace-nowrap text-muted">
                스크롤해서 서비스 보기
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
