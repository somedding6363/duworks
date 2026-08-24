import type { Service } from "@/entities/service";
import { ArrowUpRightIcon } from "@/shared/icons";
import { ServiceCardVisual } from "./service-card-visual";

type ServiceCardProps = {
  index: number;
  service: Service;
};

export function ServiceCard({ index, service }: ServiceCardProps) {
  return (
    <a
      data-service-grid-card
      data-index={index}
      href={service.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${service.name} 서비스 열기`}
      className="group relative isolate flex size-full origin-center flex-col overflow-hidden rounded-[clamp(1rem,1.8vw,1.5rem)] bg-panel text-ink shadow-[0_1.5rem_4rem_rgb(23_23_19/0.11)] will-change-transform [backface-visibility:hidden] transition-[box-shadow] duration-500 hover:shadow-[0_2rem_5.5rem_rgb(23_23_19/0.17)] focus-visible:outline-ink md:rounded-[clamp(1.25rem,2vw,1.75rem)]"
    >
      <div className="relative h-[68%] flex-none overflow-hidden bg-paper-deep md:h-[52%]">
        <ServiceCardVisual service={service} priority={index === 0} />
      </div>

      <div className="flex h-[32%] flex-none flex-col px-[clamp(0.75rem,1.4vw,1rem)] py-[clamp(0.7rem,1.2vw,0.9rem)] md:h-auto md:flex-1 md:p-[clamp(1.25rem,2vw,1.75rem)]">
        <div className="order-3 mt-auto flex items-center justify-between gap-2 text-[0.55rem] font-semibold tracking-[0.08em] text-muted uppercase md:order-none md:mt-0 md:gap-4 md:text-service-queue-meta">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span className="truncate">{service.host}</span>
        </div>
        <h3 className="order-1 text-[clamp(0.85rem,3.7vw,1.15rem)] leading-none font-display tracking-[-0.045em] md:order-none md:mt-4 md:text-[clamp(2rem,3.4vw,3.5rem)] md:leading-[0.92] md:tracking-[-0.055em]">
          {service.name}
        </h3>
        <p className="mt-3 hidden max-w-[32rem] text-service-summary text-ink/62 pretty md:block">
          {service.summary}
        </p>
        <span className="mt-auto hidden min-h-11 items-end justify-between gap-3 pt-4 text-service-action font-bold md:inline-flex">
          서비스 열기
          <ArrowUpRightIcon className="mb-0.5 size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </a>
  );
}
