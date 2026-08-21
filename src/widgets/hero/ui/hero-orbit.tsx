import type { Service } from "@/entities/service";

type HeroOrbitProps = {
  services: Service[];
};

const accentClasses = {
  acid: "bg-acid",
  cobalt: "bg-cobalt",
} as const;

const labelPositionClasses = [
  "top-[21%] left-[4%] md:top-[28%] md:left-[8%]",
  "top-[28%] right-[4%] md:top-[23%] md:right-[8%]",
  "right-[5%] bottom-[17%] md:right-[13%] md:bottom-[20%]",
] as const;

export function HeroOrbit({ services }: HeroOrbitProps) {
  return (
    <>
      <div
        data-hero="grid"
        className="pointer-events-none absolute -inset-16 bg-[linear-gradient(var(--line-faint)_1px,transparent_1px),linear-gradient(90deg,var(--line-faint)_1px,transparent_1px)] bg-size-[3rem_3rem] will-change-transform [mask-image:linear-gradient(to_bottom,transparent_3%,#000_24%,#000_78%,transparent_100%)] motion-reduce:transform-none md:bg-size-[4rem_4rem] [-webkit-mask-image:linear-gradient(to_bottom,transparent_3%,#000_24%,#000_78%,transparent_100%)]"
        aria-hidden="true"
      />

      <div
        data-hero="orbit"
        className="pointer-events-none absolute aspect-square w-[min(78vw,19rem)] rounded-full border border-ink/[0.08] will-change-[transform,opacity] motion-reduce:transform-none md:w-[min(74vw,56.25rem)]"
        aria-hidden="true"
      >
        <span className="absolute inset-[10%] rounded-full border border-ink/[0.07]" />
        <span className="absolute inset-[27%] rounded-full border border-ink/[0.07]" />
        <span className="absolute -top-2.5 left-1/2 hidden size-5 -translate-x-1/2 rounded-full bg-ink shadow-[0_0_0_0.625rem_rgb(255_255_255/0.78),0_0.5rem_1.375rem_rgb(23_23_19/0.18)] md:block" />
      </div>

      <ul
        className="pointer-events-none absolute inset-0 z-[4] m-0 list-none p-0"
        aria-label="현재 운영 중인 서비스"
      >
        {services.map((service, index) => (
          <li
            data-hero="service-label"
            className={`absolute inline-flex items-center gap-1.5 rounded-control border border-ink/[0.085] bg-panel/70 px-2.5 py-2 text-orbit-label whitespace-nowrap text-ink-soft shadow-[0_0.75rem_2rem_rgb(23_23_19/0.045)] will-change-[transform,opacity] motion-reduce:transform-none md:gap-[0.55rem] md:px-3.5 md:py-2.5 md:text-orbit-label-wide ${labelPositionClasses[index] ?? ""}`}
            key={service.host}
          >
            <span
              className={`size-[0.45rem] shrink-0 rounded-full ${accentClasses[service.accent]}`}
              aria-hidden="true"
            />
            <span>{service.host}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
