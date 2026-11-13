"use client";
import { createElement, useEffect, useRef, type ElementType, type HTMLAttributes } from "react";
import { animate, canAnimate, createScope, DUR, EASE, onceInView, splitText, stagger } from "@/lib/anim";

type Props = { as?: ElementType; text: string; delay?: number; step?: number; unit?: "words" | "chars" } & Omit<HTMLAttributes<HTMLElement>, "children">;

/**
 * Staggered text/heading animation. The real text is server-rendered (SEO, no-JS, screen readers);
 * after hydration the words are split, animated in once the heading is visible, and restored on cleanup.
 */
export function SplitText({ as = "h2", text, delay = 0, step = 55, unit = "words", ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ready = () => el.setAttribute("data-split-ready", "");
    if (!canAnimate()) { ready(); return; }
    const scope = createScope({ root: el });
    let stop = () => {};
    scope.add(() => {
      // Anime's own accessible mode injects a duplicate hidden copy; we label the element instead.
      el.setAttribute("aria-label", text);
      const split = splitText(el, { words: unit === "words", chars: unit === "chars", accessible: false });
      const parts = unit === "chars" ? split.chars : split.words;
      parts.forEach((p: HTMLElement) => { p.style.opacity = "0"; p.setAttribute("aria-hidden", "true"); });
      ready();
      stop = onceInView(el, () => {
        animate(parts, { opacity: [0, 1], translateY: ["0.6em", 0], duration: DUR.word, delay: stagger(step, { start: delay * 1000 }), ease: EASE.out });
      });
    });
    return () => { stop(); scope.revert(); el.removeAttribute("aria-label"); ready(); };
  }, [text, delay, step, unit]);
  return createElement(as, { ref, "data-split": "", ...rest }, text);
}
