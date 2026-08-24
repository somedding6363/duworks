import Image from "next/image";
import type { Service } from "../model/service";

type ServiceFanCardProps = {
  index: number;
  priority?: boolean;
  scope: "hero" | "service";
  service: Service;
  total: number;
};

const imagePositionClasses = {
  center: "object-center",
  "left-top": "object-[left_top]",
  top: "object-top",
} as const;

export function ServiceFanCard({
  index,
  priority = false,
  scope,
  service,
  total,
}: ServiceFanCardProps) {
  return (
    <article
      data-hero-card={scope === "hero" ? "" : undefined}
      data-service-entry-card={scope === "service" ? "" : undefined}
      className="absolute bottom-0 left-0 ml-[clamp(-5.75rem,-19vw,-5rem)] aspect-[4/5] w-[clamp(10rem,38vw,11.5rem)] overflow-hidden rounded-[clamp(1rem,1.8vw,1.5rem)] bg-panel shadow-[0_1.5rem_4.5rem_rgb(23_23_19/0.2)] will-change-[transform,opacity] [backface-visibility:hidden] md:ml-[clamp(-7.75rem,-9vw,-5.75rem)] md:w-[clamp(11.5rem,18vw,15.5rem)]"
      style={{ zIndex: total - Math.abs(index - (total - 1) / 2) }}
    >
      <div className="relative h-[68%] overflow-hidden bg-paper-deep">
        <Image
          src={service.image}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 48rem) 12rem, 16rem"
          className={`object-cover ${imagePositionClasses[service.imagePosition]}`}
        />
      </div>
      <div className="flex h-[32%] flex-col justify-between px-[clamp(0.75rem,1.4vw,1rem)] py-[clamp(0.7rem,1.2vw,0.9rem)]">
        <strong className="text-[clamp(0.85rem,1.45vw,1.15rem)] leading-none tracking-[-0.045em] text-ink">
          {service.name}
        </strong>
        <span className="truncate text-[0.55rem] tracking-[0.08em] text-muted uppercase">
          {String(index + 1).padStart(2, "0")} · {service.host}
        </span>
      </div>
    </article>
  );
}
