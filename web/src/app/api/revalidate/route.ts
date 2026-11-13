import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const TAG = /^otomater:[a-z0-9:/-]{1,100}$/;

export async function POST(req: NextRequest) {
  const given = Buffer.from((req.headers.get("authorization") ?? "").replace(/^Bearer /, ""));
  const want = Buffer.from(env().REVALIDATE_SECRET);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((t): t is string => typeof t === "string" && TAG.test(t)).slice(0, 50) : [];
  for (const t of tags) revalidateTag(t, "max");
  return NextResponse.json({ ok: true, revalidated: tags.length });
}
