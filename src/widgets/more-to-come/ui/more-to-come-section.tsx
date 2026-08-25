"use client";

import { useRef } from "react";
import { ArrowUpIcon, ArrowUpRightIcon } from "@/shared/icons";
import { gsap, ScrollTrigger, useGSAP } from "@/shared/lib/gsap";
import { ScrollButton } from "@/shared/ui";

const touchScrubDuration = 0.08;
const seedMinimumHeight = 112;
const seedMaximumHeight = 160;
const seedVminRatio = 0.18;
const seedViewportHeightLimit = 0.66;
const fieldToSeedScale = 13 / 72;
const seedPath =
  "M500 370 C511.4 370 522.7 371.5 533.6 374.4 C544.6 377.4 555.2 381.7 565 387.4 C574.8 393.1 583.9 400 591.9 408.1 C600 416.1 606.9 425.2 612.6 435 C618.3 444.8 622.6 455.4 625.6 466.4 C628.5 477.3 630 488.6 630 500 C630 511.4 628.5 522.7 625.6 533.6 C622.6 544.6 618.3 555.2 612.6 565 C606.9 574.8 600 583.9 591.9 591.9 C583.9 600 574.8 606.9 565 612.6 C555.2 618.3 544.6 622.6 533.6 625.6 C522.7 628.5 511.4 630 500 630 C488.6 630 477.3 628.5 466.4 625.6 C455.4 622.6 444.8 618.3 435 612.6 C425.2 606.9 416.1 600 408.1 591.9 C400 583.9 393.1 574.8 387.4 565 C381.7 555.2 377.4 544.6 374.4 533.6 C371.5 522.7 370 511.4 370 500 C370 488.6 371.5 477.3 374.4 466.4 C377.4 455.4 381.7 444.8 387.4 435 C393.1 425.2 400 416.1 408.1 408.1 C416.1 400 425.2 393.1 435 387.4 C444.8 381.7 455.4 377.4 466.4 374.4 C477.3 371.5 488.6 370 500 370 Z";
const fieldPath =
  "M500 -220 C562.9 -220 625.6 -211.8 686.3 -195.5 C747.1 -179.2 805.5 -155 860 -123.5 C914.5 -92.1 964.6 -53.6 1009.1 -9.1 C1053.6 35.4 1092.1 85.5 1123.5 140 C1155 194.5 1179.2 252.9 1195.5 313.7 C1211.8 374.4 1220 437.1 1220 500 C1220 562.9 1211.8 625.6 1195.5 686.3 C1179.2 747.1 1155 805.5 1123.5 860 C1092.1 914.5 1053.6 964.6 1009.1 1009.1 C964.6 1053.6 914.5 1092.1 860 1123.5 C805.5 1155 747.1 1179.2 686.3 1195.5 C625.6 1211.8 562.9 1220 500 1220 C437.1 1220 374.4 1211.8 313.7 1195.5 C252.9 1179.2 194.5 1155 140 1123.5 C85.5 1092.1 35.4 1053.6 -9.1 1009.1 C-53.6 964.6 -92.1 914.5 -123.5 860 C-155 805.5 -179.2 747.1 -195.5 686.3 C-211.8 625.6 -220 562.9 -220 500 C-220 437.1 -211.8 374.4 -195.5 313.7 C-179.2 252.9 -155 194.5 -123.5 140 C-92.1 85.5 -53.6 35.4 -9.1 -9.1 C35.4 -53.6 85.5 -92.1 140 -123.5 C194.5 -155 252.9 -179.2 313.7 -195.5 C374.4 -211.8 437.1 -220 500 -220 Z";

