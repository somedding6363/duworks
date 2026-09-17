import Image from "next/image";
import type { Service } from "@/entities/service";

const WORDMARK = "DUWORKS";

const imagePositionClasses = {
  center: "object-center",
  "left-top": "object-[left_top]",
  top: "object-top",
} as const;

const faceClassName =
  "absolute inset-0 flex flex-col justify-end overflow-hidden rounded-[1.5rem] p-3 text-white-soft [backface-visibility:hidden]";

// 착지한 hero 카드와 같은 모습의 0번 면. hero 카드는 90° 회전한 상태로 착지하므로,
// 그라디언트 위치·반경도 회전한 결과(가로·세로 교환, 70% 110% → -10% 70%)로 맞춘다.
export function ShowcaseIntroFace() {
  return (
    <div
      className={`${faceClassName} bg-[radial-gradient(90%_120%_at_-10%_70%,var(--color-teal),var(--color-ink)_70%)]`}
    >
      <p className="text-showcase-card-note tracking-[0.12em] text-white-soft/60">
        FOLLOW THE IDEA.
      </p>
      <p className="mt-1.5 text-showcase-card-title font-display">{WORDMARK}</p>
    </div>
  );
}

type ShowcaseServiceFaceProps = {
  index: number;
  service: Service;
};

export function ShowcaseServiceFace({ index, service }: ShowcaseServiceFaceProps) {
  return (
    <div className={`${faceClassName} bg-ink`}>
      <Image
        src={service.image}
        alt=""
        fill
        sizes="(max-width: 48rem) 88vw, 34rem"
        className={`object-cover ${imagePositionClasses[service.imagePosition]}`}
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-ink)_0%,rgb(23_23_19/0.92)_38%,transparent_75%)]"
        aria-hidden="true"
      />
      <div className="relative p-1">
        <p className="text-showcase-service-meta tracking-[0.12em] text-white-soft/70 uppercase">
          {String(index + 1).padStart(2, "0")} · {service.host}
        </p>
        <p className="mt-2 text-showcase-service-title font-display">{service.name}</p>
        <p className="mt-2 text-showcase-service-summary text-white-soft/90 pretty">
          {service.summary}
        </p>
      </div>
    </div>
  );
}
