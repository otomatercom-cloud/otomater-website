"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { api, btn, btnDanger, btnPrimary, inputCls } from "@/components/admin/api";

type Row = { id: number; name: string; slug: string; pageType: string; status: "draft" | "published"; hasUnpublishedChanges: boolean; updatedAt: string };

export function PagesList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState<{ name: string; slug: string } | null>(null);
  const load = useCallback(async () => { const r = await api<Row[]>("pages"); if (r.ok) setRows(r.data); else setMsg(r.message); }, []);
  useEffect(() => { void load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault(); if (!form) return; setMsg("");
    const slug = form.slug.trim().replace(/^\/+|\/+$/g, "");
    const r = await api<{ id: number }>("pages", { method: "POST", body: { name: form.name.trim(), slug } });
    if (!r.ok) { setMsg(r.message); return; }
    location.href = `/admin/edit/${r.data.id}`;
  }
  async function act(row: Row, kind: "duplicate" | "delete") {
    if (kind === "delete" && !confirm(`Delete “${row.name}” permanently?`)) return;
    setMsg("");
    const r = kind === "delete" ? await api(`pages/${row.id}`, { method: "DELETE" }) : await api(`pages/${row.id}/duplicate`, { method: "POST" });
    if (!r.ok) setMsg(r.message); else void load();
  }
  return (
    <>
      <div className="mb-6 flex items-center justify-between"><h1 className="text-2xl font-bold">Pages</h1><button className={btnPrimary} onClick={() => setForm({ name: "", slug: "" })}><Plus size={14} />New page</button></div>
      {msg && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{msg}</p>}
      {form && <form onSubmit={create} className="mb-6 grid max-w-xl gap-3 rounded-xl border border-brand-100 bg-white p-4">
        <label className="grid gap-1 text-sm font-semibold">Page name<input required maxLength={120} className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} /></label>
        <label className="grid gap-1 text-sm font-semibold">URL path<input required maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*){0,2}" className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /><span className="text-xs font-normal text-brand-500">Lowercase letters, numbers, dashes. Up to 3 levels, e.g. projects/acme.</span></label>
        <div className="flex gap-2"><button className={btnPrimary}>Create and edit</button><button type="button" className={btn} onClick={() => setForm(null)}>Cancel</button></div></form>}
      <div className="overflow-x-auto rounded-xl border border-brand-100 bg-white">
        <table className="w-full text-left text-sm"><thead className="border-b border-brand-100 text-brand-500"><tr><th className="p-3">Name</th><th>Path</th><th>Status</th><th>Updated</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody>{rows?.map((r) => <tr key={r.id} className="border-b border-brand-50 last:border-0">
            <td className="p-3 font-semibold"><Link href={`/admin/edit/${r.id}`} className="hover:text-accent-700">{r.name}</Link></td><td className="text-brand-600">/{r.slug === "home" ? "" : r.slug}</td>
            <td><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === "published" ? (r.hasUnpublishedChanges ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-900") : "bg-brand-100 text-brand-800"}`}>{r.status === "published" ? (r.hasUnpublishedChanges ? "Changes not live" : "Published") : "Draft"}</span></td>
            <td className="text-brand-500">{r.updatedAt?.slice(0, 16)}</td>
            <td className="flex justify-end gap-2 p-3"><Link className={btn} href={`/admin/edit/${r.id}`}><Pencil size={14} />Edit</Link><button className={btn} onClick={() => act(r, "duplicate")} aria-label={`Duplicate ${r.name}`}><Copy size={14} /></button>
              {r.slug !== "home" && <button className={btnDanger} onClick={() => act(r, "delete")} aria-label={`Delete ${r.name}`}><Trash2 size={14} /></button>}</td></tr>)}
            {rows?.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-brand-500">No pages.</td></tr>}</tbody></table>
        {!rows && <p className="p-6 text-brand-500">Loading…</p>}
      </div>
    </>
  );
}
