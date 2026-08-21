export type Service = {
  accent: "acid" | "cobalt";
  href: string;
  host: string;
  image: string;
  imageAlt: string;
  imagePosition: "center" | "left-top" | "top";
  name: string;
  status: "운영 중" | "준비 중";
  summary: string;
};

export const services: Service[] = [
  {
    name: "KUWEB",
    host: "www.kuphil.com",
    summary: "건국대학교 아마추어 오케스트라 KUphil의 공식 웹사이트입니다.",
    status: "운영 중",
    accent: "acid",
    href: "https://www.kuphil.com",
    image: "/images/kuweb.webp",
    imageAlt: "KUWEB 메인 화면",
    imagePosition: "left-top",
  },
  {
    name: "Meongspace",
    host: "meongspace.duworks.kr",
    summary: "잠시 쉬고 싶을 때, 가만히 바라보며 머무는 공간입니다.",
    status: "운영 중",
    accent: "cobalt",
    href: "https://meongspace.duworks.kr",
    image: "/images/meongspace.webp",
    imageAlt: "Meongspace 메인 화면",
    imagePosition: "center",
  },
  {
    name: "144BPM",
    host: "144bpm.duworks.kr",
    summary: "리듬을 만들고 메트로놈과 함께 연습하며 BPM 패턴을 공유하는 도구입니다.",
    status: "운영 중",
    accent: "acid",
    href: "https://144bpm.duworks.kr",
    image: "/images/144bpm.webp",
    imageAlt: "144BPM 리듬 편집 화면",
    imagePosition: "top",
  },
];

export const liveServices = services.filter((service) => service.status === "운영 중");
