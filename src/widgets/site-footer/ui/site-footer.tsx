import Image from "next/image";
import { liveServices } from "@/entities/service";
import { ArrowUpRightIcon, BrandHorizontalLogo } from "@/shared/icons";

export function SiteFooter() {
  return (
    <footer className="bg-paper py-12">
      <div className="page-shell">
        <Image src={BrandHorizontalLogo} alt="DUWORKS" className="h-8 w-auto" />

        <nav aria-label="DUWORKS 서비스 도메인" className="mt-4 flex flex-col items-start gap-2">
          {liveServices.map((service) => (
            <a
              key={service.host}
              href={service.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-9 items-center gap-2 text-footer-domain font-semibold text-ink transition-colors duration-300 hover:text-cobalt"
            >
              <span>{service.host}</span>
              <ArrowUpRightIcon className="size-4 shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cobalt" />
            </a>
          ))}
        </nav>

        <div className="mt-8 text-caption font-medium text-muted md:mt-10">
          <p>© 2026 DUWORKS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
