import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ThemeStyle } from "@/components/layout/theme-style";
import { HoverMotion } from "@/components/motion/hover-motion";
import { getSite } from "@/lib/content";

export const dynamic = "force-dynamic"; // render per request; Odoo data itself is cached/tagged (ISR + on-demand revalidation)

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();
  if (!site) return <main id="main" className="grid min-h-screen place-items-center p-8 text-center"><div><h1 className="text-2xl font-bold">We’ll be right back</h1><p className="mt-2 text-brand-600">This site is temporarily unavailable. Please try again in a few minutes.</p></div></main>;
  const { settings } = site;
  return (
    <>
      <ThemeStyle t={settings.theme} />
      <HoverMotion />
      <Header site={settings.site} nav={settings.navigation} />
      <main id="main">{children}</main>
      <Footer s={settings} />
    </>
  );
}
