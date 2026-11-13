import "server-only";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

export const clientIp = (req: NextRequest) => req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

/** CSRF guard for cookie/JSON POSTs: browsers always send Origin on cross-site requests. */
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const o = new URL(origin);
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    return (!!host && o.host === host) || o.origin === new URL(env().SITE_URL).origin;
  } catch { return false; }
}

export async function readJson(req: NextRequest, max: number): Promise<Record<string, unknown> | null> {
  const raw = await req.text();
  if (raw.length > max) return null;
  try { const d = JSON.parse(raw); return d && typeof d === "object" && !Array.isArray(d) ? d : null; } catch { return null; }
}
