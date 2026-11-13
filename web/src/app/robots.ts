import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getSite } from "@/lib/content";

export const dynamic = "force-dynamic";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite();
  const base = env().SITE_URL.replace(/\/$/, "");
  if (site && !site.settings.seo.indexing) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/preview"] }, sitemap: `${base}/sitemap.xml` };
}
