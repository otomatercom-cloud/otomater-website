import Link from "next/link";
import type { SiteSettings } from "@/features/cms/settings";
import { Container } from "@/components/ui/container";
import { Logo } from "./logo";

export function Footer({ s }: { s: Pick<SiteSettings, "site" | "footer" | "contact" | "social"> }) {
  const { site, footer, contact, social } = s;
  return (
    <footer className="dark-surface bg-brand-900 text-brand-200">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <Logo name={site.name} logoMedia={site.logoDarkMedia ?? site.logoMedia} dark />
          {footer.blurb && <p className="mt-5 text-sm leading-relaxed text-brand-300">{footer.blurb}</p>}
          <address className="mt-5 grid gap-1 text-sm not-italic">
            {contact.email && <a className="hover:text-white" href={`mailto:${contact.email}`}>{contact.email}</a>}
            {contact.phone && <a className="hover:text-white" href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>}
            {contact.address && <span className="whitespace-pre-line">{contact.address}</span>}
          </address>
          {social.items.length > 0 && <ul className="mt-5 flex flex-wrap gap-3 text-sm">{social.items.map((i) => <li key={i.platform}><a className="capitalize underline-offset-4 hover:text-white hover:underline" href={i.url} target="_blank" rel="noopener noreferrer">{i.platform}</a></li>)}</ul>}
        </div>
        {footer.columns.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="font-display text-sm font-semibold text-white">{c.title}</h2>
            <ul className="mt-4 grid gap-2 text-sm">{c.links.map((l) => <li key={l.href + l.label}><Link className="hover:text-white" href={l.href}>{l.label}</Link></li>)}</ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-brand-300">
          <span>{footer.copyright}</span>
          <ul className="flex gap-5">{footer.legalLinks.map((l) => <li key={l.href}><Link className="hover:text-white" href={l.href}>{l.label}</Link></li>)}</ul>
        </Container>
      </div>
    </footer>
  );
}
