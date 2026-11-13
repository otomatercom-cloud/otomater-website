"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { api, btn, btnDanger, btnPrimary, inputCls, type MediaItem } from "@/components/admin/api";
import { uploadFile } from "@/components/admin/media-picker";

export function MediaManager() {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => { const r = await api<MediaItem[]>("media"); if (r.ok) setItems(r.data); else setMsg({ ok: false, t: r.message }); }, []);
  useEffect(() => { void load(); }, [load]);

  async function upload(files: FileList | null) {
    if (!files?.length) return; setBusy(true); setMsg(null);
    const errs: string[] = [];
    for (const f of Array.from(files)) { const r = await uploadFile(f); if (!r.ok) errs.push(r.message); }
    setBusy(false); if (input.current) input.current.value = "";
    setMsg(errs.length ? { ok: false, t: errs.join(" ") } : { ok: true, t: "Uploaded." }); void load();
  }
  async function save(m: MediaItem, name: string, alt: string) {
    if (name === m.name && alt === m.alt) return;
    const r = await api(`media/${m.id}`, { method: "PUT", body: { name, alt } });
    setMsg(r.ok ? { ok: true, t: "Saved." } : { ok: false, t: r.message }); if (r.ok) void load();
  }
  async function del(m: MediaItem) {
    if (!confirm(`Delete “${m.name}”?`)) return;
    const r = await api(`media/${m.id}`, { method: "DELETE" });
    setMsg(r.ok ? { ok: true, t: "Deleted." } : { ok: false, t: r.message }); if (r.ok) void load();
  }
  return (
    <>
      <div className="mb-6 flex items-center justify-between"><h1 className="text-2xl font-bold">Media</h1>
        <div><input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => upload(e.target.files)} />
          <button className={btnPrimary} disabled={busy} onClick={() => input.current?.click()}>{busy ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}Upload images</button></div></div>
      <p className="mb-4 text-sm text-brand-500">JPG, PNG, WebP or GIF, up to 8 MB each. Add alt text so everyone can understand the image.</p>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mb-4 rounded-lg p-3 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{msg.t}</p>}
      {!items && <p className="text-brand-500">Loading…</p>}
      {items?.length === 0 && <p className="text-brand-500">No images yet.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items?.map((m) => <Card key={m.id} m={m} onSave={save} onDelete={del} />)}</div>
    </>
  );
}

function Card({ m, onSave, onDelete }: { m: MediaItem; onSave: (m: MediaItem, n: string, a: string) => void; onDelete: (m: MediaItem) => void }) {
  const [name, setName] = useState(m.name); const [alt, setAlt] = useState(m.alt);
  return (
    <div className="overflow-hidden rounded-xl border border-brand-100 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.url} alt={m.alt} loading="lazy" className="aspect-video w-full bg-brand-50 object-contain" />
      <div className="grid gap-2 p-3">
        <input aria-label="Name" className={inputCls} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} onBlur={() => onSave(m, name, alt)} />
        <input aria-label="Alt text" placeholder="Alt text" className={inputCls} value={alt} maxLength={200} onChange={(e) => setAlt(e.target.value)} onBlur={() => onSave(m, name, alt)} />
        <div className="flex items-center justify-between text-xs text-brand-500"><span>{m.width}×{m.height} · {(m.size / 1024).toFixed(0)} KB · used {m.usage}×</span>
          <button className={btnDanger} onClick={() => onDelete(m)} disabled={m.usage > 0} title={m.usage > 0 ? "In use. Remove it from pages first." : "Delete"} aria-label={`Delete ${m.name}`}><Trash2 size={14} /></button></div>
      </div>
    </div>
  );
}
