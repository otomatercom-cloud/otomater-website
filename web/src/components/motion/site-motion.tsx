"use client";
import { useEffect, useRef } from "react";
import { animate, canAnimate, createScope, DUR, EASE, isDesktop, onceInView, onScroll, stagger, svg } from "@/lib/anim";

const SHAPES = "path,line,polyline,polygon,circle,rect,ellipse";

/**
 * Mounted by template.tsx, so it runs again on every page navigation. Handles:
 *  - the page entrance
 *  - SVG line-draw of icons marked data-draw (when they scroll into view)
 *  - subtle scroll-linked drift of decorative shapes marked data-parallax (desktop only)
 * Everything is created inside one Anime scope and reverted on unmount.
 */
export function SiteMotion({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current; if (!root) return;
    const ready = () => root.setAttribute("data-ready", "");
    if (!canAnimate()) { ready(); return; }
    const scope = createScope({ root });
    const stops: Array<() => void> = [];
    scope.add(() => {
      animate(root, { opacity: [0, 1], translateY: [10, 0], duration: DUR.page, ease: EASE.soft, onComplete: () => { root.style.removeProperty("transform"); } });
      ready();

      root.querySelectorAll<HTMLElement>("[data-draw]").forEach((box, i) => {
        const shapes = box.querySelectorAll(`svg ${SHAPES}`);
        if (!shapes.length) return;
        const drawables = svg.createDrawable(Array.from(shapes) as unknown as SVGGeometryElement[]);
        drawables.forEach((d) => { d.draw = "0 0"; });
        stops.push(onceInView(box, () => { animate(drawables, { draw: ["0 0", "0 1"], duration: 900, delay: stagger(60, { start: 250 + (i % 4) * 90 }), ease: EASE.soft }); }));
      });

      if (isDesktop()) {
        root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
          const section = el.closest("section") ?? el;
          const amount = Number(el.dataset.parallax) || 60;
          animate(el, { translateY: [0, amount], ease: "linear", autoplay: onScroll({ target: section, enter: "top top", leave: "bottom top", sync: true }) });
        });
      }
    });
    return () => { stops.forEach((s) => s()); scope.revert(); ready(); };
  }, []);
  return <div ref={ref} data-page="">{children}</div>;
}
