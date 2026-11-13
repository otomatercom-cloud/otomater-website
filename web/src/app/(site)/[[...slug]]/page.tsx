import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { getPage, getSite } from "@/lib/content";
import { mediaUrl } from "@/features/cms/safe";
import { BlockView } from "@/components/blocks/blocks";

type Props = { params: Promise<{ slug?: string[] }> };
const slugOf = (s?: string[]) => (s && s.length ? s.join("/") : "home");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = slugOf((await params).slug);
  const [r, site] = await Promise.all([getPage(slug), getSite()]);
  if (r.status !== "ok" || !site) return { robots: { index: false } };
  const p = r.page, seo = site.settings.seo;
  const name = site.settings.site.name;
  const title = p.seoTitle || (slug === "home" ? [name, site.settings.site.tagline].filter(Boolean).join(" – ") : p.name);
  const full = seo.titleTemplate && slug !== "home" ? seo.titleTemplate.replace("%s", title) : title;
  const description = p.seoDescription || p.summary || seo.defaultDescription || undefined;
  const og = p.ogImageMedia ?? seo.ogImageMedia;
  return {
    metadataBase: new URL(env().SITE_URL), title: { absolute: full }, description,
    alternates: { canonical: p.canonicalUrl || (slug === "home" ? "/" : `/${slug}`) },
    robots: { index: seo.indexing && !p.noindex, follow: true },
    openGraph: { title: full, description, siteName: name, type: "website", images: og ? [mediaUrl(og)] : undefined },
    twitter: { card: og ? "summary_large_image" : "summary", title: full, description },
    icons: site.settings.site.faviconMedia ? { icon: mediaUrl(site.settings.site.faviconMedia) } : undefined,
  };
}

export default async function Page({ params }: Props) {
  const slug = slugOf((await params).slug);
  const [r, site] = await Promise.all([getPage(slug), getSite()]);
  if (r.status === "missing") notFound();
  if (r.status === "down" || !site) return <div className="grid min-h-[50vh] place-items-center p-8 text-center"><p className="text-brand-600">This page is temporarily unavailable. Please try again shortly.</p></div>;
  const ctx = { site, pageSlug: slug };
  const blocks = r.page.blocks;
  return <>{blocks.map((b) => <BlockView key={b.key} block={b} ctx={ctx} />)}{!blocks.length && <div className="p-16 text-center text-brand-500">This page has no content yet.</div>}</>;
}
