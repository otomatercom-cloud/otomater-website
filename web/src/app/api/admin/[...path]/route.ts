import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, getAdminSession } from "@/lib/admin/session";
import { CACHE_TAGS, odooRaw, OdooUnavailable } from "@/lib/odoo/client";
import { sameOrigin } from "@/lib/request";

/** Authenticated BFF proxy. Strict allowlist per method: the browser can only reach these Odoo admin endpoints. */
const ALLOW: Record<string, RegExp> = {
  GET: /^(session|pages|pages\/\d+|settings|media|leads|leads\/\d+|leads\/export|users)$/,
  POST: /^(pages|pages\/\d+\/(publish|unpublish|duplicate)|settings\/publish|media)$/,
  PUT: /^(pages\/\d+|settings\/[a-z]{3,20}|media\/\d+|leads\/\d+|users\/\d+\/roles)$/,
  DELETE: /^(pages\/\d+|media\/\d+)$/,
};
const QUERY_KEYS = ["search", "status", "service", "limit", "offset"];
const MAX_BODY = 14 * 1024 * 1024;

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const method = req.method;
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (method !== "GET" && !sameOrigin(req)) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const path = (await ctx.params).path.join("/");
  if (!ALLOW[method]?.test(path)) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  let body: string | undefined;
  if (method === "POST" || method === "PUT") {
    body = await req.text();
    if (body.length > MAX_BODY) return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 });
  }
  const search = new URLSearchParams();
  req.nextUrl.searchParams.forEach((v, k) => QUERY_KEYS.includes(k) && search.set(k, v.slice(0, 100)));
  try {
    // deleting a published page: remember its slug so the right cache entry can be dropped afterwards
    let slugBefore = "";
    if (method === "DELETE" && /^pages\/\d+$/.test(path)) {
      const pre = await odooRaw(`/admin/${path}`, { method: "GET", token: s.t });
      slugBefore = ((await pre.json().catch(() => null)) as { data?: { slug?: string } } | null)?.data?.slug ?? "";
    }
    const r = await odooRaw(`/admin/${path}`, { method, token: s.t, body, search: search.toString() });
    const type = r.headers.get("content-type") ?? "application/json";
    const text = await r.text();
    if (r.ok && method !== "GET") {
      const tags: string[] = [];
      const m = /^pages\/(\d+)\/(publish|unpublish)$/.exec(path);
      if (m) {
        const slug = (JSON.parse(text) as { data?: { slug?: string } }).data?.slug;
        tags.push(CACHE_TAGS.site, CACHE_TAGS.pages, ...(slug ? [CACHE_TAGS.page(slug)] : []));
      } else if (path === "settings/publish") tags.push(CACHE_TAGS.site);
      else if (slugBefore) tags.push(CACHE_TAGS.site, CACHE_TAGS.pages, CACHE_TAGS.page(slugBefore));
      tags.forEach((t) => revalidateTag(t, { expire: 0 }));
    }
    const res = new NextResponse(text, { status: r.status, headers: { "Content-Type": type, "Cache-Control": "no-store", ...(type.startsWith("text/csv") ? { "Content-Disposition": 'attachment; filename="enquiries.csv"' } : {}) } });
    if (r.status === 401) res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 }); // Odoo revoked/expired the token
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof OdooUnavailable ? "unavailable" : "server_error" }, { status: e instanceof OdooUnavailable ? 503 : 500 });
  }
}
export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
