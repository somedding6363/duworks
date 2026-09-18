"use client";

import Image from "next/image";
import { useRef } from "react";
import { liveServices } from "@/entities/service";
import { ArrowUpIcon, ArrowUpRightIcon } from "@/shared/icons";
import { gsap, ScrollTrigger, useGSAP } from "@/shared/lib/gsap";
import { ScrollButton } from "@/shared/ui";

const touchScrubDuration = 0.08;
const scenePerspective = 1100;
const sceneDepth = 3600;
const timelineEnd = 1.46;

type FlyItem = {
  depth: number;
  kind: "image" | "domain";
  serviceIndex: number;
  width: string;
  x: string;
  y: string;
};

const flyItems: FlyItem[] = [
  {
    kind: "domain",
    serviceIndex: 0,
    x: "27vw",
    y: "-27vh",
    depth: 0.16,
    width: "auto",
  },
  {
    kind: "image",
    serviceIndex: 0,
    x: "-31vw",
    y: "-15vh",
    depth: 0.27,
    width: "clamp(17rem,42vw,46rem)",
  },
  {
    kind: "image",
    serviceIndex: 1,
    x: "29vw",
    y: "15vh",
    depth: 0.45,
    width: "clamp(18rem,46vw,50rem)",
  },
  {
    kind: "domain",
    serviceIndex: 1,
    x: "-12vw",
    y: "-31vh",
    depth: 0.57,
    width: "auto",
  },
  {
    kind: "image",
    serviceIndex: 2,
    x: "-25vw",
    y: "24vh",
    depth: 0.7,
    width: "clamp(19rem,52vw,56rem)",
  },
  {
    kind: "domain",
    serviceIndex: 2,
    x: "18vw",
    y: "29vh",
    depth: 0.82,
    width: "auto",
  },
];

const imagePositionClasses = {
  center: "object-center",
  "left-top": "object-[left_top]",
  top: "object-top",
} as const;

