import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const COOKIE = "otm_admin";
export type Roles = { editor: boolean; lead: boolean; admin: boolean };
export type AdminSession = { t: string; n: string; r: Roles; e: number };

const sig = (body: string) => createHmac("sha256", env().SESSION_SECRET).update(body).digest("base64url");

/** Cookie value = base64url(json).hmac. The Odoo token inside is itself signed + revocable by Odoo; the cookie is HttpOnly so JS never sees it. */
export function seal(s: AdminSession): string {
  const body = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${body}.${sig(body)}`;
}
export function unseal(v: string | undefined): AdminSession | null {
  if (!v) return null;
  const [body, mac] = v.split(".");
  if (!body || !mac) return null;
  const a = Buffer.from(mac), b = Buffer.from(sig(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as AdminSession;
    return s.e * 1000 > Date.now() && typeof s.t === "string" ? s : null;
  } catch { return null; }
}
export async function getAdminSession(): Promise<AdminSession | null> {
  return unseal((await cookies()).get(COOKIE)?.value);
}
export const cookieOptions = (maxAge = 8 * 3600) => ({ httpOnly: true, sameSite: "strict" as const, secure: env().SITE_URL.startsWith("https"), path: "/", maxAge });
