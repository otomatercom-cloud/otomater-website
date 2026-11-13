"use client";
import { createElement, useEffect, useRef, type ElementType, type HTMLAttributes } from "react";
import { animate, canAnimate, DUR, EASE, onceInView } from "@/lib/anim";

type Props = { as?: ElementType; delay?: number; y?: number; x?: number; scale?: number; duration?: number } & HTMLAttributes<HTMLElement>;

/**
 * Scroll-triggered reveal (fade + rise). Content stays visible without JS and for reduced-motion users:
 * the CSS that hides `[data-reveal]` only applies when scripting is on and motion is allowed (globals.css).
 * `delay` is in seconds so existing call sites keep working.
 */
export function Reveal({ as = "div", delay = 0, y = 28, x = 0, scale = 1, duration = DUR.reveal, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const show = () => el.setAttribute("data-revealed", "");
    if (!canAnimate()) { show(); return; }
    let anim: ReturnType<typeof animate> | null = null;
    const stop = onceInView(el, () => {
      try {
        anim = animate(el, { opacity: [0, 1], translateY: [y, 0], translateX: [x, 0], scale: [scale, 1], duration, delay: delay * 1000, ease: EASE.out,
          onComplete: () => { show(); el.style.removeProperty("opacity"); el.style.removeProperty("transform"); } });
        show(); // lift the CSS hide; the inline start values above now own the first frame
      } catch { show(); }
    });
    return () => { stop(); anim?.revert(); show(); };
  }, [delay, y, x, scale, duration]);
  return createElement(as, { ref, "data-reveal": "", ...rest }, children);
}
