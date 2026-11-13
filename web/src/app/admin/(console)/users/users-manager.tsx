"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/components/admin/api";

type U = { id: number; name: string; login: string; roles: { editor: boolean; lead: boolean; admin: boolean } };
const ROLE_LABELS = { editor: "Editor", lead: "Lead manager", admin: "Administrator" } as const;

export function UsersManager() {
  const [users, setUsers] = useState<U[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const load = useCallback(async () => { const r = await api<U[]>("users"); if (r.ok) setUsers(r.data); else setMsg({ ok: false, t: r.message }); }, []);
  useEffect(() => { void load(); }, [load]);
  async function set(u: U, role: keyof U["roles"], on: boolean) {
    const roles = { ...u.roles, [role]: on };
    const r = await api(`users/${u.id}/roles`, { method: "PUT", body: { roles } });
    setMsg(r.ok ? { ok: true, t: `Updated ${u.name}.` } : { ok: false, t: r.message }); void load();
  }
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Users &amp; access</h1>
      <p className="mb-5 text-sm text-brand-500">Users are Odoo users. Here you only choose their website role. Administrator includes Editor and Lead manager.</p>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mb-4 rounded-lg p-3 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{msg.t}</p>}
      <div className="overflow-x-auto rounded-xl border border-brand-100 bg-white">
        <table className="w-full text-left text-sm"><thead className="border-b border-brand-100 text-brand-500"><tr><th className="p-3">User</th>{(Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[]).map((k) => <th key={k}>{ROLE_LABELS[k]}</th>)}</tr></thead>
          <tbody>{users?.map((u) => <tr key={u.id} className="border-b border-brand-50 last:border-0"><td className="p-3"><p className="font-semibold">{u.name}</p><p className="text-brand-500">{u.login}</p></td>
            {(Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[]).map((k) => <td key={k}><input type="checkbox" className="h-4 w-4 accent-accent-600" aria-label={`${ROLE_LABELS[k]} for ${u.name}`} checked={u.roles[k]} onChange={(e) => set(u, k, e.target.checked)} /></td>)}</tr>)}</tbody></table>
        {!users && <p className="p-6 text-brand-500">Loading…</p>}
      </div>
    </>
  );
}
