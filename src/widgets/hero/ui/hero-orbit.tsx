import type { Service } from "@/entities/service";

type HeroOrbitProps = {
  services: Service[];
};

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

      <span className="sr-only">현재 운영 중인 서비스 {services.length}개</span>
    </>
  );
}
