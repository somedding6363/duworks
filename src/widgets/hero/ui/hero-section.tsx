"use client";

import { useRef } from "react";
import { liveServices } from "@/entities/service";
import { gsap, useGSAP } from "@/shared/lib/gsap";
import { ScrollButton } from "@/shared/ui";
import { HeroOrbit } from "./hero-orbit";

const WORDMARK = "DUWORKS";

export function HeroSection() {
  const section = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
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
            '[data-hero="service-label"]',
            { y: 14, scale: 0.84, autoAlpha: 0, stagger: 0.08, duration: 0.7 },
            "-=0.58",
          )
          .from('[data-hero="scroll-cue"]', { autoAlpha: 0, duration: 0.5 }, "-=0.2");

        gsap.to('[data-hero="scroll-cue"]', {
          y: 7,
          duration: 0.85,
          delay: 2.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        gsap.utils.toArray<HTMLElement>('[data-hero="service-label"]').forEach((label, index) => {
          gsap.to(label, {
            y: index % 2 === 0 ? 7 : -7,
            duration: 4.2 + index * 0.45,
            delay: 1.5 + index * 0.08,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          });
        });

        gsap.to('[data-hero="copy"]', {
          yPercent: 9,
          scale: 0.985,
          autoAlpha: 0.3,
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        gsap.to('[data-hero="grid"]', {
          yPercent: 7,
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
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
      className="relative grid min-h-[max(100svh,25rem)] place-items-center overflow-hidden bg-paper px-[var(--page-gutter)] pt-16 pb-24 md:pt-20 md:pb-[6.5rem]"
      aria-labelledby="hero-title"
    >
      <HeroOrbit services={liveServices} />

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

      <ScrollButton
        data-hero="scroll-cue"
        targetId="service-index"
        className="absolute bottom-20 left-1/2 z-[5] flex -translate-x-1/2 cursor-pointer items-center whitespace-nowrap text-scroll-cue font-utility text-muted md:bottom-7"
      >
        <span
          className="mr-3 h-px w-10 bg-linear-to-l from-ink to-transparent"
          aria-hidden="true"
        />
        <span>SCROLL TO EXPLORE</span>
        <span
          className="ml-3 h-px w-10 bg-linear-to-r from-ink to-transparent"
          aria-hidden="true"
        />
      </ScrollButton>
    </section>
  );
}
