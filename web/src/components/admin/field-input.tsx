"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Copy, Image as ImageIcon, Plus, Trash2, X } from "lucide-react";
import type { FieldDef } from "@/features/cms/editor-fields";
import { btn, btnDanger, inputCls, type MediaItem } from "./api";
import { MediaPicker } from "./media-picker";
import { SortableList, SortableRow } from "./sortable";

export type Obj = Record<string, unknown>;
/** Set by the page builder when the editor clicks something in the preview: open that list item. */
export const FocusCtx = createContext<{ item: number | null; nonce: number }>({ item: null, nonce: 0 });

const getIn = (o: unknown, path: string): unknown => path.split(".").reduce<unknown>((a, k) => (a && typeof a === "object" ? (a as Obj)[k] : undefined), o);
const clone = <T,>(v: T): T => structuredClone(v);

function Wrap({ f, path, children }: { f: FieldDef; path: string; children: React.ReactNode }) {
  return <div data-fp={path} className="grid gap-1 rounded-lg p-1 transition [&.fp-flash]:bg-accent-600/10 [&.fp-flash]:ring-2 [&.fp-flash]:ring-accent-600"><label className="text-xs font-semibold text-brand-700">{f.label}</label>{children}{f.hint && <p className="text-xs text-brand-500">{f.hint}</p>}</div>;
}

export function FieldForm({ fields, value, onChange, path = "" }: { fields: FieldDef[]; value: Obj; onChange: (v: Obj) => void; path?: string }) {
  return <div className="grid gap-3">{fields.map((f) => <FieldRow key={f.name} f={f} path={path + f.name} value={value[f.name]} onChange={(v) => onChange({ ...value, [f.name]: v })} />)}</div>;
}

function ImageField({ value, onChange }: { value: { media: number | null; alt: string }; onChange: (v: { media: number | null; alt: string }) => void }) {
  const [open, setOpen] = useState(false);
  const v = value ?? { media: null, alt: "" };
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        {v.media ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/media/${v.media}`} alt="" className="h-14 w-14 rounded-lg border border-brand-100 object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-lg border border-dashed border-brand-300 text-brand-400"><ImageIcon size={18} /></span>}
        <button type="button" className={btn} onClick={() => setOpen(true)}>{v.media ? "Change" : "Choose image"}</button>
        {v.media && <button type="button" className={btn} onClick={() => onChange({ media: null, alt: "" })}>Remove</button>}
      </div>
      {v.media && <input className={inputCls} placeholder="Describe the image (alt text, for accessibility)" maxLength={200} value={v.alt ?? ""} onChange={(e) => onChange({ ...v, alt: e.target.value })} />}
      {open && <MediaPicker onClose={() => setOpen(false)} onPick={(m: MediaItem) => { onChange({ media: m.id, alt: v.alt || m.alt }); setOpen(false); }} />}
    </div>
  );
}

function FieldRow({ f, value, onChange, path }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void; path: string }) {
  switch (f.kind) {
    case "text": return <Wrap f={f} path={path}><input className={inputCls} maxLength={f.max} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} /></Wrap>;
    case "textarea": case "rich": return <Wrap f={f} path={path}><textarea className={inputCls + (f.kind === "rich" ? " min-h-40 font-mono text-[13px]" : "")} rows={f.kind === "rich" ? 8 : 3} maxLength={f.kind === "rich" ? 20000 : f.max} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} /></Wrap>;
    case "number": return <Wrap f={f} path={path}><input type="number" className={inputCls} min={f.min} max={f.max} value={(value as number) ?? ""} onChange={(e) => onChange(e.target.value === "" ? f.min ?? 0 : Number(e.target.value))} /></Wrap>;
    case "bool": return <div data-fp={path} className="p-1"><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-accent-600" checked={!!value} onChange={(e) => onChange(e.target.checked)} />{f.label}</label></div>;
    case "color": return <Wrap f={f} path={path}><div className="flex items-center gap-2"><input type="color" aria-label={f.label} value={(value as string) || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-brand-200" /><input className={inputCls + " max-w-32 font-mono"} value={(value as string) ?? ""} maxLength={7} onChange={(e) => onChange(e.target.value)} /></div></Wrap>;
    case "select": return <Wrap f={f} path={path}><select className={inputCls} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Wrap>;
    case "multi": { const cur = (value as string[]) ?? []; return <Wrap f={f} path={path}><div className="flex flex-wrap gap-3">{f.options.map(([v, l]) => <label key={v} className="flex items-center gap-1.5 text-sm"><input type="checkbox" className="accent-accent-600" checked={cur.includes(v)} onChange={(e) => onChange(e.target.checked ? [...cur, v] : cur.filter((x) => x !== v))} />{l}</label>)}</div></Wrap>; }
    case "image": return <Wrap f={f} path={path}><ImageField value={value as { media: number | null; alt: string }} onChange={onChange} /></Wrap>;
    case "media": return <MediaIdField f={f} path={path} value={value as number | null} onChange={onChange} />;
    case "link": {
      const v = value as { label: string; href: string; style?: string } | null;
      return <Wrap f={f} path={path}>{v ? <div className="grid gap-2 rounded-lg border border-brand-100 p-2">
        <input className={inputCls} placeholder="Label" maxLength={80} value={v.label} onChange={(e) => onChange({ ...v, label: e.target.value })} />
        <input className={inputCls} placeholder="/contact or https://…" maxLength={500} value={v.href} onChange={(e) => onChange({ ...v, href: e.target.value })} />
        <button type="button" className={btn + " justify-self-start"} onClick={() => onChange(null)}><X size={14} />Remove</button></div>
        : <button type="button" className={btn + " justify-self-start"} onClick={() => onChange({ label: "Button", href: "/contact" })}><Plus size={14} />Add</button>}</Wrap>;
    }
    case "strings": { const list = (value as string[]) ?? []; return <Wrap f={f} path={path}><div className="grid gap-2">{list.map((s, i) => <div key={i} className="flex gap-2"><input className={inputCls} value={s} maxLength={160} onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} /><button type="button" className={btnDanger} aria-label="Remove" onClick={() => onChange(list.filter((_, j) => j !== i))}><Trash2 size={14} /></button></div>)}
      {list.length < f.max && <button type="button" className={btn + " justify-self-start"} onClick={() => onChange([...list, ""])}><Plus size={14} />Add</button>}</div></Wrap>; }
    case "list": return <ListField f={f} path={path} value={(value as Obj[]) ?? []} onChange={onChange} />;
  }
}

function MediaIdField({ f, path, value, onChange }: { f: Extract<FieldDef, { kind: "media" }>; path: string; value: number | null; onChange: (v: unknown) => void }) {
  const [open, setOpen] = useState(false);
  return <Wrap f={f} path={path}><div className="flex items-center gap-3">
    {value ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/media/${value}`} alt="" className="h-12 w-12 rounded-lg border border-brand-100 object-contain" /> : <span className="grid h-12 w-12 place-items-center rounded-lg border border-dashed border-brand-300 text-brand-400"><ImageIcon size={16} /></span>}
    <button type="button" className={btn} onClick={() => setOpen(true)}>{value ? "Change" : "Choose image"}</button>{value && <button type="button" className={btn} onClick={() => onChange(null)}>Remove</button>}</div>
    {open && <MediaPicker onClose={() => setOpen(false)} onPick={(m) => { onChange(m.id); setOpen(false); }} />}</Wrap>;
}

