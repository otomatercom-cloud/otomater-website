"use client";
import { useEffect, useRef, useState } from "react";
import { animate, canAnimate, createScope, EASE, stagger } from "@/lib/anim";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/components/ui/cn";
import { ACCENT, type Accent } from "./accent";


/**
 * Types the words one after another. The server HTML (and no-JS / reduced-motion / admin preview) holds the
 * first word in full; the full list is exposed through aria-label so screen readers do not hear letters appear.
 */
export function Typewriter({ words }: { words: string[] }) {
  const [text, setText] = useState(words[0] ?? "");
  const caret = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!canAnimate() || !caret.current) return;
    const blink = animate(caret.current, { opacity: [1, 0], duration: 520, loop: true, alternate: true, ease: "linear" });
    let stop = false, idx = 0, t: ReturnType<typeof setTimeout>;
    const step = (cur: string, del: boolean) => {
      if (stop) return;
      const w = words[idx];
      if (!del && cur.length < w.length) t = setTimeout(() => { setText(w.slice(0, cur.length + 1)); step(w.slice(0, cur.length + 1), false); }, 70);
      else if (!del) t = setTimeout(() => step(cur, true), words.length > 1 ? 2200 : 1e9);
      else if (cur.length > 0) t = setTimeout(() => { setText(cur.slice(0, -1)); step(cur.slice(0, -1), true); }, 40);
      else { idx = (idx + 1) % words.length; step("", false); }
    };
    // first word is already shown by the server: wait, then erase it and continue the cycle
    t = setTimeout(() => { if (words.length > 1) step(words[0], true); }, 2200);
    return () => { stop = true; clearTimeout(t); blink.revert(); };
  }, [words]);
  return (
    <span aria-label={words.join(", ")} className="inline-block min-h-[1.1em] bg-gradient-to-r from-accent-300 to-accent-500 bg-clip-text text-transparent">
      <span aria-hidden data-field="words">{text}</span>
      <span aria-hidden ref={caret} className="ml-1 inline-block h-[0.85em] w-[3px] translate-y-[0.08em] bg-accent-300" />
    </span>
  );
}

type Node = { label: string; value: string; caption: string; accent: Accent };

/** Hub tile + live node cards. Loops (float, pulse rings, data beams, drifting dots) run only when motion is allowed. */
export function AutomationDiagram({ hubLabel, hubCaption, nodes }: { hubLabel: string; hubCaption: string; nodes: Node[] }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current; if (!el || !canAnimate()) return;
    const scope = createScope({ root: el }).add(() => {
      animate("[data-hub]", { translateY: [-6, 6], duration: 2600, loop: true, alternate: true, ease: "inOutSine" });
      animate("[data-ring]", { scale: [1, 1.7], opacity: [0.45, 0], duration: 2400, loop: true, ease: "outQuad", delay: stagger(1200) });
      animate("[data-beam]", { scaleX: [0.5, 1], opacity: [0.3, 1], duration: 1400, loop: true, alternate: true, ease: "inOutSine", delay: stagger(300) });
      animate("[data-live]", { opacity: [1, 0.25], duration: 900, loop: true, alternate: true, ease: "inOutSine", delay: stagger(220) });
      animate("[data-packet]", { translateY: [0, -14], translateX: [0, 8], duration: 2600, loop: true, alternate: true, ease: "inOutSine", delay: stagger(700) });
    });
    return () => scope.revert();
  }, []);
  return (
    <div ref={root} className="relative mx-auto w-full max-w-md" aria-hidden>
      {(hubLabel || hubCaption) && (
        <div className="relative mx-auto mb-8 flex h-36 w-36 items-center justify-center">
          <span data-ring className="absolute inset-3 rounded-full border border-accent-300/60" />
          <span data-ring className="absolute inset-3 rounded-full border border-accent-300/40" />
          <div data-hub className="relative z-10 flex h-28 w-28 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-accent-600 to-accent-300 shadow-[0_18px_50px_rgba(25,165,149,0.35)]">
            <span className="font-display text-3xl font-bold text-white">{hubLabel}</span>
            <span className="mt-0.5 text-[10px] uppercase tracking-widest text-white/80">{hubCaption}</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {nodes.map((n, i) => {
          const c = ACCENT[n.accent];
          return (
            <Reveal key={i} delay={0.15 + i * 0.1} y={22}>
              <div data-hover="lift" className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border text-[11px] font-bold tracking-wide" style={{ color: c.hex, borderColor: c.hex + "55", background: c.hex + "1a" }}>{n.label}</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-brand-300"><span data-live className="h-2 w-2 rounded-full" style={{ background: c.hex }} />LIVE</span>
                </div>
                <div data-beam className="my-3 h-0.5 w-full origin-left rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${c.hex}, transparent)` }} />
                <div className="flex items-end gap-1">
                  <span className={cn("font-display text-lg font-bold")} style={{ color: c.hex }}>{n.value}</span>
                  <span className="mb-0.5 text-[10px] text-brand-300">{n.caption}</span>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
      {[0, 1, 2].map((i) => (
        <span key={i} data-packet className="pointer-events-none absolute h-3 w-3 rounded-full opacity-60"
          style={{ top: `${[28, 52, 76][i]}%`, left: `${[8, 88, 46][i]}%`, background: ACCENT[(["blue", "green", "amber"] as Accent[])[i]].hex }} />
      ))}
    </div>
  );
}
