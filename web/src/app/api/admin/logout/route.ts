import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, getAdminSession } from "@/lib/admin/session";
import { sameOrigin } from "@/lib/request";
import { odooRaw } from "@/lib/odoo/client";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });
  const s = await getAdminSession();
  if (s) await odooRaw("/admin/logout", { method: "POST", token: s.t, body: "{}", timeoutMs: 5000 }).catch(() => null); // revokes the token in Odoo
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
