"use client";

import { useRef, type CSSProperties } from "react";
import { liveServices } from "@/entities/service";
import { gsap, ScrollTrigger, useGSAP } from "@/shared/lib/gsap";
import { createParticleSphere } from "../lib/particle-sphere";
import { ShowcaseServiceCard } from "./showcase-service-card";

const WORDMARK = "DUWORKS";
// iOS는 JS로 오는 스크롤 이벤트가 불규칙해 카드가 뚝뚝 따라가므로, 터치에서는 추종을 조금 늦춰 부드럽게 잇는다.
const touchScrubDuration = 0.3;
const heroCopyMinGap = 48;
const scaleBleed = 4;
// 타임라인 길이 단위. 스크롤 거리도 같은 비율(1단위 = max(100svh, 643px))로 CSS에서 만든다.
// 카드가 점으로 줄어드는 구간 → 점이 울퉁불퉁한 구로 퍼지는 구간 → 구가 울퉁불퉁한 원통으로 바뀌는 구간
// → 원통이 흐르며 서비스가 하나씩 떠오르는 구간 → 마지막 서비스에서 머무는 구간.
const shrinkUnits = 1.4;
const spreadUnits = 1.2;
const morphUnits = 1.3;
// 서비스 하나는 등장(점에서 커지며 또렷해짐) → 유지 → 사라짐 → 다음 서비스와의 간격으로 이어진다.
const serviceGrowUnits = 1.2;
const serviceHoldUnits = 0.5;
const serviceGapUnits = 0.1;
const serviceUnits = serviceGrowUnits * 2 + serviceHoldUnits + serviceGapUnits;
const holdUnits = 0.4;
const serviceCount = liveServices.length;
// 마지막 서비스는 사라지지 않고, 유지 구간 뒤에 머무는 구간(holdUnits)까지 이어진다.
const totalUnits =
  shrinkUnits +
  spreadUnits +
  morphUnits +
  serviceUnits * (serviceCount - 1) +
  serviceGapUnits +
  serviceGrowUnits +
  serviceHoldUnits +
  holdUnits;
// 카드가 줄어들어 끝나는 점의 지름(px).
const dotSize = 10;
// 폰은 점 개수와 해상도를 낮춰 부담을 줄인다.
const particleCount = { touch: 900, desktop: 1600 };

// 크기·위치는 CSS가 진행도(--p)로 계산해, 화면 크기가 바뀌면 재계산을 기다리지 않고 즉시 따라간다.
const sceneStyle = {
  // 카드 요소의 기준 크기(회전 전 가로·세로). 실제 보이는 크기는 scale로 정한다.
  "--card-h": "20rem",
  "--card-w": "15rem",
  "--showcase-height": "max(100svh, var(--showcase-content, 0px))",
  // 전환이 진행되는 스크롤 거리. 섹션을 이만큼 더 길게 두고, 그 동안 stage를 화면에 붙여 둔다.
  // sticky는 부모의 content box 안에서만 움직이므로 padding이 아닌 height로 늘린다.
  "--showcase-distance": `calc(${totalUnits} * max(100svh, 643px))`,
  // pin 중에는 stage 하단만 보이므로, 점은 보이는 화면의 가운데에 모인다.
  "--landing-y": "calc((var(--showcase-height) - 100svh) / 2)",
} as CSSProperties;

// 카드 크기·잘라내기를 매 프레임 바꾸면 모바일에서 다시 그리는 비용이 커 끊긴다.
// 요소 크기는 고정하고, 처음에는 scale로 화면만큼 키워 두었다가 점 크기까지 줄인다.
// scale·rotate·translate만 바뀌므로 합성 단계에서 처리된다.
// --sx0/--sy0(화면 ÷ 카드), --dx/--dy(점 ÷ 카드)는 CSS에서 길이끼리 나눌 수 없어 JS가 넣는다.
const heroCardStyle = {
  "--p": 0,
  // 모서리는 카드 크기와 같은 진행도(--p)에서 계산해, 카드가 실제로 줄어드는 만큼만 둥글어지게 한다.
  // 카드가 거의 화면 가득한데 모서리만 둥글면 그 바깥으로 뒷배경이 비친다.
  "--r": "min(1, var(--p) * 20)",
  "--sx": "calc(var(--sx0, 1) + (var(--dx, 1) - var(--sx0, 1)) * var(--p))",
  "--sy": "calc(var(--sy0, 1) + (var(--dy, 1) - var(--sy0, 1)) * var(--p))",
  width: "var(--card-h)",
  height: "var(--card-w)",
  translate: "-50% calc(-50% + var(--landing-y) * var(--p))",
  rotate: "calc(90deg * var(--p))",
  scale: "var(--sx) var(--sy)",
  // 배율만큼 나눠 보이는 반경을 일정하게 둔다. 첫 화면은 꽉 찬 사각형이고, 점이 되면 원이 된다.
  borderRadius: "calc(1.5rem * var(--r) / var(--sx)) / calc(1.5rem * var(--r) / var(--sy))",
} as CSSProperties;

