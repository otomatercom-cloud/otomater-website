import { env } from "@/lib/env";

/** Streams a Media Library image from Odoo. Odoo itself is never exposed to the browser. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^\d{1,9}$/.test(id)) return new Response("Not found", { status: 404 });
  const e = env();
  try {
    const r = await fetch(`${e.ODOO_BASE_URL.replace(/\/+$/, "")}/api/otomater/v1/public/media/${id}?db=${encodeURIComponent(e.ODOO_DATABASE)}`, {
      headers: { Authorization: `Bearer ${e.ODOO_API_KEY}` }, signal: AbortSignal.timeout(8000), cache: "no-store",
    });
    if (!r.ok) return new Response("Not found", { status: r.status === 404 ? 404 : 502 });
    return new Response(r.body, { headers: {
      "Content-Type": r.headers.get("content-type") ?? "application/octet-stream", "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'", "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
  } catch { return new Response("Unavailable", { status: 502 }); }
}
