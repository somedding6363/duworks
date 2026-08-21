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
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden bg-ink will-change-opacity"
    >
      <Image
        src={service.image}
        alt={service.imageAlt}
        fill
        priority={priority}
        sizes="100vw"
        className={`object-cover ${imagePositionClasses[service.imagePosition]}`}
      />
    </div>
  );
}
