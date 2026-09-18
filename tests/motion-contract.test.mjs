import assert from "node:assert/strict";
import test from "node:test";

import { read } from "./test-utils.mjs";

test("keeps mobile scrolling native with short scroll-linked catch-up", () => {
  const smoothScrollSource = read("src/shared/ui/smooth-scroll.tsx");
  const moreToComeSource = read("src/widgets/more-to-come/ui/more-to-come-section.tsx");
  const showcaseSource = read("src/widgets/showcase/ui/showcase-section.tsx");

  assert.doesNotMatch(smoothScrollSource, /ScrollTrigger\.normalizeScroll/);
  assert.match(smoothScrollSource, /smoothTouch: 0/);
  assert.match(moreToComeSource, /const touchScrubDuration = 0\.08/);
  // iOS에서 파티클 장면이 뚝뚝 끊기지 않도록 showcase는 추종을 조금 더 늦춘다.
  assert.match(showcaseSource, /const touchScrubDuration = 0\.3/);
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
