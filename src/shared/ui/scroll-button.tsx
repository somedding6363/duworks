"use client";

import type { ButtonHTMLAttributes } from "react";

type ScrollButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type"> & {
  focusTarget?: boolean;
  targetId: string;
};

export function ScrollButton({ focusTarget = false, targetId, ...props }: ScrollButtonProps) {
  const handleClick = () => {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });

    if (focusTarget) {
      target.focus({ preventScroll: true });
    }
  };

  return <button type="button" onClick={handleClick} {...props} />;
}
