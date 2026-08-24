"use client";

import { useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/shared/lib/gsap";
import { services } from "@/entities/service";

const minimumCopyCount = 4;
const tickerFrameClassName =
  "relative z-[2] overflow-hidden border-y border-[var(--line-soft)] bg-panel py-3.5 before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:z-[2] before:w-[7%] before:bg-linear-to-r before:from-panel before:to-transparent before:content-[''] after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:z-[2] after:w-[7%] after:bg-linear-to-l after:from-panel after:to-transparent after:content-[''] md:before:w-[12%] md:after:w-[12%]";
const tickerRowClassName = "flex w-max will-change-transform motion-reduce:transform-none";
const tickerItemClassName =
  "relative inline-flex items-center justify-center px-10 text-ticker font-bold whitespace-nowrap text-ink after:absolute after:top-1/2 after:right-0 after:size-2 after:translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-ink-faint after:content-['']";
const tickerOutlineClassName = "text-transparent [-webkit-text-stroke:1px_var(--color-ink-faint)]";

function getSeamlessCycle<T>(items: readonly T[]) {
  return items.length % 2 === 0 ? [...items] : [...items, ...items];
}

function getRequiredCopyCount(viewportWidth: number, sequenceWidths: number[]) {
  return Math.max(
    minimumCopyCount,
    ...sequenceWidths.map((sequenceWidth) =>
      sequenceWidth > 0 ? Math.ceil(viewportWidth / sequenceWidth) + 2 : minimumCopyCount,
    ),
  );
}

function getCycleWidth(row: HTMLDivElement, cycleLength: number) {
  const firstItem = row.children.item(0);
  const repeatedItem = row.children.item(cycleLength);

  if (!firstItem || !repeatedItem) return 0;

  return repeatedItem.getBoundingClientRect().left - firstItem.getBoundingClientRect().left;
}

const nameCycle = getSeamlessCycle(services);
const hostCycle = getSeamlessCycle([...services].reverse());

export function ServiceTicker() {
  const root = useRef<HTMLDivElement>(null);
  const firstRow = useRef<HTMLDivElement>(null);
  const secondRow = useRef<HTMLDivElement>(null);
  const [copyCount, setCopyCount] = useState(minimumCopyCount);

  const repeatedServices = useMemo(
    () => Array.from({ length: copyCount }, () => nameCycle).flat(),
    [copyCount],
  );
  const repeatedReverseServices = useMemo(
    () => Array.from({ length: copyCount }, () => hostCycle).flat(),
    [copyCount],
  );

  useGSAP(
    () => {
      const rowOne = firstRow.current;
      const rowTwo = secondRow.current;
      const rootElement = root.current;
      if (!rowOne || !rowTwo || !rootElement) return;

      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        let widthOne = getCycleWidth(rowOne, nameCycle.length);
        let widthTwo = getCycleWidth(rowTwo, hostCycle.length);
        let xOne = 0;
        let xTwo = -widthTwo;
        let velocity = 0;
        let targetVelocity = 0;

        const hasEnoughCopies = () => {
          const requiredCopyCount = getRequiredCopyCount(rootElement.clientWidth, [
            widthOne,
            widthTwo,
          ]);

          if (requiredCopyCount === copyCount) return true;

          setCopyCount(requiredCopyCount);
          return false;
        };

        if (!hasEnoughCopies()) return;

        const measure = () => {
          widthOne = getCycleWidth(rowOne, nameCycle.length);
          widthTwo = getCycleWidth(rowTwo, hostCycle.length);

          if (!hasEnoughCopies()) return;

          xOne = gsap.utils.wrap(-widthOne, 0, xOne);
          xTwo = gsap.utils.wrap(-widthTwo, 0, xTwo);
        };

        const scrollObserver = ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => {
            targetVelocity = self.getVelocity() / 1000;
          },
        });

        const frame = (_time: number, deltaTime: number) => {
          const frameScale = Math.min(deltaTime / 16.667, 3);
          velocity += (targetVelocity - velocity) * 0.12;
          targetVelocity *= 0.84;

          xOne = gsap.utils.wrap(-widthOne, 0, xOne - (0.55 + velocity * 0.32) * frameScale);
          xTwo = gsap.utils.wrap(-widthTwo, 0, xTwo + (0.45 + velocity * 0.32) * frameScale);

          gsap.set(rowOne, { x: xOne, force3D: true });
          gsap.set(rowTwo, { x: xTwo, force3D: true });
        };

        const resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(rowOne);
        resizeObserver.observe(rowTwo);
        resizeObserver.observe(rootElement);
        gsap.ticker.add(frame);

        return () => {
          gsap.ticker.remove(frame);
          scrollObserver.kill();
          resizeObserver.disconnect();
        };
      });

      return () => media.revert();
    },
    { dependencies: [copyCount], revertOnUpdate: true, scope: root },
  );

  return (
    <div ref={root} id="service-index" className="scroll-mt-20 bg-panel" aria-hidden="true">
      <div className={tickerFrameClassName}>
        <div ref={firstRow} className={tickerRowClassName}>
          {repeatedServices.map((service, index) => (
            <span
              className={`${tickerItemClassName} min-w-[var(--ticker-name-min-width)] ${
                index % 2 === 1 ? tickerOutlineClassName : ""
              }`}
              key={`${service.name}-name-${index}`}
            >
              {service.name}
            </span>
          ))}
        </div>
      </div>

      <div className={`${tickerFrameClassName} border-t-0`}>
        <div ref={secondRow} className={tickerRowClassName}>
          {repeatedReverseServices.map((service, index) => (
            <span
              className={`${tickerItemClassName} min-w-[var(--ticker-host-min-width)] ${
                index % 2 === 0 ? tickerOutlineClassName : ""
              }`}
              key={`${service.host}-host-${index}`}
            >
              {service.host}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