// 점이 되어 갈 때 카드 색 대신 파티클과 같은 청록으로 채운다.
const dotFillStyle = {
  opacity: "clamp(0, (var(--p) - 0.8) * 5, 1)",
} as CSSProperties;

// 서비스는 점이 모인 자리(보이는 화면 가운데)에 크게 둔다. 폰은 세로로 긴 3:4, 넓은 화면은 5:4다(--service-h는 클래스에서 정한다).
// 낮은 화면에서도 줄이지 않고, 화면보다 크면 떠 있는 동안 스크롤에 맞춰 위로 올려(--pan: 0 → 1) 위부터 아래까지 보여준다.
const serviceStackStyle = {
  "--service-w": "min(90vw, 40rem)",
  "--service-overflow": "max(0px, var(--service-h) - 100svh + 3rem)",
  width: "var(--service-w)",
  height: "var(--service-h)",
  translate: "-50% calc(-50% + var(--landing-y))",
} as CSSProperties;

// 카드마다 따로 위로 올린다. 크기 애니메이션(scale)과 섞이지 않게 카드 안쪽 요소가 맡는다.
const servicePanStyle = {
  "--pan": 0,
  translate: "0 calc((0.5 - var(--pan)) * var(--service-overflow))",
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
  const canvas = useRef<HTMLCanvasElement>(null);

  useGSAP(
    () => {
      const sectionElement = section.current;
      const stageElement = stage.current;
      const cardElement = heroCard.current;
      const heroCopyElement = heroCopy.current;
      const canvasElement = canvas.current;
      if (!sectionElement || !stageElement || !cardElement || !heroCopyElement || !canvasElement) {
        return;
      }

      // 첫 화면에서 카드가 stage를 꽉 채우고, 끝에는 점 크기가 되도록 배율을 넣는다. 크기가 바뀌면 바로 다시 계산한다.
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
        sectionElement.style.setProperty("--dx", String(dotSize / cardWidth));
        sectionElement.style.setProperty("--dy", String(dotSize / cardHeight));
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

          const isTouch = ScrollTrigger.isTouch === 1;
          const particlesView = createParticleSphere(
            canvasElement,
            isTouch ? particleCount.touch : particleCount.desktop,
            isTouch ? 1.5 : 2,
          );
          const canvasObserver = new ResizeObserver(() => particlesView?.resize());
          canvasObserver.observe(canvasElement);

          // 파티클은 퍼지는 구간부터, stage가 화면에 보이는 동안만 그린다.
          let stageVisible = false;
          let particlesStarted = false;
          const updateActive = () => particlesView?.setActive(stageVisible && particlesStarted);
          // IntersectionObserver는 화면 크기 변경으로 pin이 풀렸다 다시 걸릴 때 보임 상태를 놓친다.
          // 섹션이 화면에 걸쳐 있는 스크롤 구간으로 판단해, 재계산 뒤에도 바로 맞춰지게 한다.
          const visibility = ScrollTrigger.create({
            trigger: sectionElement,
            start: "top bottom",
            end: "bottom top",
            onToggle: ({ isActive }) => {
              stageVisible = isActive;
              updateActive();
            },
            onRefresh: ({ isActive }) => {
              stageVisible = isActive;
              updateActive();
            },
          });

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
              scrub: isTouch ? touchScrubDuration : true,
              invalidateOnRefresh: true,
            },
          });

          const shrinkEnd = shrinkUnits;
          const spreadEnd = shrinkEnd + spreadUnits;
          const morphEnd = spreadEnd + morphUnits;
          const particles = { spread: 0, morph: 0, flow: 0 };
          const syncParticles = () => particlesView?.setProgress({ ...particles });
          const serviceCards = gsap.utils.toArray<HTMLElement>("[data-showcase-service]");

          // 1. hero 카드가 회전하며 줄어들어 점이 된다.
          handoff
            .fromTo(
              cardElement,
              { "--p": 0 },
              { "--p": 1, duration: shrinkUnits, ease: "power2.inOut" },
              0,
            )
            .to(heroCopyElement, { autoAlpha: 0, duration: 0.3 * shrinkUnits }, 0.05 * shrinkUnits);

          // 2. 점이 사라지는 자리에서 파티클이 울퉁불퉁한 구로 고르게 퍼진다. WebGL을 못 쓰면 점으로 남는다.
          if (particlesView) {
            handoff
              .to(cardElement, { autoAlpha: 0, duration: 0.1 * spreadUnits }, shrinkEnd)
              .to(
                particles,
                { spread: 1, duration: spreadUnits, onUpdate: syncParticles },
                shrinkEnd,
              )
              // 3. 구가 세로로 긴 울퉁불퉁한 원통으로 바뀐다.
              .to(
                particles,
                { morph: 1, duration: morphUnits, onUpdate: syncParticles },
                spreadEnd,
              );
          }

          // 4. 원통이 흐르는 동안, 그 위에 서비스 카드가 하나씩 떠오른다.
          handoff.to(
            particles,
            {
              flow: serviceCount,
              // 타임라인이 스크롤 거리보다 길어지지 않도록 원통 완성부터 끝까지만 흐른다.
              duration: totalUnits - morphEnd,
              onUpdate: syncParticles,
            },
            morphEnd,
          );
          // 카드는 투명한 점 크기에서 커지며 점점 또렷해지고, 다음 서비스로 넘어갈 때 다시 작아지며 사라진다.
          // 가로·세로를 같은 비율로 키워 카드 모양과 글자가 찌그러지지 않게 한다.
          // 카드가 화면보다 크면 보이는 동안 위로 올려 전체를 보여준다.
          serviceCards.forEach((serviceCard, index) => {
            const pan = serviceCard.querySelector<HTMLElement>("[data-showcase-service-pan]");
            if (!pan) return;
            const dotScale = () => dotSize / serviceCard.offsetWidth;
            // 원통이 완성된 뒤 간격을 두고 첫 서비스가 등장하고, 이후 서비스 칸마다 이어진다.
            const center =
              morphEnd +
              serviceGapUnits +
              serviceGrowUnits +
              serviceHoldUnits / 2 +
              serviceUnits * index;
            // 유지 구간이 서비스 칸의 가운데(center)에 오도록 앞뒤로 등장·사라짐을 둔다.
            const enterStart = center - serviceHoldUnits / 2 - serviceGrowUnits;
            const isLast = index === serviceCount - 1;
            const exitStart = isLast ? totalUnits : center + serviceHoldUnits / 2;

            handoff
              .fromTo(
                serviceCard,
                { autoAlpha: 0, scale: dotScale },
                { autoAlpha: 1, scale: 1, duration: serviceGrowUnits, ease: "power2.inOut" },
                enterStart,
              )
              .fromTo(
                pan,
                { "--pan": 0 },
                { "--pan": 1, duration: exitStart - (enterStart + serviceGrowUnits) },
                enterStart + serviceGrowUnits,
              );

            if (isLast) return;

            handoff.to(
              serviceCard,
              { autoAlpha: 0, scale: dotScale, duration: serviceGrowUnits, ease: "power2.inOut" },
              exitStart,
            );
          });

          // 머무는 구간까지 포함해 타임라인 길이를 스크롤 거리(CSS)와 같은 비율로 맞춘다.
          handoff.to({}, { duration: 0 }, totalUnits);
          handoff.eventCallback("onUpdate", () => {
            const started = handoff.time() >= shrinkEnd;
            if (started === particlesStarted) return;
            particlesStarted = started;
            updateActive();
          });

          return () => {
            visibility.kill();
            canvasObserver.disconnect();
            particlesView?.destroy();
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
            className="pointer-events-none absolute inset-0 bg-teal"
            style={dotFillStyle}
            aria-hidden="true"
          />
        </div>

        {/* 점이 퍼져 구와 원통이 되는 파티클. pin 중에 보이는 화면(stage 하단)을 채운다. */}
        <canvas
          ref={canvas}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-svh w-full"
          aria-hidden="true"
        />

        {/* 원통 위에 하나씩 떠오르는 서비스 카드. */}
        <div
          className="absolute top-1/2 left-1/2 [--service-h:calc(var(--service-w)*4/3)] md:[--service-h:calc(var(--service-w)*4/5)]"
          style={serviceStackStyle}
        >
          {liveServices.map((service, index) => (
            <div
              key={service.host}
              data-showcase-service
              className="invisible absolute inset-0 opacity-0"
            >
              <div data-showcase-service-pan className="h-full" style={servicePanStyle}>
                <ShowcaseServiceCard index={index} service={service} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