function ListField({ f, path, value, onChange }: { f: Extract<FieldDef, { kind: "list" }>; path: string; value: Obj[]; onChange: (v: unknown) => void }) {
  const focus = useContext(FocusCtx);
  const [open, setOpen] = useState<Set<number>>(new Set());
  useEffect(() => { if (focus.item !== null && path === "items") setOpen((s) => new Set(s).add(focus.item!)); }, [focus.nonce, focus.item, path]);
  const toggle = (i: number) => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  const ids = value.map((_, i) => `${path}-${i}`);
  const title = (it: Obj, i: number) => String(getIn(it, f.titleKey) || `${f.itemLabel} ${i + 1}`).slice(0, 48);
  return (
    <div data-fp={path} className="grid gap-2 p-1">
      <p className="text-xs font-semibold text-brand-700">{f.label} <span className="font-normal text-brand-400">({value.length}/{f.max})</span></p>
      <SortableList ids={ids} onReorder={(next) => onChange(next.map((id) => value[ids.indexOf(id)]))}>
        {value.map((it, i) => (
          <SortableRow key={ids[i]} id={ids[i]} className="rounded-xl border border-brand-100 bg-brand-50/50">
            {(handle) => <>
              <div className="flex items-center gap-1 p-1.5">{handle}
                <button type="button" className="flex flex-1 items-center gap-1 truncate text-left text-sm font-medium" onClick={() => toggle(i)} aria-expanded={open.has(i)}>{open.has(i) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{title(it, i)}</button>
                <button type="button" className="rounded p-1 text-brand-500 hover:bg-brand-100 disabled:opacity-40" aria-label="Duplicate" disabled={value.length >= f.max} onClick={() => onChange([...value.slice(0, i + 1), clone(it), ...value.slice(i + 1)])}><Copy size={14} /></button>
                <button type="button" className="rounded p-1 text-red-600 hover:bg-red-50" aria-label="Delete" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 size={14} /></button></div>
              {open.has(i) && <div className="border-t border-brand-100 p-3"><FieldForm fields={f.fields} value={it} path={`${path}.${i}.`} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} /></div>}
            </>}
          </SortableRow>))}
      </SortableList>
      {value.length < f.max && <button type="button" className={btn + " justify-self-start"} onClick={() => { onChange([...value, clone(f.blank)]); setOpen((s) => new Set(s).add(value.length)); }}><Plus size={14} />Add {f.itemLabel.toLowerCase()}</button>}
    </div>
  );
}
