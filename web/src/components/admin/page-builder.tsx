"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Eye, EyeOff, Laptop, Loader2, Plus, Redo2, Smartphone, Tablet, Trash2, Undo2 } from "lucide-react";
import { BLOCK_LABELS, BLOCK_TYPES, newKey, parseBlock, type Block, type BlockType } from "@/features/cms/blocks";
import { BLOCK_FIELDS, STYLE_FIELDS, starterBlock } from "@/features/cms/editor-fields";
import { PAGE_TYPES, pageMetaSchema, type PageMeta } from "@/features/cms/types";
import { SETTING_GROUPS, parseSetting, type SiteSettings } from "@/features/cms/settings";
import type { SiteData, PageIndexItem } from "@/lib/content";
import { api, btn, btnPrimary, inputCls } from "./api";
import { FieldForm, FocusCtx, type Obj } from "./field-input";
import { SortableList, SortableRow } from "./sortable";
import { useHistory } from "./use-history";
import { MediaPicker } from "./media-picker";

type AdminPage = PageMeta & { id: number; status: "draft" | "published"; hasUnpublishedChanges: boolean; publishedAt: string | null; blocks: Block[] };
type Doc = { meta: PageMeta; blocks: Block[] };
type Tab = "sections" | "edit" | "page";
const DEVICES = { desktop: { w: "100%", i: Laptop, l: "Desktop" }, tablet: { w: "820px", i: Tablet, l: "Tablet" }, mobile: { w: "390px", i: Smartphone, l: "Mobile" } } as const;
const META_KEYS = Object.keys(pageMetaSchema.shape) as (keyof PageMeta)[];
const pickMeta = (p: Record<string, unknown>): PageMeta => pageMetaSchema.parse(Object.fromEntries(META_KEYS.map((k) => [k, p[k]])));
const serialize = (d: Doc) => JSON.stringify(d);

