import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { COOKIE, cookieOptions, seal } from "@/lib/admin/session";
import { limited } from "@/lib/rate-limit";
import { clientIp, readJson, sameOrigin } from "@/lib/request";
import { odoo, OdooUnavailable } from "@/lib/odoo/client";

const bodySchema = z.object({ login: z.string().min(1).max(200), password: z.string().min(1).max(500) });
const out = (status: number, body: object) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return out(403, { ok: false, error: "forbidden" });
  const ip = clientIp(req);
  const body = bodySchema.safeParse(await readJson(req, 2000));
  if (!body.success) return out(400, { ok: false, error: "invalid" });
  if (limited(`alogin-ip:${ip}`, 15, 15 * 60_000) || limited(`alogin:${body.data.login.toLowerCase()}`, 6, 15 * 60_000)) return out(429, { ok: false, error: "rate_limited" });
  try {
    const r = await odoo<{ token: string; name: string; roles: { editor: boolean; lead: boolean; admin: boolean }; expiresIn: number }>("/admin/login", { method: "POST", body: body.data, headers: { "X-Client-IP": ip } });
    if (!r.ok) return out(r.status === 429 ? 429 : r.status === 403 ? 403 : 401, { ok: false, error: r.status === 403 ? "forbidden" : r.status === 429 ? "rate_limited" : "invalid_credentials" });
    const res = out(200, { ok: true, name: r.data.name, roles: r.data.roles });
    // always a brand-new cookie on login: no pre-login session exists to fixate
    res.cookies.set(COOKIE, seal({ t: r.data.token, n: r.data.name, r: r.data.roles, e: Math.floor(Date.now() / 1000) + r.data.expiresIn }), cookieOptions(r.data.expiresIn));
    return res;
  } catch (e) {
    return out(e instanceof OdooUnavailable ? 503 : 500, { ok: false, error: "unavailable" });
  }
}
