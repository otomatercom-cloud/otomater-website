import "server-only";
import { cache } from "react";
import { env } from "@/lib/env";
import { CACHE_TAGS, odoo, OdooUnavailable } from "@/lib/odoo/client";
import { type PublicPage, toPublicPage } from "@/features/cms/types";
import { SETTING_GROUPS, type SiteSettings, parseSetting } from "@/features/cms/settings";

export type PageIndexItem = { id: number; name: string; slug: string; pageType: string; showInNav: boolean; sequence: number; summary: string; cardImageMedia: number | null; publishedAt: string | null };
export type SiteData = { settings: SiteSettings; pages: PageIndexItem[] };

/** Published site settings + page index. null = Odoo unreachable (callers show a controlled fallback, never invented copy). */
export const getSite = cache(async (): Promise<SiteData | null> => {
  try {
    const r = await odoo<{ settings: Record<string, unknown>; pages: PageIndexItem[] }>("/public/site", { revalidate: env().CONTENT_REVALIDATE_S, tags: [CACHE_TAGS.site] });
    if (!r.ok) return null;
    const settings = Object.fromEntries(SETTING_GROUPS.map((g) => {
      const parsed = (() => { try { return parseSetting(g, r.data.settings?.[g]); } catch { return parseSetting(g, {}); } })();
      return [g, parsed];
    })) as SiteSettings;
    return { settings, pages: r.data.pages ?? [] };
  } catch (e) {
    if (e instanceof OdooUnavailable) return null;
    throw e;
  }
});

export type PageResult = { status: "ok"; page: PublicPage } | { status: "missing" } | { status: "down" };

export const getPage = cache(async (slug: string): Promise<PageResult> => {
  if (!/^[a-z0-9-]+(\/[a-z0-9-]+){0,2}$/.test(slug)) return { status: "missing" };
  try {
    const r = await odoo<Record<string, unknown>>(`/public/pages/${slug}`, { revalidate: env().CONTENT_REVALIDATE_S, tags: [CACHE_TAGS.pages, CACHE_TAGS.page(slug)] });
    if (!r.ok) return r.status === 404 ? { status: "missing" } : { status: "down" };
    return { status: "ok", page: toPublicPage(r.data) };
  } catch (e) {
    if (e instanceof OdooUnavailable) return { status: "down" };
    return { status: "down" };
  }
});
