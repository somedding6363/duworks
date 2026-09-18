# DUWORKS Landing

DUWORKS 루트 도메인을 위한 정적 랜딩페이지입니다. Next.js App Router, Tailwind CSS v4, GSAP, Feature-Sliced Design v2.1로 구성했습니다.

## 시작하기

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## 서비스 정보 수정

`src/entities/service/model/service.ts`의 `services` 배열이 서비스의 단일 데이터 원본입니다.

- `name`: 서비스 이름
- `host`: 표시용 도메인
- `summary`: 한 문장 소개
- `status`: `운영 중` 또는 `준비 중`. `liveServices`는 `운영 중`만 추려낸 목록이며 화면은 이 목록을 사용합니다
- `href`: 실제 서비스 URL
- `image`: `public/images/` 아래 스크린샷 경로
- `imageAlt`: 스크린샷 대체 텍스트
- `imagePosition`: 스크린샷을 잘라낼 기준(`center`, `left-top`, `top`)

## 디자인 토큰

색상, SUIT 타이포그래피 스케일, 라운드, 그림자, 이징은 `src/app/globals.css`의 Tailwind `@theme`에 정의되어 있습니다. 컴포넌트에서는 `text-hero`, `bg-paper`, `rounded-control`, `ease-fluid`처럼 토큰 기반 유틸리티를 사용합니다.

`@theme`은 실제로 쓰는 토큰만 둡니다. Tailwind v4는 마크다운을 포함한 프로젝트 파일 전체를 스캔하므로, 문서에 적어 둔 클래스 이름만으로도 사용하지 않는 유틸리티가 생성됩니다.

## FSD 구조

```text
src/
  app/                       # Next.js App Router와 globals.css
  _pages/home/               # widgets를 조합하는 페이지 slice
  widgets/
    floating-actions/        # 리퀴드 글래스 빠른 메뉴
    site-header/             # 화면 맨 위의 1px 투명 고정 헤더
    showcase/                # 히어로 카드 → 점 → 파티클 확산 → 전진 흐름 → 서비스 패널로 이어지는 pinned scene
    more-to-come/            # 마지막 메시지와 CTA pinned scene
    site-footer/             # 전역 푸터
  entities/service/          # 서비스 타입과 실제 서비스 데이터
  shared/config/             # 사이트 메타데이터와 분석 ID public API
  shared/icons/              # 커스텀 SVG 아이콘과 index.ts public API
  shared/lib/gsap/           # GSAP 초기화 public API
  shared/ui/                 # 재사용 UI public API
```

`src/app`은 Next.js App Router와 전역 스타일을 소유하며, `src/app/page.tsx`는 `src/_pages/home/index.ts`만 가져오는 얇은 라우팅 어댑터입니다. FSD 페이지 레이어는 Next.js 예약 디렉터리와 구분하기 위해 `_pages`로 표기합니다. 페이지는 각 `widgets/<slice>/index.ts`를 통해 화면 블록을 조합하고, 위젯은 `entities/service/index.ts`를 통해 서비스 모델을 사용합니다.

`features` 레이어는 현재 만들지 않았습니다. 즐겨찾기·로그인·서비스 필터처럼 사용자가 수행하는 재사용 가능한 비즈니스 액션이 아직 없기 때문에 빈 레이어를 두지 않는 것이 FSD 구조에 더 맞습니다. 그런 동작이 생기면 해당 기능을 독립 slice로 추가합니다.

## 정적 빌드

```bash
npm run build
```

`next.config.ts`에 `output: "export"`가 설정되어 있어 결과물이 `out/`에 생성됩니다.

배포는 Cloudflare Pages를 사용합니다. `main` 브랜치가 프로덕션, `dev` 브랜치가 프리뷰 배포에 연결되어 있습니다.

### Cloudflare Pages 보안 헤더

`public/_headers`에는 HSTS, clickjacking 방어, MIME sniffing 방지, Referrer Policy, Permissions Policy가 정의되어 있습니다. `npm run build`는 정적 HTML의 인라인 스크립트 SHA-256 해시를 계산해 `out/_headers`에 CSP를 추가합니다. 이를 통해 Next.js hydration과 Google Tag Manager를 허용하면서 `script-src 'unsafe-inline'`은 사용하지 않습니다.

배포 전 생성 결과는 다음 명령으로 다시 확인할 수 있습니다.

```bash
npm run headers:check
```

## 검증

```bash
npm run verify
```

`verify`는 `format:check` → `typecheck` → `lint` → `test`를 차례로 실행하며, `test`가 `build`까지 포함합니다. 개별 실행도 가능합니다.

```bash
npm run format:check
npm run typecheck
npm run lint
npm run build
npm run headers:check
npm test
```
