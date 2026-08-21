"use client";

import { useRef } from "react";
import { liveServices } from "@/entities/service";
import { gsap, ScrollTrigger, useGSAP } from "@/shared/lib/gsap";
import { ServiceCard } from "./service-card";

const morphViewportRatio = 1;
const minimumServiceHeight = 400;

type StageMetrics = {
  cardHeight: number;
  cardWidth: number;
  gap: number;
  queueRadius: number;
  queueX: number;
  queueY: number;
  serviceHeight: number;
  stageHeight: number;
  width: number;
};

export function ServicesSection() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const sectionElement = section.current;
      const stageElement = stage.current;
      if (!sectionElement || !stageElement || liveServices.length === 0) return;

      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-service-card]");
        const clamp = gsap.utils.clamp(0, 1);
        const interpolate = gsap.utils.interpolate;
        const morphEase = gsap.parseEase("power2.inOut");
        let metrics: StageMetrics;

        const measure = () => {
          const width = stageElement.clientWidth;
          const stageHeight = stageElement.clientHeight;
          const serviceHeight = Math.max(minimumServiceHeight, stageHeight);
          const mobile = width <= 900;
          const small = width <= 560;
          const cardWidth = Math.min(184, Math.max(136, width * 0.15));
          const cardHeight = cardWidth * 1.36;
          const gap = Math.min(14, Math.max(10, width * 0.01));

          metrics = {
            width,
            stageHeight,
            serviceHeight,
            cardWidth,
            cardHeight,
            gap,
            queueX: width * (small ? 0.7 : mobile ? 0.74 : 0.84),
            queueY: Math.max(12, stageHeight - cardHeight - 50),
            queueRadius: Math.min(22, Math.max(18, width * 0.02)),
          };
        };

        const getScrollDistances = () => {
          const stageHeight = stageElement.clientHeight;
          const serviceHeight = Math.max(minimumServiceHeight, stageHeight);
          const panScrollDistance = serviceHeight - stageHeight;
          const morphScrollDistance = serviceHeight * morphViewportRatio;
          const serviceStepDistance = panScrollDistance + morphScrollDistance;
          const totalScrollDistance =
            (liveServices.length - 1) * serviceStepDistance + panScrollDistance;

          return {
            morphScrollDistance,
            panScrollDistance,
            serviceStepDistance,
            totalScrollDistance,
          };
        };

        const render = (globalProgress: number) => {
          const serviceCount = liveServices.length;
          const { width, serviceHeight, cardWidth, cardHeight, gap, queueX, queueY, queueRadius } =
            metrics;
          const {
            morphScrollDistance,
            panScrollDistance,
            serviceStepDistance,
            totalScrollDistance,
          } = getScrollDistances();
          const scrollDistance = globalProgress * totalScrollDistance;
          const current = Math.min(
            serviceCount - 1,
            Math.floor(scrollDistance / serviceStepDistance),
          );
          const stepProgress = scrollDistance - current * serviceStepDistance;
          const panProgress = panScrollDistance === 0 ? 1 : clamp(stepProgress / panScrollDistance);
          const progress =
            current === serviceCount - 1
              ? 0
              : clamp((stepProgress - panScrollDistance) / morphScrollDistance);
          const currentCardY = -panScrollDistance * panProgress;

          const step = cardWidth + gap;

          cards.forEach((card, index) => {
            const queue = card.querySelector<HTMLElement>("[data-service-queue]");
            const full = card.querySelector<HTMLElement>("[data-service-full]");
            const link = card.querySelector<HTMLAnchorElement>("[data-service-link]");

            let x = 0;
            let y = 0;
            let cardRenderWidth = width;
            let cardRenderHeight = serviceHeight;
            let radius = 0;
            let opacity = 1;
            let scale = 1;
            let brightness = 1;
            let zIndex = 1;
            let queueOpacity = 0;
            let fullOpacity = 1;
            let shadow = "0 0 0 rgb(0 0 0 / 0)";

            if (index < current) {
              x = -width * 0.12;
              opacity = 0;
              scale = 0.982;
              zIndex = 0;
              fullOpacity = 0;
            } else if (index === current) {
              y = currentCardY;
              scale = 1 - progress * 0.018;
              brightness = 1 - progress * 0.1;
              zIndex = 2;
            } else if (index === current + 1) {
              const easedProgress = morphEase(progress);

              x = interpolate(queueX, 0, easedProgress);
              y = interpolate(queueY, 0, easedProgress);
              cardRenderWidth = interpolate(cardWidth, width, easedProgress);
              cardRenderHeight = interpolate(cardHeight, serviceHeight, easedProgress);
              radius = interpolate(queueRadius, 0, easedProgress);
              zIndex = 6;
              queueOpacity = 1 - clamp((progress - 0.22) / 0.34);
              fullOpacity = clamp((progress - 0.48) / 0.34);
              shadow = "0 0.625rem 2.125rem rgb(0 0 0 / 0.18)";
            } else {
              const relativeIndex = index - current - 1;
              const startX = queueX + relativeIndex * step;
              const endX = queueX + (relativeIndex - 1) * step;

              x = interpolate(startX, endX, progress);
              y = queueY;
              cardRenderWidth = cardWidth;
              cardRenderHeight = cardHeight;
              radius = queueRadius;
              opacity = x < width + cardWidth ? 1 : 0;
              scale = 1;
              zIndex = 20 - Math.min(relativeIndex, 8);
              queueOpacity = 1;
              fullOpacity = 0;
              shadow = "0 1.125rem 3.375rem rgb(0 0 0 / 0.34)";
            }

            gsap.set(card, {
              x,
              y,
              width: cardRenderWidth,
              height: cardRenderHeight,
              borderRadius: radius,
              opacity,
              scale,
              filter: `brightness(${brightness})`,
              boxShadow: shadow,
              zIndex,
              cursor: index > current ? "pointer" : "default",
              force3D: true,
            });
            gsap.set(queue, { opacity: queueOpacity });
            gsap.set(full, { opacity: fullOpacity });
            if (link) {
              const isLinkAvailable = fullOpacity > 0.55;
              link.tabIndex = isLinkAvailable ? 0 : -1;
              link.style.pointerEvents = isLinkAvailable ? "auto" : "none";
            }
          });
        };

        measure();
        render(0);

        const trigger = ScrollTrigger.create({
          trigger: sectionElement,
          start: "top top",
          end: () => "+=" + getScrollDistances().totalScrollDistance,
          pin: stageElement,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => render(self.progress),
          onRefresh: (self) => {
            measure();
            render(self.progress);
          },
        });

        const cardClickCleanups = cards.map((card, index) => {
          const moveToCard = (event: MouseEvent) => {
            if ((event.target as Element).closest("a")) return;

            const { serviceStepDistance, totalScrollDistance } = getScrollDistances();
            const targetProgress =
              totalScrollDistance === 0 ? 0 : (index * serviceStepDistance) / totalScrollDistance;
            const targetScroll = trigger.start + (trigger.end - trigger.start) * targetProgress;
            window.scrollTo({ top: targetScroll, behavior: "smooth" });
          };

          card.addEventListener("click", moveToCard);
          return () => card.removeEventListener("click", moveToCard);
        });

        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener("resize", refresh);
        window.addEventListener("load", refresh);

        return () => {
          window.removeEventListener("resize", refresh);
          window.removeEventListener("load", refresh);
          cardClickCleanups.forEach((cleanup) => cleanup());
          trigger.kill();
        };
      });

      return () => media.revert();
    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      id="services"
      className="relative scroll-mt-0 bg-ink"
      aria-labelledby="services-title"
    >
      <h2 id="services-title" className="sr-only">
        DUWORKS 서비스
      </h2>

      <div
        ref={stage}
        data-service-stage
        className="relative h-svh w-full overflow-hidden bg-ink motion-reduce:h-auto motion-reduce:overflow-visible motion-reduce:py-3"
      >
        <div className="motion-reduce:space-y-3">
          {liveServices.map((service, index) => (
            <ServiceCard service={service} index={index} key={service.host} />
          ))}
        </div>
      </div>
    </section>
  );
}
