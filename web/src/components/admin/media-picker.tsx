"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { api, btn, btnPrimary, type MediaItem } from "./api";

export const MAX_UPLOAD = 8 * 1024 * 1024;
export async function uploadFile(file: File): Promise<{ ok: true; item: MediaItem } | { ok: false; message: string }> {
  if (file.size > MAX_UPLOAD) return { ok: false, message: `${file.name}: larger than 8 MB.` };
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return { ok: false, message: `${file.name}: only JPG, PNG, WebP or GIF.` };
  const data = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); });
  const r = await api<MediaItem>("media", { method: "POST", body: { name: file.name.replace(/\.[^.]+$/, ""), data } });
  return r.ok ? { ok: true, item: r.data } : { ok: false, message: `${file.name}: ${r.message}` };
}

export function MediaPicker({ onPick, onClose }: { onPick: (m: MediaItem) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => { const r = await api<MediaItem[]>("media"); if (r.ok) setItems(r.data); else setMsg(r.message); }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setMsg("");
    for (const f of Array.from(files)) { const r = await uploadFile(f); if (!r.ok) setMsg(r.message); else onPick(r.item); }
    setBusy(false); void load();
  }
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Media library">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-brand-100 p-4"><h2 className="text-lg font-bold">Choose an image</h2>
          <div className="flex gap-2"><input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => upload(e.target.files)} />
            <button className={btnPrimary} onClick={() => file.current?.click()} disabled={busy}>{busy ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}Upload</button>
            <button className={btn} onClick={onClose} aria-label="Close"><X size={14} /></button></div></div>
        {msg && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{msg}</p>}
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 md:grid-cols-4">
          {!items && <p className="col-span-full text-brand-500">Loading…</p>}
          {items?.length === 0 && <p className="col-span-full text-brand-500">No images yet. Upload one.</p>}
          {items?.map((m) => (
            <button key={m.id} onClick={() => onPick(m)} className="group overflow-hidden rounded-xl border border-brand-100 text-left hover:border-accent-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt} loading="lazy" className="aspect-square w-full bg-brand-50 object-cover" /><span className="block truncate p-2 text-xs">{m.name}</span></button>))}
        </div>
      </div>
    </div>
  );
}
