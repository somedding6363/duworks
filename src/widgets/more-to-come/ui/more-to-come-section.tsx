"use client";

import { useRef } from "react";
import { ArrowUpIcon, ArrowUpRightIcon } from "@/shared/icons";
import { gsap, useGSAP } from "@/shared/lib/gsap";
import { ScrollButton } from "@/shared/ui";

export function MoreToComeSection() {
  const section = useRef<HTMLElement>(null);
  const axis = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLDivElement>(null);
  const contentTrack = useRef<HTMLDivElement>(null);
  const finalContent = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const axisElement = axis.current;
        const originElement = origin.current;
        const contentTrackElement = contentTrack.current;
        const finalContentElement = finalContent.current;
        if (!axisElement || !originElement || !contentTrackElement || !finalContentElement) return;

        const getContentPan = () => {
          const safeBottom = 24;
          const contentBottom = finalContentElement.offsetTop + finalContentElement.offsetHeight;
          return -Math.max(0, contentBottom - (window.innerHeight - safeBottom));
        };

        gsap.set(finalContentElement, { opacity: 0, scale: 1.12 });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section.current,
            start: "top 50%",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to(originElement, {
            scale: 1,
            duration: 0.08,
            ease: "power2.out",
          })
          .to(
            axisElement,
            {
              width: "74vw",
              duration: 0.42,
              ease: "power3.inOut",
            },
            "<",
          )
          .to(axisElement, {
            rotation: 90,
            width: "58vh",
            duration: 0.34,
            ease: "power3.inOut",
          })
          .to(axisElement, {
            width: 1,
            duration: 0.2,
            ease: "power3.in",
          })
          .to(axisElement, {
            opacity: 0,
            duration: 0.18,
            ease: "power2.out",
          })
          .to(
            originElement,
            {
              scale: 0,
              opacity: 0,
              duration: 0.18,
            },
            "<",
          )
          .to(
            finalContentElement,
            {
              opacity: 1,
              scale: 1,
              duration: 0.56,
              ease: "power4.out",
            },
            "-=0.02",
          )
          .from(
            ['[data-more="title"]', '[data-more="subtitle"]', '[data-more="actions"]'],
            {
              y: 28,
              opacity: 0,
              duration: 0.56,
              ease: "power4.out",
            },
            "<",
          )
          .to(contentTrackElement, {
            y: getContentPan,
            duration: 0.38,
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
      id="next"
      className="relative h-[320svh] min-h-[40rem] scroll-mt-20 bg-paper motion-reduce:h-auto"
      aria-labelledby="more-title"
    >
      <div className="sticky top-0 grid h-svh place-items-center overflow-hidden motion-reduce:relative motion-reduce:h-auto motion-reduce:min-h-[40rem] motion-reduce:overflow-visible">
        <div
          data-more="axis-frame"
          className="absolute top-1/2 left-1/2 z-[2] -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
        >
          <div
            ref={axis}
            className="h-px w-px origin-center bg-ink will-change-[transform,width,opacity] motion-reduce:hidden"
          />
        </div>
        <div
          ref={origin}
          className="absolute top-1/2 left-1/2 z-[3] size-[0.4375rem] -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-ink will-change-[transform,opacity] motion-reduce:hidden"
          aria-hidden="true"
        />

        <div
          ref={contentTrack}
          className="absolute top-0 left-0 grid h-full min-h-[40rem] w-full place-items-center will-change-transform motion-reduce:relative motion-reduce:h-auto"
        >
          <div
            ref={finalContent}
            className="relative z-[5] w-[min(57.5rem,calc(100%_-_2.5rem))] text-center opacity-100 will-change-[transform,opacity] motion-reduce:transform-none motion-reduce:opacity-100"
          >
            <h2
              id="more-title"
              data-more="title"
              className="text-more-compact font-display md:text-more"
            >
              MORE
              <br />
              TO COME.
            </h2>
            <p data-more="subtitle" className="mt-6 text-more-subtitle text-muted">
              다음 서비스를 만들고 다듬는 중입니다.
            </p>

            <div
              data-more="actions"
              className="mx-auto mt-10 grid w-full max-w-xl grid-cols-2 border-y border-line"
            >
              <ScrollButton
                targetId="services"
                className="group flex min-h-16 cursor-pointer items-center justify-between px-4 text-interface text-ink transition-colors duration-300 hover:bg-panel sm:px-6"
              >
                서비스 보기
                <ArrowUpIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1" />
              </ScrollButton>
              <a
                href="mailto:duworks.contact@gmail.com"
                aria-label="프로젝트 문의: duworks.contact@gmail.com"
                className="group flex min-h-16 items-center justify-between border-l border-line px-4 text-interface text-ink transition-colors duration-300 hover:bg-panel sm:px-6"
              >
                프로젝트 문의
                <ArrowUpRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
