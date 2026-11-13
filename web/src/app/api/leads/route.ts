import { NextResponse, type NextRequest } from "next/server";
import { leadInputSchema } from "@/features/cms/types";
import { limited } from "@/lib/rate-limit";
import { clientIp, readJson, sameOrigin } from "@/lib/request";
import { odoo, OdooUnavailable } from "@/lib/odoo/client";

const res = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return res(403, { ok: false, error: "forbidden" });
  const ip = clientIp(req);
  if (limited(`lead:${ip}`, 8, 10 * 60_000)) return res(429, { ok: false, error: "rate_limited" });
  const body = await readJson(req, 12_000);
  if (!body) return res(400, { ok: false, error: "invalid" });
  if (typeof body.website === "string" && body.website !== "") return res(200, { ok: true }); // honeypot: look successful, store nothing
  const parsed = leadInputSchema.safeParse(body);
  if (!parsed.success) return res(400, { ok: false, error: "validation", fields: parsed.error.issues.map((i) => i.path.join(".")) });
  try {
    const r = await odoo<{ id: number; duplicate: boolean }>("/public/leads", {
      method: "POST", body: { ...parsed.data, referrer: req.headers.get("referer") ?? "" }, headers: { "X-Client-IP": ip },
    });
    if (r.ok) return res(200, { ok: true });
    if (r.status === 429) return res(429, { ok: false, error: "rate_limited" });
    return res(r.status === 400 ? 400 : 502, { ok: false, error: r.status === 400 ? "validation" : "unavailable" });
  } catch (e) {
    return res(e instanceof OdooUnavailable ? 503 : 500, { ok: false, error: "unavailable" });
  }
}
