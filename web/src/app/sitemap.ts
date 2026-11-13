import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getSite } from "@/lib/content";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite();
  if (!site || !site.settings.seo.indexing) return [];
  const base = env().SITE_URL.replace(/\/$/, "");
  return site.pages.map((p) => ({ url: p.slug === "home" ? base + "/" : `${base}/${p.slug}`, lastModified: p.publishedAt ? new Date(p.publishedAt.replace(" ", "T") + "Z") : undefined, priority: p.slug === "home" ? 1 : 0.7 }));
}
