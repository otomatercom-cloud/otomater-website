"use client";
import { useEffect, useState } from "react";
import { BlockView } from "@/components/blocks/blocks";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ThemeStyle } from "@/components/layout/theme-style";
import { parseBlocks, type Block } from "@/features/cms/blocks";
import type { SiteData } from "@/lib/content";

type State = { blocks: Block[]; site: SiteData; slug: string };

/** Live preview inside the editor iframe. State arrives via postMessage (same-origin only); clicks are reported back. */
export function PreviewApp() {
  const [st, setSt] = useState<State | null>(null);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const m = e.data as { type?: string; blocks?: unknown[]; site?: SiteData; slug?: string; key?: string; field?: string | null };
      if (m?.type === "otm:state" && m.site && Array.isArray(m.blocks)) {
        setSt({ blocks: parseBlocks(m.blocks.map((b, i) => ({ ...(b as object), sequence: i }))), site: m.site, slug: String(m.slug ?? "") });
      } else if (m?.type === "otm:highlight") {
        document.querySelectorAll(".ed-selected").forEach((n) => n.classList.remove("ed-selected"));
        const sec = m.key ? document.querySelector(`[data-block="${CSS.escape(m.key)}"]`) : null;
        const target = (m.field && sec?.querySelector(`[data-field="${CSS.escape(m.field)}"]`)) || sec;
        target?.classList.add("ed-selected");
        sec?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "otm:ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-preview", "1");
    const click = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a,button,summary,form")) e.preventDefault(); // never navigate or submit inside the editor
      const sec = t.closest<HTMLElement>("[data-block]");
      if (!sec) return;
      const field = t.closest<HTMLElement>("[data-field]")?.dataset.field ?? null;
      const item = t.closest<HTMLElement>("[data-item]")?.dataset.item;
      window.parent.postMessage({ type: "otm:select", key: sec.dataset.block, field, item: item === undefined ? null : Number(item) }, window.location.origin);
    };
    const submit = (e: Event) => e.preventDefault();
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    return () => { document.removeEventListener("click", click, true); document.removeEventListener("submit", submit, true); document.documentElement.removeAttribute("data-preview"); };
  }, []);

  if (!st) return <p className="p-8 text-center text-brand-500">Loading preview…</p>;
  const { settings } = st.site;
  return (
    <>
      <ThemeStyle t={settings.theme} />
      <Header site={settings.site} nav={settings.navigation} />
      <main id="main">
        {st.blocks.length === 0 && <p className="p-16 text-center text-brand-500">This page has no sections yet. Add one from the left panel.</p>}
        {st.blocks.map((b) => <BlockView key={b.key} block={b} ctx={{ site: st.site, pageSlug: st.slug }} />)}
      </main>
      <Footer s={settings} />
    </>
  );
}
