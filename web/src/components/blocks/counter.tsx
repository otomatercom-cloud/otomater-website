"use client";
import { useEffect, useRef, useState } from "react";

/** Counts up once when scrolled into view. Server HTML already holds the final value (works without JS / reduced motion). */
export function Counter({ prefix, value, suffix }: { prefix: string; value: string; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const target = Number(value);
  const decimals = value.includes(".") ? value.split(".")[1].length : 0;
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!Number.isFinite(target) || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / 1400);
        setShown((target * (1 - Math.pow(1 - p, 3))).toFixed(decimals));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, decimals]);
  return <span ref={ref}>{prefix}{shown}{suffix}</span>;
}
