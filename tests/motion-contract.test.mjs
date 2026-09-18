import assert from "node:assert/strict";
import test from "node:test";

import { read } from "./test-utils.mjs";

// 이 계약은 원래 모바일 스크롤을 네이티브로 두고, 추종 지연은 scrub으로만 줄인다는 결정이었다.
// 실기기(iPhone 13 Pro, iOS 27) 계측에서 그 전제가 깨졌다. iOS는 관성 스크롤 중 window.scrollY를
// 5~8프레임 멈췄다가 300~500px씩 건너뛰며 갱신하므로, scrub을 아무리 줄여도 pin이 제때 걸리지 않는다.
// more to come 진입에서 stage가 최대 733px 되돌아왔다. CSS sticky로 바꾸면 되돌림은 220px까지
// 줄지만 stage가 스크롤 레이어에 남아 3D 씬을 매 프레임 다시 그려 실기기에서 눈에 띄게 끊겼다
// (perspective를 안쪽 래퍼로 분리해도 동일). normalizeScroll만이 되돌림과 끊김을 모두 통과했다.
// 따라서 "네이티브 유지"는 더 이상 강제하지 않는다. 대신 대체 수단이 실기기에서 재검증 없이
// 다시 도입되지 않도록, 나머지 항목은 계약으로 남긴다.
test("keeps mobile scroll position in sync with pinning", () => {
  const smoothScrollSource = read("src/shared/ui/smooth-scroll.tsx");
  const moreToComeSource = read("src/widgets/more-to-come/ui/more-to-come-section.tsx");
  const showcaseSource = read("src/widgets/showcase/ui/showcase-section.tsx");

  // 터치에서만 켠다. 데스크톱은 ScrollSmoother가 맡으므로 둘이 겹치면 안 된다.
  assert.match(smoothScrollSource, /ScrollTrigger\.isTouch === 1/);
  assert.match(smoothScrollSource, /ScrollTrigger\.normalizeScroll\(true\)/);
  assert.match(smoothScrollSource, /ScrollTrigger\.normalizeScroll\(false\)/);
  assert.match(smoothScrollSource, /smoothTouch: 0/);
  // more to come은 JS pin을 유지한다. sticky는 실기기에서 끊김이 재현됐다.
  assert.match(moreToComeSource, /pin: stageElement/);
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