export function MoreToComeSection() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const sectionElement = section.current;
        const stageElement = stage.current;
        if (!sectionElement || !stageElement) return;

        const world = stageElement.querySelector<HTMLElement>("[data-finale-world]");
        const title = stageElement.querySelector<HTMLElement>("[data-finale-title]");
        const supportingCopy = stageElement.querySelector<HTMLElement>("[data-finale-copy]");
        const supportingActions = stageElement.querySelector<HTMLElement>("[data-finale-actions]");
        const items = gsap.utils.toArray<HTMLElement>("[data-finale-item]", stageElement);
        if (!world || !title || !supportingCopy || !supportingActions) return;

        gsap.set(stageElement, {
          perspective: scenePerspective,
          perspectiveOrigin: "50% min(50%, 50svh)",
        });
        gsap.set(world, { transformStyle: "preserve-3d", z: 0, force3D: true });
        gsap.set(title, { z: -sceneDepth, force3D: true });
        gsap.set([supportingCopy, supportingActions], { autoAlpha: 0, y: 28 });

        items.forEach((item, index) => {
          gsap.set(item, {
            xPercent: -50,
            yPercent: -50,
            z: -flyItems[index].depth * sceneDepth,
            force3D: true,
          });
        });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: sectionElement,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * 4.2)}`,
            pin: stageElement,
            pinSpacing: true,
            anticipatePin: 1,
            scrub: ScrollTrigger.isTouch === 1 ? touchScrubDuration : true,
            invalidateOnRefresh: true,
          },
        });

        timeline.to(world, { z: sceneDepth, duration: 1, ease: "power1.in" }, 0);

        items.forEach((item, index) => {
          const { depth } = flyItems[index];
          const fadeAt = Math.min(0.9, depth + 0.06);
          timeline.to(item, { autoAlpha: 0, duration: 0.07, ease: "none" }, fadeAt);
        });

        timeline
          .fromTo(
            title,
            { filter: "blur(7px)" },
            { filter: "blur(0px)", duration: 0.28, ease: "none" },
            0.72,
          )
          // 모든 부유 요소가 사라진 뒤에는 문구만 잠시 남긴다.
          .to(supportingCopy, { autoAlpha: 1, y: 0, duration: 0.18, ease: "power2.out" }, 1.14)
          .to(supportingActions, { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out" }, 1.22)
          // CTA가 완전히 자리 잡은 상태까지 스크롤 구간을 유지한다.
          .to({}, { duration: 0 }, timelineEnd);

        return () => {
          timeline.scrollTrigger?.kill();
          timeline.kill();
        };
      });

      return () => media.revert();
    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      id="next"
      className="relative isolate bg-ink text-white-soft"
      aria-labelledby="more-title"
    >
      <div
        ref={stage}
        className="relative h-svh min-h-[38rem] overflow-hidden bg-ink motion-reduce:h-auto motion-reduce:min-h-[42rem]"
      >
        <div
          data-finale-world
          className="absolute inset-x-0 top-0 h-[min(100%,100svh)] motion-reduce:static motion-reduce:flex motion-reduce:h-auto motion-reduce:min-h-[42rem] motion-reduce:items-center"
        >
          {flyItems.map((item) => {
            const service = liveServices[item.serviceIndex];
            if (!service) return null;

            return (
              <div
                data-finale-item
                key={`${item.kind}-${service.host}`}
                className="pointer-events-none absolute top-1/2 left-1/2 motion-reduce:hidden"
                style={{ marginLeft: item.x, marginTop: item.y, width: item.width }}
                aria-hidden="true"
              >
                {item.kind === "image" ? (
                  <div className="relative aspect-[8/5] overflow-hidden rounded-[1rem] bg-ink-soft shadow-[0_2rem_6rem_rgb(0_0_0/0.42)]">
                    <Image
                      src={service.image}
                      alt=""
                      fill
                      sizes="(max-width: 48rem) 50vw, 34vw"
                      className={`object-cover ${imagePositionClasses[service.imagePosition]}`}
                    />
                    <div
                      className="absolute inset-0 ring-1 ring-white-soft/15 ring-inset"
                      aria-hidden="true"
                    />
                  </div>
                ) : (
                  <span className="inline-flex min-h-11 items-center rounded-control border border-white-soft/25 bg-ink/75 px-6 text-interface font-semibold whitespace-nowrap text-white-soft/90 backdrop-blur-md">
                    {service.host}
                  </span>
                )}
              </div>
            );
          })}

          <div
            data-finale-title
            className="absolute inset-0 grid place-items-center px-5 text-center will-change-transform motion-reduce:static motion-reduce:w-full motion-reduce:transform-none"
          >
            <h2
              id="more-title"
              className="m-0 text-[clamp(4.4rem,16vw,13rem)] leading-[0.76] font-display tracking-[-0.04em] whitespace-nowrap text-white-soft"
            >
              MORE
              <br />
              TO COME<span className="text-teal">.</span>
            </h2>
          </div>
        </div>

        <div
          data-finale-supporting
          className="absolute inset-x-0 bottom-[max(2rem,env(safe-area-inset-bottom))] z-[2] mx-auto w-[min(36rem,calc(100%_-_2.5rem))] motion-reduce:opacity-100"
        >
          <p data-finale-copy className="text-center text-more-subtitle text-white-soft/65">
            다음 서비스를 만들고 다듬는 중입니다.
          </p>
          <div data-finale-actions className="mt-5 grid grid-cols-2 border-y border-white-soft/20">
            <ScrollButton
              targetId="showcase"
              scrollTriggerId="showcase-services"
              className="group flex min-h-14 cursor-pointer items-center justify-between px-4 text-interface text-white-soft transition-colors duration-300 hover:bg-white-soft/10 sm:px-6"
            >
              서비스 보기
              <ArrowUpIcon className="size-4 transition-transform duration-300 group-hover:-translate-y-1" />
            </ScrollButton>
            <a
              href="mailto:duworks.contact@gmail.com"
              aria-label="프로젝트 문의: duworks.contact@gmail.com"
              className="group flex min-h-14 items-center justify-between border-l border-white-soft/20 px-4 text-interface text-white-soft transition-colors duration-300 hover:bg-white-soft/10 sm:px-6"
            >
              프로젝트 문의
              <ArrowUpRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
