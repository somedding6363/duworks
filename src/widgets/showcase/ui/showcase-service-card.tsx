import Image from "next/image";
import type { Service } from "@/entities/service";
import { ArrowUpRightIcon } from "@/shared/icons";

const imagePositionClasses = {
  center: "object-center",
  "left-top": "object-[left_top]",
  top: "object-top",
} as const;

type ShowcaseServiceCardProps = {
  index: number;
  service: Service;
};

// 원통 위에 크게 떠오르는 서비스 패널.
export function ShowcaseServiceCard({ index, service }: ShowcaseServiceCardProps) {
  return (
    <article className="relative h-full overflow-hidden rounded-[1.5rem] bg-ink text-white-soft">
      <div className="absolute inset-0 flex flex-col">
        <Image
          src={service.image}
          alt={service.imageAlt}
          fill
          sizes="(max-width: 48rem) 90vw, 40rem"
          className={`object-cover ${imagePositionClasses[service.imagePosition]}`}
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-ink)_0%,rgb(23_23_19/0.92)_40%,transparent_75%)]"
          aria-hidden="true"
        />
        <div className="relative mt-auto p-5 md:p-8">
          <p className="text-showcase-service-meta tracking-[0.12em] text-white-soft/70 uppercase">
            {String(index + 1).padStart(2, "0")} · {service.host}
          </p>
          <h3 className="mt-2 text-showcase-service-title font-display">{service.name}</h3>
          <p className="mt-2 text-showcase-service-summary text-white-soft/90 pretty">
            {service.summary}
          </p>
          <a
            href={service.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${service.name} 서비스 열기`}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-control bg-white-soft px-5 text-interface font-bold whitespace-nowrap text-ink transition-transform duration-300 ease-fluid active:scale-[0.97]"
          >
            서비스 바로가기
            <ArrowUpRightIcon className="size-4" />
          </a>
        </div>
      </div>
    </article>
  );
}
