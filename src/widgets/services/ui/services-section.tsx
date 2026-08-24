"use client";

import { useRef } from "react";
import {
  getServiceFanCardTransform,
  getServiceFanTravel,
  liveServices,
  ServiceFanCard,
  serviceFanCardTransitionDuration,
} from "@/entities/service";
import { gsap, ScrollTrigger, useGSAP } from "@/shared/lib/gsap";
import { ServiceCard } from "./service-card";

const touchScrubDuration = 0.2;
const fanEntryScale = 0.92;
const gridExpansionBaseDuration = 1 - serviceFanCardTransitionDuration;
const gridExpansionDuration = gridExpansionBaseDuration * 3;
const flipHandoffThreshold = 0.5;
const handoffThreshold = 0.9995;

type GridTransform = {
  rotation: number;
  scaleX: number;
  scaleY: number;
  x: number;
  y: number;
};

type FanSlotTransform = {
  scale: number;
  x: number;
  y: number;
};

export function ServicesSection() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const sectionElement = section.current;
      const stageElement = stage.current;
      const gridElement = grid.current;
      if (!sectionElement || !stageElement || !gridElement || liveServices.length === 0) return;

      const media = gsap.matchMedia();
      const getRemPixels = () =>
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

      const getPositionInStage = (element: HTMLElement) => {
        let current: HTMLElement | null = element;
        let x = 0;
        let y = 0;

        while (current && current !== stageElement) {
          x += current.offsetLeft;
          y += current.offsetTop;
          current = current.offsetParent as HTMLElement | null;
        }

        return { x, y };
      };

      const setupMotion = (isDesktop: boolean) => {
        const fanElement = sectionElement.querySelector<HTMLElement>("[data-service-entry-fan]");
        const tickerElement = document.querySelector<HTMLElement>("#service-index");
        const fanCards = gsap.utils.toArray<HTMLElement>("[data-service-entry-card]");
        const slots = gsap.utils.toArray<HTMLElement>("[data-service-card-slot]");
        const cards = gsap.utils.toArray<HTMLElement>("[data-service-grid-card]");
        const sectionIntro = sectionElement.querySelector<HTMLElement>("[data-service-intro]");
        if (
          !fanElement ||
          !tickerElement ||
          fanCards.length !== slots.length ||
          fanCards.length !== cards.length
        ) {
          return;
        }

        const links = cards.filter(
          (card): card is HTMLAnchorElement => card instanceof HTMLAnchorElement,
        );
        let showingGridFace = true;
        let showingGrid = true;

        const setFanActive = (active: boolean) => {
          gsap.set(fanElement, { autoAlpha: active ? 1 : 0 });
        };

        const setGridFace = (showGridFace: boolean) => {
          if (showingGridFace === showGridFace) return;
          showingGridFace = showGridFace;

          fanElement.style.visibility = showGridFace ? "hidden" : "visible";
          slots.forEach((slot) => {
            slot.style.visibility = showGridFace ? "visible" : "hidden";
          });
        };

        const setGridHandoff = (showGrid: boolean) => {
          if (showingGrid === showGrid) return;
          showingGrid = showGrid;

          slots.forEach((slot) => {
            slot.inert = !showGrid;
            slot.setAttribute("aria-hidden", showGrid ? "false" : "true");
          });
          links.forEach((link) => {
            link.tabIndex = showGrid ? 0 : -1;
            link.style.pointerEvents = showGrid ? "auto" : "none";
          });
        };

        const getFanTop = () =>
          (isDesktop ? -7 : -1.5) * getRemPixels() +
          getServiceFanTravel(window.innerHeight) * serviceFanCardTransitionDuration;

        const getFanParentY = () => getFanTop() + fanCards[0].offsetHeight;

        const getFanTransform = (index: number) =>
          getServiceFanCardTransform(index, fanCards.length, sectionElement.clientWidth);

        const getFanSlotTransform = (index: number): FanSlotTransform => {
          const fanCard = fanCards[index];
          const slot = slots[index];
          const slotPosition = getPositionInStage(slot);
          const slotScale = fanCard.offsetWidth / slot.offsetWidth;

          return {
            x: stageElement.clientWidth / 2 - (slotPosition.x + slot.offsetWidth / 2),
            y: getFanTop() - slotPosition.y,
            scale: slotScale,
          };
        };

        const getGridCardFanTransform = (index: number) => {
          const fanTransform = getFanTransform(index);
          const slotScale = getFanSlotTransform(index).scale;

          return {
            x: fanTransform.x / slotScale,
            y: fanTransform.y / slotScale,
            rotation: fanTransform.rotation,
          };
        };

        const getGridTransform = (index: number): GridTransform => {
          const fanCard = fanCards[index];
          const slot = slots[index];
          const slotPosition = getPositionInStage(slot);
          const scaleX = slot.offsetWidth / fanCard.offsetWidth;
          const scaleY = slot.offsetHeight / fanCard.offsetHeight;

          return {
            x: slotPosition.x + slot.offsetWidth / 2 - stageElement.clientWidth / 2,
            y: slotPosition.y - getFanParentY() + fanCard.offsetHeight * scaleY,
            rotation: 0,
            scaleX,
            scaleY,
          };
        };

        setGridHandoff(false);
        gsap.set(fanElement, {
          autoAlpha: 0,
          y: 0,
          scale: fanEntryScale,
          transformOrigin: "50% 50%",
          force3D: true,
        });
        gsap.set(fanCards, {
          x: 0,
          y: 0,
          rotation: 0,
          rotationY: 0,
          scaleX: 1,
          scaleY: 1,
          transformOrigin: "50% 100%",
          transformPerspective: isDesktop ? 1400 : 900,
          backfaceVisibility: "hidden",
          force3D: true,
        });
        gsap.set(slots, {
          visibility: "visible",
          transformOrigin: "50% 0%",
          transformStyle: "preserve-3d",
          force3D: true,
        });
        gsap.set(cards, {
          x: 0,
          y: 0,
          rotation: 0,
          rotationY: 180,
          transformOrigin: "50% 100%",
          transformPerspective: isDesktop ? 1400 : 900,
          backfaceVisibility: "hidden",
          force3D: true,
        });
        setGridFace(false);
        if (sectionIntro) gsap.set(sectionIntro, { autoAlpha: 0, y: isDesktop ? 20 : 16 });

        const entryTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: sectionElement,
            start: "top bottom",
            end: "top top",
            scrub: ScrollTrigger.isTouch === 1 ? touchScrubDuration : true,
            invalidateOnRefresh: true,
            onUpdate: ({ progress }) => setFanActive(progress > 0),
            onEnter: () => setFanActive(true),
            onLeave: () => setFanActive(true),
            onEnterBack: () => setFanActive(true),
            onLeaveBack: () => setFanActive(false),
          },
        });

        entryTimeline.fromTo(
          fanElement,
          { y: 0, scale: fanEntryScale },
          {
            y: getFanParentY,
            scale: 1,
            duration: 1,
            ease: "none",
          },
          0,
        );

        fanCards.forEach((card, index) => {
          entryTimeline.fromTo(
            card,
            { x: 0, y: 0, rotation: 0, rotationY: 0, scaleX: 1, scaleY: 1 },
            {
              x: () => getFanTransform(index).x,
              y: () => getFanTransform(index).y,
              rotation: () => getFanTransform(index).rotation,
              rotationY: 0,
              scaleX: 1,
              scaleY: 1,
              duration: serviceFanCardTransitionDuration,
              ease: "power2.inOut",
            },
            0,
          );
        });

        const expansionPin = ScrollTrigger.create({
          trigger: sectionElement,
          start: "top top",
          end: () => `+=${window.innerHeight * gridExpansionDuration}`,
          pin: stageElement,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        });

        const expansionTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: sectionElement,
            start: "top top",
            end: () => `+=${window.innerHeight * gridExpansionDuration}`,
            scrub: ScrollTrigger.isTouch === 1 ? touchScrubDuration : true,
            invalidateOnRefresh: true,
            onUpdate: ({ progress }) => {
              setGridFace(progress >= flipHandoffThreshold);
              setFanActive(progress > 0 && progress < flipHandoffThreshold);
              setGridHandoff(progress >= handoffThreshold);
            },
            onEnter: () => setFanActive(true),
            onLeave: () => {
              setGridFace(true);
              setFanActive(false);
              setGridHandoff(true);
            },
            onEnterBack: ({ progress }) => {
              setGridFace(progress >= flipHandoffThreshold);
              setFanActive(progress < flipHandoffThreshold);
              setGridHandoff(false);
            },
            onLeaveBack: () => {
              setGridFace(false);
              setFanActive(true);
              setGridHandoff(false);
            },
          },
        });

        fanCards.forEach((card, index) => {
          expansionTimeline.fromTo(
            card,
            {
              x: () => getFanTransform(index).x,
              y: () => getFanTransform(index).y,
              rotation: () => getFanTransform(index).rotation,
              rotationY: 0,
              scaleX: 1,
              scaleY: 1,
            },
            {
              x: () => getGridTransform(index).x,
              y: () => getGridTransform(index).y,
              rotation: 0,
              rotationY: -180,
              scaleX: () => getGridTransform(index).scaleX,
              scaleY: () => getGridTransform(index).scaleY,
              duration: gridExpansionDuration,
              ease: "sine.inOut",
              immediateRender: false,
            },
            0,
          );
        });

        slots.forEach((slot, index) => {
          expansionTimeline.fromTo(
            slot,
            {
              x: () => getFanSlotTransform(index).x,
              y: () => getFanSlotTransform(index).y,
              scale: () => getFanSlotTransform(index).scale,
            },
            {
              x: 0,
              y: 0,
              scale: 1,
              duration: gridExpansionDuration,
              ease: "power3.inOut",
              immediateRender: true,
            },
            0,
          );

          expansionTimeline.fromTo(
            cards[index],
            {
              x: () => getGridCardFanTransform(index).x,
              y: () => getGridCardFanTransform(index).y,
              rotation: () => getGridCardFanTransform(index).rotation,
              rotationY: 180,
            },
            {
              x: 0,
              y: 0,
              rotation: 0,
              rotationY: 0,
              duration: gridExpansionDuration,
              ease: "sine.inOut",
              immediateRender: true,
            },
            0,
          );
        });

        if (sectionIntro) {
          expansionTimeline.to(
            sectionIntro,
            {
              autoAlpha: 1,
              y: 0,
              duration: gridExpansionDuration * 0.72,
              ease: "power2.out",
            },
            gridExpansionDuration * 0.28,
          );
        }

        return () => {
          setGridFace(true);
          setGridHandoff(true);
          expansionTimeline.scrollTrigger?.kill();
          expansionTimeline.kill();
          entryTimeline.scrollTrigger?.kill();
          entryTimeline.kill();
          expansionPin.kill();
        };
      };

      media.add("(prefers-reduced-motion: no-preference) and (min-width: 48rem)", () =>
        setupMotion(true),
      );
      media.add("(prefers-reduced-motion: no-preference) and (max-width: 47.999rem)", () =>
        setupMotion(false),
      );

      return () => media.revert();
    },
    { scope: section },
  );

  if (liveServices.length === 0) return null;

  return (
    <section
      ref={section}
      id="services"
      className="relative z-0 isolate scroll-mt-0 bg-paper text-ink"
      aria-labelledby="services-title"
    >
      <div
        ref={stage}
        data-service-stage
        className="page-shell relative min-h-svh pt-[clamp(8.5rem,16vh,11rem)] pb-[clamp(6rem,10vw,9rem)]"
      >
        <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
          <div
            data-service-entry-fan
            className="absolute top-0 left-1/2 size-0 will-change-transform"
            aria-hidden="true"
          >
            {liveServices.map((service, index) => (
              <ServiceFanCard
                service={service}
                index={index}
                total={liveServices.length}
                scope="service"
                priority={index === 0}
                key={service.host}
              />
            ))}
          </div>
        </div>

        <header
          data-service-intro
          className="mb-[clamp(2rem,5vw,4rem)] flex items-end justify-between gap-8"
        >
          <div>
            <p className="mb-3 text-service-queue-meta font-semibold tracking-[0.14em] text-muted uppercase">
              Our services
            </p>
            <h2
              id="services-title"
              className="text-[clamp(3rem,7vw,6.5rem)] leading-[0.86] font-display tracking-[-0.065em]"
            >
              Services
            </h2>
          </div>
          <p className="pb-1 text-service-queue-meta font-semibold tracking-[0.08em] text-muted tabular-nums uppercase">
            {String(liveServices.length).padStart(2, "0")} live
          </p>
        </header>

        <div
          ref={grid}
          data-service-grid
          className="flex flex-wrap justify-center gap-3 md:grid md:grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] md:gap-[clamp(1rem,2vw,1.5rem)]"
        >
          {liveServices.map((service, index) => (
            <div
              data-service-card-slot
              className="relative aspect-[4/5] w-[clamp(10rem,38vw,11.5rem)] flex-none [backface-visibility:hidden] md:w-auto"
              key={service.host}
            >
              <ServiceCard service={service} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
