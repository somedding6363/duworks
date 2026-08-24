import Image from "next/image";
import type { Service } from "@/entities/service";

type ServiceCardVisualProps = {
  priority?: boolean;
  service: Service;
};

const imagePositionClasses = {
  center: "object-center",
  "left-top": "object-[left_top]",
  top: "object-top",
} as const;

export function ServiceCardVisual({ priority = false, service }: ServiceCardVisualProps) {
  return (
    <div
      data-service-visual
      className="pointer-events-none absolute inset-0 overflow-hidden bg-paper-deep"
    >
      <Image
        src={service.image}
        alt={service.imageAlt}
        fill
        priority={priority}
        sizes="(max-width: 48rem) 100vw, (max-width: 80rem) 50vw, 33vw"
        className={`object-cover transition-transform duration-700 ease-[var(--ease-fluid)] group-hover:scale-[1.025] ${imagePositionClasses[service.imagePosition]}`}
      />
    </div>
  );
}
