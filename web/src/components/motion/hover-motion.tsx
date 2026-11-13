"use client";
import { useEffect } from "react";
import { animate, canHover, DUR, EASE } from "@/lib/anim";

/**
 * One delegated pointer listener for the whole site (no per-card JS).
 *   data-hover="lift"  cards: rise and the icon pops
 *   data-hover="btn"   buttons: slight grow, press-down on click
 * Mouse only; touch devices and reduced-motion users get the plain CSS states.
 */
export function HoverMotion() {
  useEffect(() => {
    if (!canHover()) return;
    const find = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>("[data-hover]") : null);
    const to = (el: HTMLElement, v: Record<string, number | string>) => animate(el, { ...v, duration: DUR.hover, ease: EASE.hover });
    const over = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = find(e.target); if (!el || (e.relatedTarget instanceof Node && el.contains(e.relatedTarget))) return;
      if (el.dataset.hover === "lift") { to(el, { translateY: -6 }); const i = el.querySelector<HTMLElement>("[data-hover-icon]"); if (i) animate(i, { scale: 1.12, rotate: -4, duration: DUR.hover + 80, ease: "outBack" }); }
      else to(el, { scale: 1.04 });
    };
    const out = (e: PointerEvent) => {
      const el = find(e.target); if (!el || (e.relatedTarget instanceof Node && el.contains(e.relatedTarget))) return;
      if (el.dataset.hover === "lift") { to(el, { translateY: 0 }); const i = el.querySelector<HTMLElement>("[data-hover-icon]"); if (i) animate(i, { scale: 1, rotate: 0, duration: DUR.hover, ease: EASE.hover }); }
      else to(el, { scale: 1 });
    };
    const down = (e: PointerEvent) => { const el = find(e.target); if (el?.dataset.hover === "btn" && e.pointerType === "mouse") to(el, { scale: 0.97 }); };
    const up = (e: PointerEvent) => { const el = find(e.target); if (el?.dataset.hover === "btn" && e.pointerType === "mouse") to(el, { scale: 1.04 }); };
    document.addEventListener("pointerover", over); document.addEventListener("pointerout", out);
    document.addEventListener("pointerdown", down); document.addEventListener("pointerup", up);
    return () => { document.removeEventListener("pointerover", over); document.removeEventListener("pointerout", out); document.removeEventListener("pointerdown", down); document.removeEventListener("pointerup", up); };
  }, []);
  return null;
}
