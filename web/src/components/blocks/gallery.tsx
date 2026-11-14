"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { animate, canAnimate, EASE, stagger } from "@/lib/anim";
import { cn } from "@/components/ui/cn";

export type GalleryItem = { src: string; alt: string; caption: string; category: string };
const COLS = { "2": "sm:grid-cols-2", "3": "sm:grid-cols-2 lg:grid-cols-3", "4": "sm:grid-cols-2 lg:grid-cols-4" } as const;

/** Screenshot gallery: optional category tabs, click-to-enlarge lightbox (keyboard + swipe-free, focus returns on close). */
export function Gallery({ items, columns, frame, dark }: { items: GalleryItem[]; columns: keyof typeof COLS; frame: boolean; dark: boolean }) {
  const cats = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const shown = cat ? items.filter((i) => i.category === cat) : items;

  useEffect(() => {
    if (!grid.current || !canAnimate()) return;
    const a = animate(grid.current.querySelectorAll("[data-gi]"), { opacity: [0, 1], translateY: [16, 0], duration: 500, ease: EASE.out, delay: stagger(50) });
    return () => { a.revert(); };
  }, [cat]);

  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + shown.length) % shown.length)), [shown.length]);
  useEffect(() => {
    if (open === null) return;
    const prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); else if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1); };
    window.addEventListener("keydown", key); closeBtn.current?.focus();
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = prevOverflow; opener.current?.focus(); };
  }, [open === null, step]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open === null || !box.current || !canAnimate()) return;
    const a = animate(box.current, { opacity: [0, 1], scale: [0.97, 1], duration: 350, ease: EASE.out });
    return () => { a.revert(); };
  }, [open]);

  const cur = open === null ? null : shown[open];
  const chip = (active: boolean) => cn("rounded-full border px-4 py-1.5 text-sm font-medium transition", active ? "border-accent-600 bg-accent-600 text-white" : dark ? "border-white/20 text-brand-100 hover:border-accent-300" : "border-brand-200 text-brand-700 hover:border-accent-600");
  return (
    <>
      {cats.length > 0 && (
        <div role="tablist" aria-label="Filter screenshots" className="mb-8 flex flex-wrap gap-2">
          <button role="tab" aria-selected={!cat} className={chip(!cat)} onClick={() => setCat("")}>All</button>
          {cats.map((c) => <button key={c} role="tab" aria-selected={cat === c} className={chip(cat === c)} onClick={() => setCat(c)}>{c}</button>)}
        </div>)}
      <div ref={grid} className={cn("grid gap-6", COLS[columns])}>
        {shown.map((it, i) => (
          <figure key={it.src + i} data-gi className="group">
            <button type="button" onClick={(e) => { opener.current = e.currentTarget; setOpen(i); }} aria-label={`Enlarge: ${it.caption || it.alt || "screenshot"}`}
              className="block w-full overflow-hidden rounded-2xl border border-brand-100 bg-white text-left shadow-soft transition-shadow hover:shadow-lg focus-visible:outline-2">
              {frame && <span aria-hidden className="flex items-center gap-1.5 border-b border-brand-100 bg-brand-50 px-3 py-2"><i className="h-2.5 w-2.5 rounded-full bg-red-300" /><i className="h-2.5 w-2.5 rounded-full bg-amber-300" /><i className="h-2.5 w-2.5 rounded-full bg-green-300" /></span>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.src} alt={it.alt} loading="lazy" decoding="async" className="aspect-[16/10] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
            </button>
            {it.caption && <figcaption className={cn("mt-3 text-sm", dark ? "text-brand-200" : "text-brand-700")}>{it.caption}</figcaption>}
          </figure>))}
      </div>
      {cur && (
        <div role="dialog" aria-modal="true" aria-label={cur.caption || cur.alt || "Screenshot"} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4" onClick={() => setOpen(null)}>
          <div ref={box} className="relative max-h-full w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cur.src} alt={cur.alt} className="mx-auto max-h-[80vh] w-auto max-w-full rounded-xl object-contain" />
            {cur.caption && <p className="mt-3 text-center text-sm text-white/90">{cur.caption}</p>}
            <p className="mt-1 text-center text-xs text-white/60">{(open ?? 0) + 1} / {shown.length}</p>
          </div>
          <button ref={closeBtn} type="button" aria-label="Close" onClick={(e) => { e.stopPropagation(); setOpen(null); }} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X size={22} aria-hidden /></button>
          {shown.length > 1 && <>
            <button type="button" aria-label="Previous" onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronLeft size={26} aria-hidden /></button>
            <button type="button" aria-label="Next" onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronRight size={26} aria-hidden /></button></>}
        </div>)}
    </>
  );
}
