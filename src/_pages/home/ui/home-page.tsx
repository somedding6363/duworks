import { FloatingActions } from "@/widgets/floating-actions";
import { MoreToComeSection } from "@/widgets/more-to-come";
import { ShowcaseSection } from "@/widgets/showcase";
import { SiteFooter } from "@/widgets/site-footer";
import { SiteHeader } from "@/widgets/site-header";
import { ScrollButton, SmoothScroll } from "@/shared/ui";
import { SiteLoader } from "./site-loader";

export function HomePage() {
  return (
    <>
      <SiteLoader />

      <div data-site-content>
        <ScrollButton
          targetId="content"
          focusTarget
          className="fixed top-3 left-3 z-[60] -translate-y-24 cursor-pointer rounded-control bg-ink px-5 py-3 text-interface font-bold text-white-soft transition-transform focus:translate-y-0"
        >
          본문으로 바로가기
        </ScrollButton>

        <SmoothScroll>
          <main id="top" className="w-full max-w-full overflow-x-clip">
            <div id="content" tabIndex={-1}>
              <ShowcaseSection />
              <MoreToComeSection />
            </div>
            <SiteFooter />
          </main>
        </SmoothScroll>

        <SiteHeader />
        <FloatingActions />
      </div>
    </>
  );
}