export function MoreToComeSection() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const morphSvg = useRef<SVGSVGElement>(null);
  const morphPath = useRef<SVGPathElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const period = useRef<HTMLSpanElement>(null);
  const subtitle = useRef<HTMLParagraphElement>(null);
  const actions = useRef<HTMLDivElement>(null);
  const footerClearance = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const sectionElement = section.current;
        const stageElement = stage.current;
        const svgElement = morphSvg.current;
        const pathElement = morphPath.current;
        const contentElement = content.current;
        const titleElement = title.current;
        const periodElement = period.current;
        const subtitleElement = subtitle.current;
        const actionsElement = actions.current;
        const footerClearanceElement = footerClearance.current;
        if (
          !sectionElement ||
          !stageElement ||
          !svgElement ||
          !pathElement ||
          !contentElement ||
          !titleElement ||
          !periodElement ||
          !subtitleElement ||
          !actionsElement ||
          !footerClearanceElement
        ) {
          return;
        }

        const seedBounds = pathElement.getBBox();

        const getPeriodTarget = () => {
          const svgRect = svgElement.getBoundingClientRect();
          const periodRect = periodElement.getBoundingClientRect();
          const pixelsPerUnitX = svgRect.width / 1000;
          const pixelsPerUnitY = svgRect.height / 1000;
          const seedCenterX = seedBounds.x + seedBounds.width / 2;
          const seedCenterY = seedBounds.y + seedBounds.height / 2;

          return {
            x:
              (periodRect.left + periodRect.width / 2 - svgRect.left) / pixelsPerUnitX -
              seedCenterX,
            y:
              (periodRect.top + periodRect.height / 2 - svgRect.top) / pixelsPerUnitY - seedCenterY,
            scale: Math.min(
              periodRect.width / (seedBounds.width * pixelsPerUnitX),
              periodRect.height / (seedBounds.height * pixelsPerUnitY),
            ),
          };
        };

        const getSeedScale = () => {
          const svgRect = svgElement.getBoundingClientRect();
          const unscaledSeedHeight = seedBounds.height * (svgRect.height / 1000);
          if (unscaledSeedHeight === 0) return 1;

          const fluidSeedHeight = Math.min(window.innerWidth, window.innerHeight) * seedVminRatio;
          const consistentSeedHeight = Math.min(
            seedMaximumHeight,
            Math.max(seedMinimumHeight, fluidSeedHeight),
          );
          const targetSeedHeight = Math.min(
            consistentSeedHeight,
            window.innerHeight * seedViewportHeightLimit,
          );

          return targetSeedHeight / unscaledSeedHeight;
        };

        const getTitleCenterOffset = () => {
          const contentRect = contentElement.getBoundingClientRect();
          const titleRect = titleElement.getBoundingClientRect();
          const titleCenterWithinContent = titleRect.top - contentRect.top + titleRect.height / 2;

          return contentRect.height / 2 - titleCenterWithinContent;
        };

        gsap.set(pathElement, {
          autoAlpha: 1,
          rotation: 0,
          scale: getSeedScale,
          transformOrigin: "50% 50%",
          x: 500 - (seedBounds.x + seedBounds.width / 2),
          y: 500 - (seedBounds.y + seedBounds.height / 2),
        });
        gsap.set(titleElement, {
          autoAlpha: 0,
          color: "var(--color-panel)",
        });
        gsap.set(periodElement, { autoAlpha: 0 });
        gsap.set([subtitleElement, actionsElement], { autoAlpha: 0, y: 18 });

        const updateFooterClearance = () => {
          const contentOverflow = Math.max(
            0,
            (contentElement.getBoundingClientRect().height - window.innerHeight) / 2,
          );

          gsap.set(footerClearanceElement, { height: contentOverflow + 24 });
        };

        updateFooterClearance();

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: sectionElement,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * 2.35)}`,
            pin: stageElement,
            pinSpacing: true,
            anticipatePin: 1,
            scrub: ScrollTrigger.isTouch === 1 ? touchScrubDuration : true,
            invalidateOnRefresh: true,
            onRefreshInit: updateFooterClearance,
          },
        });

        timeline
          .set(titleElement, { y: () => getTitleCenterOffset() }, 0)
          .fromTo(
            pathElement,
            {
              scale: getSeedScale,
            },
            {
              morphSVG: { shape: fieldPath, type: "rotational" },
              rotation: 0,
              scale: 1,
              duration: 0.64,
              ease: "none",
            },
            0,
          )
          .to(
            titleElement,
            {
              autoAlpha: 1,
              duration: 0.56,
              ease: "none",
            },
            0,
          )
          .to(
            pathElement,
            {
              rotation: 0,
              scale: () => getPeriodTarget().scale * fieldToSeedScale,
              x: () => getPeriodTarget().x,
              y: () => getPeriodTarget().y,
              duration: 0.56,
              ease: "none",
            },
            0.78,
          )
          .set(titleElement, { color: "var(--color-ink)" }, 1.34)
          .set(periodElement, { autoAlpha: 1 }, 1.34)
          .set(pathElement, { autoAlpha: 0 }, 1.34)
          .to(
            titleElement,
            {
              y: 0,
              duration: 0.22,
              ease: "power2.inOut",
            },
            1.34,
          )
          .to(
            [subtitleElement, actionsElement],
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.2,
              stagger: 0.04,
              ease: "none",
            },
            1.35,
          );
      });

      return () => media.revert();
    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      id="next"
      className="relative scroll-mt-20 bg-white"
      aria-labelledby="more-title"
    >
      <div
        ref={stage}
        className="relative grid h-svh place-items-center px-5 py-16 motion-reduce:h-auto motion-reduce:min-h-[40rem]"
      >
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
          aria-hidden="true"
        >
          <svg
            ref={morphSvg}
            className="absolute top-1/2 left-1/2 size-[120vmax] -translate-x-1/2 -translate-y-1/2 overflow-visible"
            viewBox="0 0 1000 1000"
          >
            <path ref={morphPath} d={seedPath} className="opacity-0" fill="var(--color-ink)" />
          </svg>
        </div>

        <div
          ref={content}
          className="absolute top-1/2 left-1/2 z-[2] w-[min(57.5rem,calc(100%_-_2.5rem))] -translate-x-1/2 -translate-y-1/2 text-center motion-reduce:relative motion-reduce:top-auto motion-reduce:left-auto motion-reduce:translate-x-0 motion-reduce:translate-y-0"
        >
          <h2
            ref={title}
            id="more-title"
            aria-label="MORE TO COME."
            className="text-more-compact font-display text-panel opacity-0 md:text-more motion-reduce:text-ink motion-reduce:opacity-100"
          >
            MORE
            <br />
            TO COME
            <span
              ref={period}
              aria-hidden="true"
              className="ml-[0.025em] inline-block size-[0.105em] rounded-full bg-current [vertical-align:0.04em] motion-reduce:opacity-100"
            />
          </h2>
          <p
            ref={subtitle}
            className="mt-6 text-more-subtitle text-muted opacity-0 motion-reduce:opacity-100 [@media(max-height:40rem)]:mt-4 [@media(max-height:22rem)]:mt-2"
          >
            다음 서비스를 만들고 다듬는 중입니다.
          </p>

          <div
            ref={actions}
            className="mx-auto mt-10 grid w-full max-w-xl grid-cols-2 border-y border-line opacity-0 motion-reduce:opacity-100 [@media(max-height:40rem)]:mt-6 [@media(max-height:22rem)]:mt-2"
          >
            <ScrollButton
              targetId="services"
              scrollTriggerId="services-expansion"
              className="group flex min-h-16 cursor-pointer items-center justify-between px-4 text-interface text-ink transition-colors duration-300 hover:bg-panel sm:px-6 [@media(max-height:22rem)]:min-h-11"
            >
              서비스 보기
              <ArrowUpIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1" />
            </ScrollButton>
            <a
              href="mailto:duworks.contact@gmail.com"
              aria-label="프로젝트 문의: duworks.contact@gmail.com"
              className="group flex min-h-16 items-center justify-between border-l border-line px-4 text-interface text-ink transition-colors duration-300 hover:bg-panel sm:px-6 [@media(max-height:22rem)]:min-h-11"
            >
              프로젝트 문의
              <ArrowUpRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
          </div>
        </div>
      </div>
      <div ref={footerClearance} className="h-0 bg-white motion-reduce:hidden" aria-hidden="true" />
    </section>
  );
}
