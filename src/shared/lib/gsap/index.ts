"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollSmoother, ScrollTrigger);

// 모바일 인앱브라우저는 스크롤 방향이 바뀔 때마다 주소창·하단 바를 접었다 펴며 resize를 던진다.
// 기본 동작대로 매번 재계산하면 pin 거리와 문서 높이가 같이 출렁여 스크롤 위치가 다른 구간으로 튄다.
// 세로 길이만 바뀌는 이 변화는 무시하고, 가로가 바뀌는 회전·창 크기 조절에서만 재계산한다.
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollSmoother, ScrollTrigger, useGSAP };
