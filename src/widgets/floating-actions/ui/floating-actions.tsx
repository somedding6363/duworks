import { ArrowUpIcon, MailIcon } from "@/shared/icons";
import { ScrollButton } from "@/shared/ui";

const actionClassName =
  "group relative z-[2] flex min-h-11 min-w-[3.25rem] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-control px-1.5 py-1 text-floating-action font-bold whitespace-nowrap text-ink transition-[background-color,box-shadow,transform] duration-300 ease-fluid hover:bg-white/52 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.72)] active:scale-[0.97]";
const actionIconClassName = "size-5 transition-transform duration-300 group-hover:-translate-y-0.5";

export function FloatingActions() {
  return (
    <nav
      aria-label="빠른 메뉴"
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-50"
    >
      <div className="relative isolate flex overflow-hidden rounded-control border border-glass-edge bg-[linear-gradient(145deg,var(--color-glass-highlight),var(--color-glass-fill))] p-0.5 shadow-liquid backdrop-blur-[28px] backdrop-saturate-[190%] before:pointer-events-none before:absolute before:inset-px before:z-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_24%_0%,rgb(255_255_255/0.88),transparent_44%)] before:opacity-80 after:pointer-events-none after:absolute after:inset-x-[12%] after:top-0 after:z-[1] after:h-px after:bg-linear-to-r after:from-transparent after:via-white after:to-transparent supports-[backdrop-filter:blur(1px)]:bg-white/34">
        <ScrollButton targetId="top" className={actionClassName}>
          <ArrowUpIcon className={actionIconClassName} />
          <span>TOP</span>
        </ScrollButton>
        <span className="relative z-[2] my-1.5 w-px bg-ink/10" aria-hidden="true" />
        <a
          href="mailto:duworks.contact@gmail.com"
          aria-label="DUWORKS에 문의하기"
          className={actionClassName}
        >
          <MailIcon className={actionIconClassName} />
          <span>문의하기</span>
        </a>
      </div>
    </nav>
  );
}
