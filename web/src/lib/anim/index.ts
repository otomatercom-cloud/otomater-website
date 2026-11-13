"use client";
/** Shared helpers for every Anime.js animation in the site. Import Anime from here only, so there is one place to tune motion. */
export { animate, createScope, createTimeline, onScroll, splitText, stagger, svg, utils } from "animejs";

export const EASE = { out: "outExpo", soft: "outQuart", hover: "outQuad" } as const;
export const DUR = { reveal: 700, hover: 260, page: 500, word: 650 } as const;

const reducedQuery = "(prefers-reduced-motion: reduce)";
export const prefersReduced = () => typeof window !== "undefined" && window.matchMedia(reducedQuery).matches;
/** Inside the admin preview iframe React owns the DOM and editors need stable content, so nothing animates there. */
export const inEditor = () => typeof window !== "undefined" && window.self !== window.top;
export const canAnimate = () => typeof window !== "undefined" && !prefersReduced() && !inEditor();
export const canHover = () => canAnimate() && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
export const isDesktop = () => window.matchMedia("(min-width: 768px)").matches;

type Callback = (el: Element) => void;
const observers = new Map<string, { io: IntersectionObserver; cbs: WeakMap<Element, Callback> }>();

/** One shared IntersectionObserver per margin: fires `cb` once when `el` scrolls into view, returns an unobserve function. */
export function onceInView(el: Element, cb: Callback, margin = "0px 0px -10% 0px"): () => void {
  if (typeof IntersectionObserver === "undefined") { cb(el); return () => {}; }
  let entry = observers.get(margin);
  if (!entry) {
    const cbs = new WeakMap<Element, Callback>();
    const io = new IntersectionObserver((list) => {
      for (const e of list) if (e.isIntersecting) { io.unobserve(e.target); const f = cbs.get(e.target); cbs.delete(e.target); f?.(e.target); }
    }, { rootMargin: margin, threshold: 0.08 });
    entry = { io, cbs }; observers.set(margin, entry);
  }
  entry.cbs.set(el, cb); entry.io.observe(el);
  const { io, cbs } = entry;
  return () => { io.unobserve(el); cbs.delete(el); };
}
