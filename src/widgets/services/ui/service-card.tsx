import type { Service } from "@/entities/service";
import { ArrowUpRightIcon } from "@/shared/icons";
import { ServiceCardVisual } from "./service-card-visual";

type ServiceCardProps = {
  index: number;
  service: Service;
};

const surfaceClasses = ["bg-cobalt", "bg-ink-soft", "bg-ink"] as const;

const initialPositionClasses = [
  "z-[2] h-full min-h-[25rem] w-full rounded-none",
  "z-[20] aspect-[0.7353] h-auto w-[clamp(8.5rem,15vw,11.5rem)] translate-x-[70vw] translate-y-[calc(max(100svh,25rem)_-_clamp(11.56rem,20.4vw,15.64rem)_-_3.125rem)] rounded-[clamp(1.125rem,2vw,1.375rem)] min-[35.0625rem]:translate-x-[74vw] min-[56.3125rem]:translate-x-[84vw]",
  "z-[19] aspect-[0.7353] h-auto w-[clamp(8.5rem,15vw,11.5rem)] translate-x-[calc(70vw+clamp(9.125rem,16vw,12.375rem))] translate-y-[calc(max(100svh,25rem)_-_clamp(11.56rem,20.4vw,15.64rem)_-_3.125rem)] rounded-[clamp(1.125rem,2vw,1.375rem)] min-[35.0625rem]:translate-x-[calc(74vw+clamp(9.125rem,16vw,12.375rem))] min-[56.3125rem]:translate-x-[calc(84vw+clamp(9.125rem,16vw,12.375rem))]",
] as const;

export function ServiceCard({ index, service }: ServiceCardProps) {
  const isFirst = index === 0;

  return (
    <article
      data-service-card
      data-index={index}
      className={`absolute top-0 left-0 isolate origin-top-left overflow-hidden text-panel shadow-[0_1.125rem_3.375rem_rgb(0_0_0/0.28)] will-change-[transform,width,height,border-radius,opacity,filter] motion-reduce:relative motion-reduce:inset-auto motion-reduce:mx-3 motion-reduce:mb-3 motion-reduce:h-[70svh] motion-reduce:min-h-[32rem] motion-reduce:w-[calc(100%-1.5rem)] motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:rounded-[1.5rem] motion-reduce:opacity-100 ${surfaceClasses[index % surfaceClasses.length]} ${initialPositionClasses[index] ?? initialPositionClasses[2]}`}
    >
      <ServiceCardVisual service={service} priority={isFirst} />

      <div
        className="pointer-events-none absolute inset-0 z-[3] bg-[linear-gradient(90deg,rgb(0_0_0/0.66)_0%,rgb(0_0_0/0.4)_36%,rgb(0_0_0/0.08)_70%,rgb(0_0_0/0.18)_100%),linear-gradient(0deg,rgb(0_0_0/0.34),transparent_46%)]"
        aria-hidden="true"
      />

      <div
        data-service-queue
        className={`pointer-events-none absolute right-4 bottom-4 left-4 z-[5] motion-reduce:hidden ${isFirst ? "opacity-0" : "opacity-100"}`}
        aria-hidden="true"
      >
        <small className="mb-1.5 block text-service-queue-meta font-semibold text-white/68">
          {String(index + 1).padStart(2, "0")} · {service.host}
        </small>
        <strong className="block text-service-queue-title font-service-title md:text-service-queue-title-wide">
          {service.name}
        </strong>
      </div>

      <div
        data-service-full
        className={`pointer-events-none absolute top-1/2 left-[clamp(1.5rem,5.5vw,5.25rem)] z-[5] w-[min(41vw,33.75rem)] -translate-y-[48%] will-change-opacity motion-reduce:pointer-events-auto motion-reduce:opacity-100 max-md:top-auto max-md:right-5 max-md:bottom-[4.5rem] max-md:left-5 max-md:w-auto max-md:translate-y-0 ${isFirst ? "opacity-100" : "opacity-0"}`}
      >
        <p className="mb-4 text-service-host font-extrabold text-white/62 uppercase">
          {service.host}
        </p>
        <h2 className="m-0 text-service-name font-display balance max-md:text-service-name-compact">
          {service.name}
        </h2>
        <p className="mt-[1.375rem] max-w-[29.375rem] text-service-summary text-white/76 pretty max-md:max-w-[94%] max-md:text-service-summary-compact">
          {service.summary}
        </p>
        <a
          data-service-link
          href={service.href}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto mt-7 inline-flex min-h-11 items-center gap-2 rounded-control border border-white/48 bg-white/10 px-4 text-service-action font-bold text-panel backdrop-blur-[14px] transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-white/18 focus-visible:outline-white max-sm:mt-[1.125rem]"
          tabIndex={isFirst ? 0 : -1}
        >
          Open service
          <ArrowUpRightIcon className="size-3.5" />
        </a>
      </div>
    </article>
  );
}
