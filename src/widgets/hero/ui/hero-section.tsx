"use client";

import { useRef } from "react";
import {
  getServiceFanCardTransform,
  getServiceFanTravel,
  liveServices,
  serviceFanCardTransitionDuration,
  serviceFanCollapsedOpacity,
} from "@/entities/service";
import { gsap, ScrollTrigger, useGSAP } from "@/shared/lib/gsap";
import { HeroOrbit } from "./hero-orbit";
import { HeroServiceFan } from "./hero-service-fan";

const WORDMARK = "DUWORKS";
const touchScrubDuration = 0.2;

export function HeroSection() {
  const section = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const heroCards = gsap.utils.toArray<HTMLElement>("[data-hero-card]");

        const layoutFan = () => {
          const width = section.current?.clientWidth ?? window.innerWidth;

          heroCards.forEach((card, index) => {
            const transform = getServiceFanCardTransform(index, heroCards.length, width);
            gsap.set(card, {
              x: transform.x,
              y: transform.y,
              rotation: transform.rotation,
              transformOrigin: "50% 100%",
              force3D: true,
            });
          });
        };

        layoutFan();
        const resizeObserver = new ResizeObserver(layoutFan);
        if (section.current) resizeObserver.observe(section.current);

        const timeline = gsap.timeline({ defaults: { ease: "power4.out" } });

        timeline
          .from('[data-hero="grid"]', { autoAlpha: 0, duration: 0.9 })
          .from(
            '[data-hero="orbit"]',
            { scale: 0.72, rotation: -18, autoAlpha: 0, duration: 1.35 },
            "<",
          )
          .from('[data-hero="topline"]', { y: 18, autoAlpha: 0, duration: 0.7 }, "-=0.7")
          .from(
            '[data-hero="word-char"]',
            {
              yPercent: 110,
              rotation: 7,
              scale: 0.86,
              autoAlpha: 0,
              filter: "blur(14px)",
              stagger: 0.055,
              duration: 1.15,
            },
            "-=0.5",
          )
          .from('[data-hero="support"]', { y: 24, autoAlpha: 0, duration: 0.8 }, "-=0.68")
          .from(
            heroCards,
            { yPercent: 42, scale: 0.88, autoAlpha: 0, stagger: 0.07, duration: 0.9 },
            "-=0.58",
          );

        gsap.to('[data-hero="copy"]', {
          yPercent: 9,
          scale: 0.985,
          autoAlpha: 0.3,
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: "bottom top",
            scrub: ScrollTrigger.isTouch === 1 ? touchScrubDuration : true,
          },
        });

        gsap.to('[data-hero="grid"]', {
          yPercent: 7,
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: "bottom top",
            scrub: ScrollTrigger.isTouch === 1 ? touchScrubDuration : true,
          },
        });

        return () => resizeObserver.disconnect();
      });

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const fanElement = section.current?.querySelector<HTMLElement>('[data-hero="service-fan"]');
        if (!fanElement) return;

        const heroCards = gsap.utils.toArray<HTMLElement>("[data-hero-card]");
        const exit = gsap.timeline({
          scrollTrigger: {
            trigger: section.current,
            start: "bottom bottom",
            end: "bottom top",
            scrub: ScrollTrigger.isTouch === 1 ? touchScrubDuration : true,
            invalidateOnRefresh: true,
          },
        });

        exit
          .to(
            heroCards,
            {
              x: 0,
              y: 0,
              rotation: 0,
              opacity: serviceFanCollapsedOpacity,
              duration: serviceFanCardTransitionDuration,
              ease: "power2.inOut",
            },
            0,
          )
          .to(
            fanElement,
            {
              y: () => getServiceFanTravel(window.innerHeight),
              scale: 0.92,
              duration: 1,
              ease: "none",
            },
            0,
          )
          .to(fanElement, { autoAlpha: 0, duration: 0.22, ease: "none" }, 0.78);

        return () => {
          exit.scrollTrigger?.kill();
          exit.kill();
        };
      });

      media.add("(prefers-reduced-motion: no-preference) and (min-width: 48rem)", () => {
        gsap.to('[data-hero="orbit"]', {
          rotation: "+=360",
          duration: 38,
          delay: 1.4,
          repeat: -1,
          ease: "none",
        });
      });

      return () => media.revert();
    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      data-hero="scene"
      className="relative z-0 isolate grid min-h-[max(100svh,44rem)] place-items-center overflow-hidden bg-paper px-[var(--page-gutter)] pt-16 pb-24 md:pt-20 md:pb-[6.5rem]"
      aria-labelledby="hero-title"
    >
      <HeroOrbit services={liveServices} />
      <HeroServiceFan services={liveServices} />

      <div
        data-hero="copy"
        className="relative z-[3] w-[min(100%,86rem)] text-center will-change-[transform,opacity] motion-reduce:transform-none"
      >
        <p
          data-hero="topline"
          className="mb-4 text-hero-note font-hero-note text-muted md:mb-[1.125rem] md:text-caption"
        >
          FOLLOW THE IDEA.
        </p>
        <h1
          id="hero-title"
          className="m-0 whitespace-nowrap text-hero font-display"
          aria-label={WORDMARK}
        >
          <span
            data-hero="word-mask"
            className="block overflow-hidden pt-[0.14em] pb-[0.12em]"
            aria-hidden="true"
          >
            {Array.from(WORDMARK).map((character, index) => (
              <span
                data-hero="word-char"
                className="inline-block will-change-[transform,opacity,filter]"
                key={`${character}-${index}`}
              >
                {character}
              </span>
            ))}
          </span>
        </h1>
        <p
          data-hero="support"
          className="mx-auto mt-8 max-w-[21rem] text-hero-support font-support text-ink-soft md:mt-[2.375rem] md:max-w-[42.5rem] md:text-hero-support-wide"
        >
          <span className="block">상상을 현실로 옮기고</span>
          <span className="block">그 결과를 세상에 내놓습니다.</span>
        </p>
      </div>
    </section>
  );
}
