"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import type { SiteSettings } from "@/features/cms/settings";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "./logo";

export function Header({ site, nav }: { site: SiteSettings["site"]; nav: SiteSettings["navigation"] }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname();
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className={`sticky top-0 z-40 transition-all ${scrolled ? "bg-white/85 shadow-[0_1px_0_rgb(20_30_41/0.08)] backdrop-blur-xl" : "bg-white"}`}>
      <Container className="flex h-[72px] items-center justify-between gap-6">
        <Logo name={site.name} logoMedia={site.logoMedia} />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {nav.items.map((i) => i.children.length ? (
            <div key={i.label} className="group relative">
              <Link href={i.href || "#"} className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100">{i.label}<ChevronDown size={14} aria-hidden /></Link>
              <div className="invisible absolute left-0 top-full w-64 translate-y-1 rounded-2xl border border-brand-100 bg-white p-2 opacity-0 shadow-soft transition-all group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                {i.children.map((c) => <Link key={c.href + c.label} href={c.href} className="block rounded-xl px-3 py-2 text-sm text-brand-700 hover:bg-brand-50">{c.label}</Link>)}
              </div>
            </div>
          ) : <Link key={i.label} href={i.href || "#"} aria-current={path === i.href ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-medium hover:bg-brand-100 ${path === i.href ? "text-accent-700" : "text-brand-700"}`}>{i.label}</Link>)}
        </nav>
        <div className="hidden lg:block">{site.headerCta && <ButtonLink href={site.headerCta.href}>{site.headerCta.label}</ButtonLink>}</div>
        <button className="rounded-full p-2 text-brand-800 hover:bg-brand-100 lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((v) => !v)}>
          {open ? <X /> : <Menu />}
        </button>
      </Container>
      {open && (
        <div id="mobile-nav" className="fixed inset-x-0 top-[72px] bottom-0 overflow-y-auto bg-white p-5 lg:hidden">
          <nav aria-label="Mobile" className="grid gap-1">
            {nav.items.map((i) => (
              <div key={i.label}>
                <Link href={i.href || "#"} className="block rounded-xl px-4 py-3 text-lg font-semibold text-brand-800 hover:bg-brand-50">{i.label}</Link>
                {i.children.map((c) => <Link key={c.href + c.label} href={c.href} className="block rounded-xl py-2 pl-8 pr-4 text-brand-600 hover:bg-brand-50">{c.label}</Link>)}
              </div>
            ))}
            {site.headerCta && <ButtonLink href={site.headerCta.href} className="mt-4">{site.headerCta.label}</ButtonLink>}
          </nav>
        </div>
      )}
    </header>
  );
}
