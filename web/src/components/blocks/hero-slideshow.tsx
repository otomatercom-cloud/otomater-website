"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, canAnimate, EASE } from "@/lib/anim";

export type Slide = { src: string; alt: string };
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Hero picture slideshow: cross-fade + gentle zoom (Anime.js), auto-advances every `interval` ms,
 * pauses on hover/focus/hidden tab. Reduced-motion users and the admin preview get no autoplay
 * (manual dots still work, without animation). The first slide is always rendered visible by the server.
 */
export function HeroSlideshow({ slides, interval = 5000, className = "" }: { slides: Slide[]; interval?: number; className?: string }) {
  const n = slides.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const refs = useRef<(HTMLImageElement | null)[]>([]);
  const prev = useRef(0);

  useIsoLayoutEffect(() => {
    const from = prev.current; prev.current = i;
    if (from === i) return;
    const a = refs.current[from], b = refs.current[i];
    if (!a || !b || !canAnimate()) return;
    const run = [
      animate(a, { opacity: [1, 0], duration: 900, ease: EASE.soft }),
      animate(b, { opacity: [0, 1], scale: [1.06, 1], duration: 1100, ease: EASE.out }),
    ];
    return () => run.forEach((x) => x.revert());
  }, [i]);

  useEffect(() => {
    if (n < 2 || paused || !canAnimate()) return;
    const t = setInterval(() => { if (!document.hidden) setI((v) => (v + 1) % n); }, interval);
    return () => clearInterval(t);
  }, [n, paused, interval]);

  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-card)] shadow-soft ring-1 ring-white/10 ${className}`}
      role="group" aria-roledescription="carousel" aria-label="Featured images"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
    >
      {slides.map((s, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={s.src + k} ref={(el) => { refs.current[k] = el; }} src={s.src} alt={s.alt} aria-hidden={k !== i}
          loading={k === 0 ? "eager" : "lazy"} decoding="async" sizes="(min-width:1024px) 45vw, 100vw"
          style={{ opacity: k === i ? 1 : 0 }} className="absolute inset-0 h-full w-full object-cover" />
      ))}
      {n > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
          {slides.map((_, k) => (
            <button key={k} type="button" onClick={() => setI(k)} aria-label={`Show image ${k + 1} of ${n}`} aria-current={k === i}
              className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
