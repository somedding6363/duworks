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
      className="group relative isolate flex min-h-full w-full origin-center flex-col overflow-hidden rounded-[clamp(1rem,1.8vw,1.5rem)] bg-panel text-ink shadow-[0_1.5rem_4rem_rgb(23_23_19/0.11)] will-change-transform [backface-visibility:hidden] transition-[box-shadow] duration-500 hover:shadow-[0_2rem_5.5rem_rgb(23_23_19/0.17)] focus-visible:outline-ink md:rounded-[clamp(1.25rem,2vw,1.75rem)]"
    >
      <div className="relative aspect-[30/11] w-full flex-none overflow-hidden bg-paper-deep xl:aspect-[20/13]">
        <ServiceCardVisual service={service} priority={index === 0} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col p-[clamp(0.9rem,3.6vw,1.25rem)] xl:p-[clamp(1.25rem,2vw,1.75rem)]">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 text-[0.55rem] font-semibold tracking-[0.08em] text-muted uppercase md:gap-4 md:text-service-queue-meta">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span className="text-right [overflow-wrap:anywhere]">{service.host}</span>
        </div>
        <h3 className="mt-3 text-[clamp(1.25rem,5vw,1.65rem)] leading-[0.95] font-display tracking-[-0.04em] md:mt-4 md:text-[clamp(1.5rem,3vw,2.5rem)] xl:text-[clamp(2rem,3.4vw,3.5rem)] xl:leading-[0.92] xl:tracking-[-0.055em]">
          {service.name}
        </h3>
        <p className="mt-2 max-w-[32rem] text-[clamp(0.75rem,3.2vw,0.9rem)] leading-[1.45] text-ink/62 pretty md:mt-3 md:text-service-summary">
          {service.summary}
        </p>
        <span className="mt-auto inline-flex items-end justify-between gap-3 pt-2 text-[clamp(0.7rem,3vw,0.8rem)] font-bold md:min-h-11 md:pt-3 md:text-service-action xl:pt-4">
          서비스 바로가기
          <ArrowUpRightIcon className="mb-0.5 size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </a>
  );
}
