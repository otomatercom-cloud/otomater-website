"use client";
import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import { api, btn, btnPrimary, inputCls } from "@/components/admin/api";

type Lead = { id: number; name: string; email: string; phone: string; company: string; service: string; message: string; status: string; notes: string; sourcePage: string; referrer: string; utmSource: string; utmMedium: string; utmCampaign: string; submittedAt: string; consent: boolean };
const STATUSES = [["new", "New"], ["contacted", "Contacted"], ["qualified", "Qualified"], ["won", "Won"], ["lost", "Lost"], ["spam", "Spam"]] as const;
const COLORS: Record<string, string> = { new: "bg-blue-100 text-blue-900", contacted: "bg-amber-100 text-amber-900", qualified: "bg-purple-100 text-purple-900", won: "bg-green-100 text-green-900", lost: "bg-brand-100 text-brand-800", spam: "bg-red-100 text-red-900" };
const PAGE = 25;

export function LeadsManager() {
  const [q, setQ] = useState(""); const [status, setStatus] = useState(""); const [offset, setOffset] = useState(0);
  const [data, setData] = useState<{ total: number; items: Lead[] } | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<Lead | null>(null);

  const query = useCallback((extra: Record<string, string> = {}) => new URLSearchParams({ ...(q.trim() && { search: q.trim() }), ...(status && { status }), ...extra }).toString(), [q, status]);
  const load = useCallback(async () => {
    const r = await api<{ total: number; items: Lead[] }>(`leads?${query({ limit: String(PAGE), offset: String(offset) })}`);
    if (r.ok) { setData(r.data); setErr(""); } else setErr(r.message);
  }, [query, offset]);
  useEffect(() => { const t = setTimeout(() => void load(), 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => setOffset(0), [q, status]);

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE)) : 1;
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Enquiries {data && <span className="text-base font-normal text-brand-500">({data.total})</span>}</h1>
        <a className={btn} href={`/api/admin/leads/export?${query()}`}><Download size={14} />Export CSV</a></div>
      <div className="mb-4 flex flex-wrap gap-2">
        <input className={inputCls + " max-w-xs"} placeholder="Search name, email, phone, company" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={inputCls + " max-w-44"} aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      {err && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{err}</p>}
      <div className="overflow-x-auto rounded-xl border border-brand-100 bg-white">
        <table className="w-full text-left text-sm"><thead className="border-b border-brand-100 text-brand-500"><tr><th className="p-3">Received</th><th>Name</th><th>Contact</th><th>Service</th><th>Status</th></tr></thead>
          <tbody>{data?.items.map((l) => <tr key={l.id} className="cursor-pointer border-b border-brand-50 last:border-0 hover:bg-brand-50" onClick={() => setOpen(l)}>
            <td className="whitespace-nowrap p-3 text-brand-500">{l.submittedAt.slice(0, 16)}</td><td className="font-semibold"><button className="text-left hover:text-accent-700" onClick={() => setOpen(l)}>{l.name}</button>{l.company && <span className="block text-xs font-normal text-brand-500">{l.company}</span>}</td>
            <td className="text-brand-600">{l.email}<span className="block text-xs">{l.phone}</span></td><td className="text-brand-600">{l.service || "-"}</td>
            <td><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COLORS[l.status] ?? ""}`}>{l.status}</span></td></tr>)}
            {data?.items.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-brand-500">No enquiries found.</td></tr>}</tbody></table>
        {!data && <p className="p-6 text-brand-500">Loading…</p>}
      </div>
      {data && data.total > PAGE && <div className="mt-4 flex items-center justify-end gap-3 text-sm"><span className="text-brand-500">Page {offset / PAGE + 1} of {pages}</span>
        <button className={btn} disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Previous</button><button className={btn} disabled={offset + PAGE >= data.total} onClick={() => setOffset(offset + PAGE)}>Next</button></div>}
      {open && <Detail lead={open} onClose={() => setOpen(null)} onSaved={(l) => { setOpen(l); void load(); }} />}
    </>
  );
}

function Detail({ lead, onClose, onSaved }: { lead: Lead; onClose: () => void; onSaved: (l: Lead) => void }) {
  const [status, setStatus] = useState(lead.status); const [notes, setNotes] = useState(lead.notes);
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  async function save() {
    setBusy(true); setMsg(null);
    const r = await api<Lead>(`leads/${lead.id}`, { method: "PUT", body: { status, notes } });
    setBusy(false);
    if (r.ok) { setMsg({ ok: true, t: "Saved." }); onSaved(r.data); } else setMsg({ ok: false, t: r.message });
  }
  const row = (k: string, v: string) => v ? <div><dt className="text-xs font-semibold text-brand-500">{k}</dt><dd className="break-words text-sm">{v}</dd></div> : null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="dialog" aria-modal="true" aria-label="Enquiry details" onClick={onClose}>
      <aside className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between"><div><h2 className="text-lg font-bold">{lead.name}</h2><p className="text-sm text-brand-500">{lead.submittedAt.slice(0, 16)}</p></div><button className={btn} onClick={onClose} aria-label="Close"><X size={14} /></button></div>
        <dl className="grid gap-3">{row("Email", lead.email)}{row("Phone", lead.phone)}{row("Company", lead.company)}{row("Service", lead.service)}{row("Message", lead.message)}{row("Page", lead.sourcePage)}{row("Referrer", lead.referrer)}{row("Campaign", [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" / "))}</dl>
        <div className="mt-3 flex gap-2 text-sm"><a className="text-accent-700 hover:underline" href={`mailto:${lead.email}`}>Email</a><a className="text-accent-700 hover:underline" href={`tel:${lead.phone}`}>Call</a></div>
        <div className="mt-6 grid gap-3 border-t border-brand-100 pt-4">
          <label className="grid gap-1 text-sm font-semibold">Status<select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-semibold">Internal notes<textarea className={inputCls} rows={5} maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-lg p-2 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{msg.t}</p>}
          <button className={btnPrimary} onClick={save} disabled={busy || (status === lead.status && notes === lead.notes)}>{busy && <Loader2 className="animate-spin" size={14} />}Save</button></div>
      </aside>
    </div>
  );
}
