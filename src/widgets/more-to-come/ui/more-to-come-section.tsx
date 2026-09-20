"use client";

import Image from "next/image";
import { useRef } from "react";
import { imagePositionClasses, liveServices } from "@/entities/service";
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

type FlyItemLayout = Omit<FlyItem, "depth" | "serviceIndex">;

const flyItemLayouts: FlyItemLayout[][] = [
  [
    {
      kind: "domain",
      x: "27vw",
      y: "-27vh",
      width: "auto",
    },
    {
      kind: "image",
      x: "-31vw",
      y: "-15vh",
      width: "clamp(17rem,42vw,46rem)",
    },
  ],
  [
    {
      kind: "image",
      x: "29vw",
      y: "15vh",
      width: "clamp(18rem,46vw,50rem)",
    },
    {
      kind: "domain",
      x: "-12vw",
      y: "-31vh",
      width: "auto",
    },
  ],
  [
    {
      kind: "image",
      x: "-25vw",
      y: "24vh",
      width: "clamp(19rem,52vw,56rem)",
    },
    {
      kind: "domain",
      x: "18vw",
      y: "29vh",
      width: "auto",
    },
  ],
  [
    {
      kind: "domain",
      x: "-24vw",
      y: "8vh",
      width: "auto",
    },
    {
      kind: "image",
      x: "25vw",
      y: "-22vh",
      width: "clamp(18rem,48vw,52rem)",
    },
  ],
];

// 서비스 수가 바뀌어도 마지막 장면에서 모든 서비스가 이미지와 도메인으로 한 번씩 지나가게 한다.
const flyItemsWithoutDepth = liveServices.flatMap((_, serviceIndex) =>
  flyItemLayouts[serviceIndex % flyItemLayouts.length].map((item) => ({
    ...item,
    serviceIndex,
  })),
);
const flyItems: FlyItem[] = flyItemsWithoutDepth.map((item, index) => ({
  ...item,
  depth: 0.14 + (index * 0.68) / Math.max(1, flyItemsWithoutDepth.length - 1),
}));

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
        const supporting = stageElement.querySelector<HTMLElement>("[data-finale-supporting]");
        const supportingCopy = stageElement.querySelector<HTMLElement>("[data-finale-copy]");
        const supportingActions = stageElement.querySelector<HTMLElement>("[data-finale-actions]");
        const items = gsap.utils.toArray<HTMLElement>("[data-finale-item]", stageElement);
        if (!world || !title || !supporting || !supportingCopy || !supportingActions) return;

        const getFinalePan = () => {
          const visibleHeight = Math.min(stageElement.clientHeight, window.innerHeight);
          const supportingBottom = supporting.offsetTop + supporting.offsetHeight;

          return Math.max(0, supportingBottom - visibleHeight + 24);
        };

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
            end: () => `+=${Math.round(window.innerHeight * 6)}`,
            pin: stageElement,
            pinSpacing: true,
            // normalizeScroll이 스크롤 위치를 프레임마다 맞춰 주므로 미리 잡을 이유가 없다.
            // 남겨 두면 고속에서 핀 지점에 닿기도 전에 stage를 당겨 올려 오히려 튄다.
            anticipatePin: 0,
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
          .to(
            [title, supporting],
            { y: () => -getFinalePan(), duration: 0.24, ease: "power2.inOut" },
            1.08,
          )
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
        className="relative h-svh overflow-hidden bg-ink motion-reduce:h-auto motion-reduce:min-h-[42rem]"
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
          className="absolute inset-x-0 top-[calc(min(50%,50svh)+clamp(7rem,12vw,12.5rem)+2rem)] z-[2] mx-auto w-[min(36rem,calc(100%_-_2.5rem))] motion-reduce:opacity-100"
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
