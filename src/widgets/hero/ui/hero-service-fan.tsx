import { ServiceFanCard, type Service } from "@/entities/service";

type HeroServiceFanProps = {
  services: Service[];
};

export function HeroServiceFan({ services }: HeroServiceFanProps) {
  return (
    <div
      data-hero="service-fan"
      className="pointer-events-none absolute bottom-[-1.5rem] left-1/2 z-[5] size-0 will-change-[transform,opacity] md:bottom-[-7rem]"
      aria-hidden="true"
    >
      {services.map((service, index) => (
        <ServiceFanCard
          service={service}
          index={index}
          total={services.length}
          scope="hero"
          priority={index === 0}
          key={service.host}
        />
      ))}
    </div>
  );
}
