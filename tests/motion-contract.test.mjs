import assert from "node:assert/strict";
import test from "node:test";

import { read } from "./test-utils.mjs";

test("keeps mobile scrolling native with short scroll-linked catch-up", () => {
  const smoothScrollSource = read("src/shared/ui/smooth-scroll.tsx");
  const touchMotionSources = [
    read("src/widgets/hero/ui/hero-section.tsx"),
    read("src/widgets/services/ui/services-section.tsx"),
    read("src/widgets/more-to-come/ui/more-to-come-section.tsx"),
  ];

  assert.doesNotMatch(smoothScrollSource, /ScrollTrigger\.normalizeScroll/);
  assert.match(smoothScrollSource, /smoothTouch: 0/);
  touchMotionSources.forEach((source) => {
    assert.match(source, /const touchScrubDuration = 0\.08/);
  });
});

test("scrolls service expansion to its actual boundary after scrolling stops", () => {
  const servicesMotionSource = read("src/widgets/services/ui/services-section.tsx");

  assert.doesNotMatch(servicesMotionSource, /snap:\s*\{/);
  assert.match(servicesMotionSource, /ScrollSmoother\.get\(\)/);
  assert.match(servicesMotionSource, /const target = direction === 1 \? end : start/);
  assert.match(servicesMotionSource, /smoother\.scrollTo\(target, true\)/);
  assert.match(servicesMotionSource, /window\.scrollTo\(\{ top: target, behavior: "smooth" \}\)/);
  assert.match(servicesMotionSource, /direction !== 1 && direction !== -1/);
  assert.match(
    servicesMotionSource,
    /ScrollTrigger\.addEventListener\("scrollEnd", handleGridExpansionScrollEnd\)/,
  );
  assert.match(
    servicesMotionSource,
    /ScrollTrigger\.removeEventListener\("scrollEnd", handleGridExpansionScrollEnd\)/,
  );
  assert.match(
    servicesMotionSource,
    /onUpdate: \(\{ progress \}\) => \{\s+setGridFace\(progress >= flipHandoffThreshold\)/,
  );
});

test("targets the first showcase service from the More to Come action", () => {
  const showcaseSource = read("src/widgets/showcase/ui/showcase-section.tsx");
  const moreToComeSource = read("src/widgets/more-to-come/ui/more-to-come-section.tsx");
  const scrollButtonSource = read("src/shared/ui/scroll-button.tsx");

  assert.match(showcaseSource, /id: "showcase-services"/);
  assert.match(moreToComeSource, /targetId="showcase"/);
  assert.match(moreToComeSource, /scrollTriggerId="showcase-services"/);
  assert.match(scrollButtonSource, /ScrollTrigger\.getById\(scrollTriggerId\)/);
  assert.match(scrollButtonSource, /scrollTrigger\.scroll\(scrollPosition\)/);
});