export function PageBuilder({ id }: { id: number }) {
  const h = useHistory<Doc | null>(null);
  const doc = h.present;
  const [info, setInfo] = useState<{ status: string; dirtyPublished: boolean; publishedAt: string | null } | null>(null);
  const [site, setSite] = useState<SiteData | null>(null);
  const [tab, setTab] = useState<Tab>("sections");
  const [sel, setSel] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ item: number | null; nonce: number }>({ item: null, nonce: 0 });
  const [device, setDevice] = useState<keyof typeof DEVICES>("desktop");
  const [saved, setSaved] = useState("");
  const [state, setState] = useState<"loading" | "idle" | "saving" | "publishing" | "error">("loading");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [picker, setPicker] = useState<null | "og" | "card">(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);

  const dirty = !!doc && serialize(doc) !== saved;

  // ---- load page + site settings (draft) + page index (for projects previews)
  useEffect(() => {
    (async () => {
      const [p, s, list] = await Promise.all([api<AdminPage>(`pages/${id}`), api<Record<string, { draft: unknown }>>("settings"), api<PageIndexItem[]>("pages")]);
      if (!p.ok) { setState("error"); setMsg({ kind: "err", text: p.message }); return; }
      const d: Doc = { meta: pickMeta(p.data as unknown as Record<string, unknown>), blocks: (p.data.blocks ?? []).map((b) => parseBlock(b)).filter((b): b is Block => !!b) };
      h.reset(d); setSaved(serialize(d));
      setInfo({ status: p.data.status, dirtyPublished: p.data.hasUnpublishedChanges, publishedAt: p.data.publishedAt });
      if (s.ok) {
        const settings = Object.fromEntries(SETTING_GROUPS.map((g) => [g, parseSetting(g, s.data[g]?.draft)])) as unknown as SiteSettings;
        setSite({ settings, pages: list.ok ? list.data : [] });
      }
      setState("idle");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ---- push state to preview
  const push = useCallback(() => {
    if (!ready.current || !doc || !site) return;
    frame.current?.contentWindow?.postMessage({ type: "otm:state", blocks: doc.blocks, site, slug: doc.meta.slug }, window.location.origin);
  }, [doc, site]);
  useEffect(() => { push(); }, [push]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const m = e.data as { type?: string; key?: string; field?: string | null; item?: number | null };
      if (m?.type === "otm:ready") { ready.current = true; push(); }
      if (m?.type === "otm:select" && m.key) {
        setSel(m.key); setTab("edit"); setFocus((f) => ({ item: m.item ?? null, nonce: f.nonce + 1 }));
        setTimeout(() => {
          const el = m.field ? document.querySelector<HTMLElement>(`[data-fp="${CSS.escape(m.field)}"]`) : null;
          el?.scrollIntoView({ block: "center", behavior: "smooth" }); el?.classList.add("fp-flash"); setTimeout(() => el?.classList.remove("fp-flash"), 1400);
          el?.querySelector<HTMLElement>("input,textarea,select")?.focus({ preventScroll: true });
        }, 60);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [push]);
  useEffect(() => { frame.current?.contentWindow?.postMessage({ type: "otm:highlight", key: sel }, window.location.origin); }, [sel]);

  // ---- warn before leaving with unsaved work; keyboard shortcuts
  useEffect(() => {
    const bu = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", bu);
    return () => window.removeEventListener("beforeunload", bu);
  }, [dirty]);

  const mutate = (fn: (d: Doc) => Doc, group = "") => h.set((p) => (p ? fn(p) : p), group);
  const selected = useMemo(() => doc?.blocks.find((b) => b.key === sel) ?? null, [doc, sel]);

  const addBlock = (type: BlockType) => { const b = starterBlock(type, newKey()); mutate((d) => ({ ...d, blocks: [...d.blocks, b] })); setSel(b.key); setTab("edit"); setAdding(false); };
  const dup = (b: Block) => { const c = { ...structuredClone(b), key: newKey() } as Block; mutate((d) => { const i = d.blocks.findIndex((x) => x.key === b.key); return { ...d, blocks: [...d.blocks.slice(0, i + 1), c, ...d.blocks.slice(i + 1)] }; }); setSel(c.key); };
  const del = (b: Block) => { if (!confirm(`Delete this ${BLOCK_LABELS[b.type]} section?`)) return; mutate((d) => ({ ...d, blocks: d.blocks.filter((x) => x.key !== b.key) })); if (sel === b.key) { setSel(null); setTab("sections"); } };
  const toggle = (b: Block) => mutate((d) => ({ ...d, blocks: d.blocks.map((x) => (x.key === b.key ? { ...x, visible: !x.visible } : x)) }));
  const patch = (key: string, p: Partial<Block>, group: string) => mutate((d) => ({ ...d, blocks: d.blocks.map((x) => (x.key === key ? ({ ...x, ...p } as Block) : x)) }), group);

  async function save(): Promise<boolean> {
    if (!doc) return false;
    const m = pageMetaSchema.safeParse(doc.meta);
    if (!m.success) { setMsg({ kind: "err", text: `Page settings: ${m.error.issues[0]?.path.join(".")} ${m.error.issues[0]?.message}` }); setTab("page"); return false; }
    const bad = doc.blocks.find((b) => !parseBlock(b));
    if (bad) { setMsg({ kind: "err", text: `A ${BLOCK_LABELS[bad.type]} section has invalid content. Check its fields.` }); setSel(bad.key); setTab("edit"); return false; }
    setState("saving"); setMsg(null);
    const r = await api<AdminPage>(`pages/${id}`, { method: "PUT", body: { meta: m.data, blocks: doc.blocks.map(({ key, type, visible, settings, data }) => ({ key, type, visible, settings, data })) } });
    if (!r.ok) { setState("idle"); setMsg({ kind: "err", text: r.message }); return false; }
    setSaved(serialize(doc)); setInfo({ status: r.data.status, dirtyPublished: r.data.hasUnpublishedChanges, publishedAt: r.data.publishedAt });
    setState("idle"); setMsg({ kind: "ok", text: "Draft saved." }); return true;
  }
  async function publish(unpublish = false) {
    if (!unpublish && dirty && !(await save())) return;
    if (unpublish && !confirm("Take this page offline? Visitors will see a 404.")) return;
    setState("publishing"); setMsg(null);
    const r = await api<AdminPage>(`pages/${id}/${unpublish ? "unpublish" : "publish"}`, { method: "POST" });
    setState("idle");
    if (!r.ok) { setMsg({ kind: "err", text: r.message }); return; }
    setInfo({ status: r.data.status, dirtyPublished: r.data.hasUnpublishedChanges, publishedAt: r.data.publishedAt });
    setMsg({ kind: "ok", text: unpublish ? "Page is now offline." : "Published. The live site is updated." });
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey; if (!mod) return;
      const t = e.target as HTMLElement; const typing = /INPUT|TEXTAREA|SELECT/.test(t.tagName);
      if (e.key === "s") { e.preventDefault(); void save(); }
      else if (!typing && e.key === "z") { e.preventDefault(); e.shiftKey ? h.redo() : h.undo(); }
      else if (!typing && e.key === "y") { e.preventDefault(); h.redo(); }
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  if (state === "loading") return <p className="p-10 text-brand-500"><Loader2 className="mr-2 inline animate-spin" size={16} />Loading editor…</p>;
  if (!doc) return <div className="p-10"><p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{msg?.text ?? "Page not found."}</p><Link href="/admin/pages" className={btn + " mt-4"}>Back to pages</Link></div>;

  const busy = state === "saving" || state === "publishing";
  const badge = dirty ? ["Unsaved changes", "bg-amber-100 text-amber-900"] : info?.status !== "published" ? ["Draft", "bg-brand-100 text-brand-800"] : info.dirtyPublished ? ["Published · changes not live", "bg-amber-100 text-amber-900"] : ["Published", "bg-green-100 text-green-900"];
  const D = DEVICES[device];

  return (
    <div className="flex h-screen flex-col bg-brand-50">
      <header className="flex flex-wrap items-center gap-2 border-b border-brand-100 bg-white px-3 py-2">
        <Link href="/admin/pages" className={btn} aria-label="Back to pages"><ArrowLeft size={14} />Pages</Link>
        <h1 className="max-w-56 truncate font-bold">{doc.meta.name}</h1>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge[1]}`}>{badge[0]}</span>
        <div className="mx-auto flex gap-1" role="group" aria-label="Preview size">{(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map((k) => { const I = DEVICES[k].i; return <button key={k} aria-label={DEVICES[k].l} aria-pressed={device === k} onClick={() => setDevice(k)} className={`rounded-lg p-2 ${device === k ? "bg-accent-600 text-white" : "text-brand-600 hover:bg-brand-100"}`}><I size={16} /></button>; })}</div>
        <button className={btn} onClick={h.undo} disabled={!h.canUndo} aria-label="Undo"><Undo2 size={14} /></button>
        <button className={btn} onClick={h.redo} disabled={!h.canRedo} aria-label="Redo"><Redo2 size={14} /></button>
        <button className={btn} onClick={() => void save()} disabled={busy || !dirty}>{state === "saving" && <Loader2 className="animate-spin" size={14} />}Save draft</button>
        <button className={btnPrimary} onClick={() => void publish()} disabled={busy}>{state === "publishing" && <Loader2 className="animate-spin" size={14} />}Publish</button>
        {info?.status === "published" && <button className={btn} onClick={() => void publish(true)} disabled={busy}>Unpublish</button>}
      </header>
      {msg && <p role={msg.kind === "err" ? "alert" : "status"} className={`px-4 py-2 text-sm ${msg.kind === "err" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{msg.text}</p>}

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[380px] shrink-0 flex-col border-r border-brand-100 bg-white">
          <div className="flex border-b border-brand-100" role="tablist">{([["sections", "Sections"], ["edit", "Edit"], ["page", "Page & SEO"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`flex-1 px-3 py-2.5 text-sm font-semibold ${tab === k ? "border-b-2 border-accent-600 text-accent-700" : "text-brand-500"}`}>{l}</button>)}</div>
          <div className="flex-1 overflow-y-auto p-3">
            {tab === "sections" && <>
              <SortableList ids={doc.blocks.map((b) => b.key)} onReorder={(next) => mutate((d) => ({ ...d, blocks: next.map((k) => d.blocks.find((b) => b.key === k)!) }))}>
                <div className="grid gap-2">{doc.blocks.map((b) => (
                  <SortableRow key={b.key} id={b.key} className={`rounded-xl border bg-white ${sel === b.key ? "border-accent-600" : "border-brand-100"} ${b.visible ? "" : "opacity-60"}`}>
                    {(handle) => <div className="flex items-center gap-1 p-1.5">{handle}
                      <button className="flex-1 truncate text-left text-sm" onClick={() => { setSel(b.key); setTab("edit"); }}><span className="font-semibold">{BLOCK_LABELS[b.type]}</span><span className="ml-2 text-brand-500">{String((b.data as Obj).heading ?? "").slice(0, 28)}</span></button>
                      <button className="rounded p-1 text-brand-500 hover:bg-brand-100" aria-label={b.visible ? "Hide section" : "Show section"} onClick={() => toggle(b)}>{b.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                      <button className="rounded p-1 text-brand-500 hover:bg-brand-100" aria-label="Duplicate section" onClick={() => dup(b)}><Copy size={14} /></button>
                      <button className="rounded p-1 text-red-600 hover:bg-red-50" aria-label="Delete section" onClick={() => del(b)}><Trash2 size={14} /></button></div>}
                  </SortableRow>))}</div>
              </SortableList>
              {doc.blocks.length === 0 && <p className="py-6 text-center text-sm text-brand-500">No sections yet.</p>}
              <button className={btnPrimary + " mt-3 w-full"} onClick={() => setAdding((v) => !v)}><Plus size={14} />Add section</button>
              {adding && <div className="mt-2 grid grid-cols-2 gap-2">{BLOCK_TYPES.map((t) => <button key={t} className={btn} onClick={() => addBlock(t)}>{BLOCK_LABELS[t]}</button>)}</div>}
            </>}

            {tab === "edit" && (selected ? <FocusCtx.Provider value={focus}>
              <p className="mb-3 text-sm font-bold">{BLOCK_LABELS[selected.type]}</p>
              <FieldForm fields={BLOCK_FIELDS[selected.type]} value={selected.data as Obj} onChange={(v) => patch(selected.key, { data: v } as Partial<Block>, `d:${selected.key}`)} />
              <h3 className="mb-2 mt-6 border-t border-brand-100 pt-4 text-sm font-bold">Style</h3>
              <FieldForm fields={STYLE_FIELDS} value={selected.settings as unknown as Obj} onChange={(v) => patch(selected.key, { settings: v } as unknown as Partial<Block>, `s:${selected.key}`)} path="style." />
            </FocusCtx.Provider> : <p className="py-8 text-center text-sm text-brand-500">Click a section in the preview or the Sections list to edit it.</p>)}

            {tab === "page" && <div className="grid gap-3">
              <FieldForm fields={[
                { name: "name", label: "Page name", kind: "text", max: 120 },
                { name: "slug", label: "URL path", kind: "text", max: 80, hint: doc.meta.slug === "home" ? "“home” is the front page (/)." : `Public address: /${doc.meta.slug}` },
                { name: "pageType", label: "Page type", kind: "select", options: PAGE_TYPES.map((t) => [t, t[0].toUpperCase() + t.slice(1)] as [string, string]) },
                { name: "showInNav", label: "Show in navigation lists", kind: "bool" },
                { name: "summary", label: "Short summary (cards, listings)", kind: "textarea", max: 300 },
                { name: "seoTitle", label: "SEO title", kind: "text", max: 120, hint: `${doc.meta.seoTitle.length}/60 recommended` },
                { name: "seoDescription", label: "SEO description", kind: "textarea", max: 300, hint: `${doc.meta.seoDescription.length}/160 recommended` },
                { name: "canonicalUrl", label: "Canonical URL (optional)", kind: "text", max: 300 },
                { name: "noindex", label: "Hide from search engines", kind: "bool" },
              ]} value={doc.meta as unknown as Obj} onChange={(v) => mutate((d) => ({ ...d, meta: v as unknown as PageMeta }), "meta")} />
              <div className="flex gap-2"><button className={btn} onClick={() => setPicker("og")}>{doc.meta.ogImageMedia ? "Change share image" : "Share image"}</button>{doc.meta.ogImageMedia && <button className={btn} onClick={() => mutate((d) => ({ ...d, meta: { ...d.meta, ogImageMedia: null } }))}>Remove</button>}
                <button className={btn} onClick={() => setPicker("card")}>{doc.meta.cardImageMedia ? "Change card image" : "Card image"}</button>{doc.meta.cardImageMedia && <button className={btn} onClick={() => mutate((d) => ({ ...d, meta: { ...d.meta, cardImageMedia: null } }))}>Remove</button>}</div>
              <div className="rounded-xl border border-brand-100 p-3 text-sm"><p className="truncate text-base text-blue-800">{doc.meta.seoTitle || doc.meta.name}</p><p className="truncate text-green-800">/{doc.meta.slug === "home" ? "" : doc.meta.slug}</p><p className="line-clamp-2 text-brand-600">{doc.meta.seoDescription || "No description set."}</p></div>
            </div>}
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto p-4">
          <div className="mx-auto h-full overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm transition-[width]" style={{ width: D.w, maxWidth: "100%" }}>
            <iframe ref={frame} src="/preview" title="Page preview" className="h-full w-full" onLoad={() => { ready.current = true; push(); }} />
          </div>
        </main>
      </div>
      {picker && <MediaPicker onClose={() => setPicker(null)} onPick={(m) => { mutate((d) => ({ ...d, meta: { ...d.meta, [picker === "og" ? "ogImageMedia" : "cardImageMedia"]: m.id } })); setPicker(null); }} />}
    </div>
  );
}
