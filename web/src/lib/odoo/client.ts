import "server-only";
import { env } from "@/lib/env";

export class OdooUnavailable extends Error {}
export type OdooResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: string };

type Opts = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Signed Odoo admin token (from the admin session). Absent for public calls. */
  adminToken?: string;
  /** ISR seconds + cache tags: ONLY for public published reads. Admin/draft calls are always no-store. */
  revalidate?: number;
  tags?: string[];
  timeoutMs?: number;
  headers?: Record<string, string>;
};

/** The only door to Odoo. Secrets stay here (server only); the browser never talks to Odoo. */
export async function odoo<T>(path: string, o: Opts = {}): Promise<OdooResult<T>> {
  const e = env();
  const url = new URL(`${e.ODOO_BASE_URL.replace(/\/+$/, "")}/api/otomater/v1${path}`);
  url.searchParams.set("db", e.ODOO_DATABASE);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? e.CONTENT_TIMEOUT_MS);
  const headers: Record<string, string> = { Authorization: `Bearer ${e.ODOO_API_KEY}`, "Content-Type": "application/json" };
  if (o.adminToken) headers["X-Admin-Token"] = o.adminToken;
  Object.assign(headers, o.headers);
  const isPublicRead = !o.adminToken && (o.method ?? "GET") === "GET" && o.revalidate !== undefined;
  try {
    const res = await fetch(url, {
      method: o.method ?? "GET", headers, signal: ctrl.signal,
      body: o.body === undefined ? undefined : JSON.stringify(o.body),
      ...(isPublicRead ? { next: { revalidate: o.revalidate, tags: o.tags } } : { cache: "no-store" as const }),
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; data?: T } | null;
    if (!res.ok || !json || json.ok === false) return { ok: false, status: res.status, error: json?.error ?? "odoo_error" };
    return { ok: true, status: res.status, data: json.data as T };
  } catch {
    throw new OdooUnavailable("Odoo is unreachable");
  } finally {
    clearTimeout(timer);
  }
}
export const CACHE_TAGS = { site: "otomater:site", pages: "otomater:pages", page: (slug: string) => `otomater:page:${slug}` } as const;
