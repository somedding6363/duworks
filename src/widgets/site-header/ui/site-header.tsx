// 화면 맨 위에 고정된 1px 투명 헤더. 보이는 내용은 없다.
export function SiteHeader() {
  return (
    <header
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-40 h-px bg-transparent"
    />
  );
}
