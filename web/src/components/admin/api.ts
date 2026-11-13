"use client";
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; message: string };

/** Browser -> Next proxy -> Odoo. A 401 means the session ended: go to the login screen. */
export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const r = await fetch(`/api/admin/${path}`, { method: opts.method ?? "GET", headers: { "Content-Type": "application/json" }, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
    const j = (await r.json().catch(() => null)) as { ok?: boolean; data?: T; error?: string; message?: string } | null;
    if (r.status === 401) { location.href = "/admin/login?expired=1"; }
    if (!r.ok || !j || j.ok === false) return { ok: false, status: r.status, error: j?.error ?? "error", message: j?.message || (r.status === 503 ? "Odoo is not reachable." : r.status === 403 ? "You do not have permission." : "Something went wrong.") };
    return { ok: true, data: j.data as T };
  } catch { return { ok: false, status: 0, error: "network", message: "Network problem." }; }
}
export type MediaItem = { id: number; name: string; filename: string; mimetype: string; size: number; width: number; height: number; alt: string; url: string; usage: number };
export const btn = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-800 hover:bg-brand-50 disabled:opacity-50";
export const btnPrimary = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-50";
export const btnDanger = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50";
export const inputCls = "w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:border-accent-600";
