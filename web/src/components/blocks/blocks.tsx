import * as Icons from "lucide-react";
import { type Block, type BlockSettings } from "@/features/cms/blocks";
import { mediaUrl, videoIdOk } from "@/features/cms/safe";
import type { PageIndexItem, SiteData } from "@/lib/content";
import { LeadForm } from "@/features/leads/lead-form";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { cn } from "@/components/ui/cn";
import { Counter } from "./counter";
import { HeroSlideshow } from "./hero-slideshow";
import { AutomationDiagram, Typewriter } from "./automation";
import { ACCENT } from "./accent";
import { RichText } from "./rich-text";

type Ctx = { site: SiteData; pageSlug: string };
type B<T extends Block["type"]> = Extract<Block, { type: T }>;

const BG: Record<BlockSettings["background"], string> = { default: "bg-white", muted: "bg-brand-50", dark: "dark-surface bg-brand-900 text-brand-100", brand: "dark-surface bg-brand-700 text-brand-50" };
const PAD: Record<BlockSettings["padding"], number> = { none: 0, sm: 0.55, md: 1, lg: 1.5 };
const HIDE = { mobile: "max-md:hidden", tablet: "md:max-lg:hidden", desktop: "lg:hidden" } as const;
const dark = (s: BlockSettings) => s.background === "dark" || s.background === "brand";
const COLS = { "2": "md:grid-cols-2", "3": "md:grid-cols-2 lg:grid-cols-3", "4": "sm:grid-cols-2 lg:grid-cols-4" } as const;

function Img({ image, className, sizes = "100vw", priority }: { image: { media: number | null; alt: string }; className?: string; sizes?: string; priority?: boolean }) {
  if (!image.media) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={mediaUrl(image.media)} alt={image.alt} sizes={sizes} loading={priority ? "eager" : "lazy"} decoding="async" className={className} />;
}
const Head = ({ heading, intro, d, center }: { heading: string; intro?: string; d: boolean; center?: boolean }) => (heading || intro) ? (
  <Reveal className={cn("mb-12 max-w-3xl", center && "mx-auto text-center")}>
    {heading && <SplitText as="h2" text={heading} data-field="heading" className={cn("text-3xl font-bold sm:text-4xl", d && "!text-white")} />}
    {intro && <p data-field="intro" className={cn("mt-4 text-lg", d ? "text-brand-200" : "text-brand-600")}>{intro}</p>}
  </Reveal>) : null;

function Icon({ name, className }: { name: string; className?: string }) {
  const C = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>>)[name];
  return C ? <C className={className} aria-hidden /> : null;
}

function Section({ block, children, flush }: { block: Block; children: React.ReactNode; flush?: boolean }) {
  const s = block.settings;
  return (
    <section data-block={block.key} id={s.anchor || undefined} className={cn(BG[s.background], s.hideOn.map((h) => HIDE[h]), "relative overflow-hidden")}
      style={flush ? undefined : { paddingBlock: `calc(var(--section-y) * ${PAD[s.padding]})` }}>
      {children}
    </section>
  );
}

function Hero({ block }: { block: B<"hero"> }) {
  const d = block.data;
  const slides = [d.image, ...d.slides.map((x) => x.image)].filter((x) => x.media).map((x) => ({ src: mediaUrl(x.media as number), alt: x.alt }));
  return (
    <section data-block={block.key} id={block.settings.anchor || undefined} className={cn("dark-surface relative overflow-hidden bg-brand-900 text-white", block.settings.hideOn.map((h) => HIDE[h]))}>
      <div aria-hidden className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(var(--color-brand-300)_1px,transparent_1px),linear-gradient(90deg,var(--color-brand-300)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_70%)]" />
      <div aria-hidden data-parallax="90" className="absolute -right-32 -top-32 h-[34rem] w-[34rem] rounded-full bg-accent-500/25 blur-[110px]" />
      <Container className={cn("relative grid items-center gap-12 py-20 sm:py-28", slides.length > 0 && "lg:grid-cols-[1.1fr_0.9fr]")}>
        <div>
          {d.eyebrow && <Reveal as="p" y={16} data-field="eyebrow" className="mb-5 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-accent-300">{d.eyebrow}</Reveal>}
          <SplitText as="h1" text={d.heading} delay={0.1} step={60} data-field="heading" className="max-w-3xl text-4xl font-extrabold leading-[1.08] !text-white sm:text-6xl" />
          {d.subheading && <Reveal as="p" delay={0.45} data-field="subheading" className="mt-6 max-w-2xl text-lg text-brand-200 sm:text-xl">{d.subheading}</Reveal>}
          {(d.primaryCta?.label || d.secondaryCta?.label) && (
            <Reveal delay={0.6} className="mt-9 flex flex-wrap gap-3">
              {d.primaryCta?.label && <ButtonLink href={d.primaryCta.href} data-field="primaryCta">{d.primaryCta.label}</ButtonLink>}
              {d.secondaryCta?.label && <ButtonLink href={d.secondaryCta.href} variant="onDark" data-field="secondaryCta">{d.secondaryCta.label}</ButtonLink>}
            </Reveal>)}
          {d.highlights.length > 0 && <Reveal as="ul" delay={0.7} y={16} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-200">{d.highlights.map((h) => <li key={h} className="flex items-center gap-2"><Icons.CheckCircle2 size={16} className="text-accent-300" aria-hidden />{h}</li>)}</Reveal>}
        </div>
        {slides.length > 1 ? <Reveal delay={0.15}><HeroSlideshow slides={slides} /></Reveal>
          : slides.length === 1 && <Reveal delay={0.15}><Img image={d.image.media ? d.image : { media: d.slides[0].image.media, alt: d.slides[0].image.alt }} priority sizes="(min-width:1024px) 45vw, 100vw" className="aspect-[4/3] w-full rounded-[var(--radius-card)] object-cover shadow-soft ring-1 ring-white/10" /></Reveal>}
      </Container>
    </section>
  );
}

function ProjectsBlock({ block, ctx }: { block: B<"projects">; ctx: Ctx }) {
  const items = ctx.site.pages.filter((p) => p.pageType === "project").slice(0, block.data.limit);
  if (!items.length) return null; // nothing published yet: render nothing rather than invented work
  const d = dark(block.settings);
  return (
    <Section block={block}><Container>
      <Head heading={block.data.heading} intro={block.data.intro} d={d} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((p: PageIndexItem, i) => (
        <Reveal key={p.id} delay={i * 0.06}>
          <a href={`/${p.slug}`} className="group block h-full overflow-hidden rounded-[var(--radius-card)] border border-brand-100 bg-white text-brand-900 shadow-soft transition hover:-translate-y-1">
            {p.cardImageMedia && <Img image={{ media: p.cardImageMedia, alt: "" }} sizes="(min-width:1024px) 33vw, 100vw" className="aspect-[16/10] w-full object-cover" />}
            <div className="p-6"><h3 className="text-xl font-bold">{p.name}</h3>{p.summary && <p className="mt-2 text-brand-600">{p.summary}</p>}
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-700">Read case study <Icons.ArrowRight size={16} className="transition group-hover:translate-x-1" aria-hidden /></span></div>
          </a></Reveal>))}</div>
    </Container></Section>
  );
}

function LeadBlock({ block, ctx }: { block: B<"lead_form">; ctx: Ctx }) {
  const d = block.data, { leads, contact } = ctx.site.settings, dk = dark(block.settings);
  return (
    <Section block={block}><Container className={cn("grid gap-12", d.showContact && "lg:grid-cols-[0.8fr_1.2fr]")}>
      {d.showContact && (
        <Reveal><h2 data-field="heading" className="text-3xl font-bold sm:text-4xl">{d.heading}</h2>{d.body && <p className="mt-4 text-lg text-brand-600">{d.body}</p>}
          <address className="mt-8 grid gap-3 text-brand-700 not-italic">
            {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-3 hover:text-accent-700"><Icons.Mail size={18} aria-hidden />{contact.email}</a>}
            {contact.phone && <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 hover:text-accent-700"><Icons.Phone size={18} aria-hidden />{contact.phone}</a>}
            {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} className="flex items-center gap-3 hover:text-accent-700" target="_blank" rel="noopener noreferrer"><Icons.MessageCircle size={18} aria-hidden />WhatsApp</a>}
            {contact.address && <p className="flex gap-3 whitespace-pre-line"><Icons.MapPin size={18} className="mt-1 shrink-0" aria-hidden />{contact.address}</p>}
            {contact.hours && <p className="flex items-center gap-3"><Icons.Clock size={18} aria-hidden />{contact.hours}</p>}
          </address>
          {contact.mapEmbedUrl && <iframe title="Location map" src={contact.mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="mt-8 h-64 w-full rounded-2xl border-0" />}
        </Reveal>)}
      <Reveal className={cn(!d.showContact && "mx-auto w-full max-w-3xl")}>
        <div className="rounded-[var(--radius-card)] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
          {!d.showContact && <><h2 data-field="heading" className="text-2xl font-bold text-brand-900">{d.heading}</h2>{d.body && <p className="mb-6 mt-2 text-brand-600">{d.body}</p>}</>}
          <div className={cn(!d.showContact && "mt-6")}><LeadForm services={leads.serviceOptions} consentText={leads.consentText} privacyHref={leads.privacyHref} submitLabel={d.submitLabel} successMessage={d.successMessage} sourcePage={`/${ctx.pageSlug === "home" ? "" : ctx.pageSlug}`} dark={dk} /></div>
        </div>
      </Reveal>
    </Container></Section>
  );
}

export function BlockView({ block, ctx }: { block: Block; ctx: Ctx }) {
  if (!block.visible) return null;
  const d = dark(block.settings);
  switch (block.type) {
    case "hero": return <Hero block={block as B<"hero">} />;
    case "richtext": { const x = (block as B<"richtext">).data; return <Section block={block}><Container className={cn("max-w-4xl", x.align === "center" && "text-center")}>
      {x.heading && <Reveal><h2 data-field="heading" className={cn("mb-6 text-3xl font-bold sm:text-4xl", d && "!text-white")}>{x.heading}</h2></Reveal>}<Reveal><RichText value={x.body} /></Reveal></Container></Section>; }
    case "image_text": { const x = (block as B<"image_text">).data; return <Section block={block}><Container className="grid items-center gap-12 lg:grid-cols-2">
      <Reveal className={x.imagePosition === "left" ? "lg:order-2" : ""}>{x.heading && <h2 data-field="heading" className={cn("mb-5 text-3xl font-bold sm:text-4xl", d && "!text-white")}>{x.heading}</h2>}<RichText value={x.body} />
        {x.cta?.label && <ButtonLink href={x.cta.href} className="mt-7" data-field="cta">{x.cta.label}</ButtonLink>}</Reveal>
      <Reveal delay={0.1}><Img image={x.image} sizes="(min-width:1024px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-[var(--radius-card)] object-cover shadow-soft" /></Reveal></Container></Section>; }
    case "cta": { const x = (block as B<"cta">).data; return <Section block={block}><Container className="text-center"><Reveal>
      <h2 data-field="heading" className={cn("mx-auto max-w-3xl text-3xl font-bold sm:text-4xl", d && "!text-white")}>{x.heading}</h2>{x.body && <p data-field="body" className="mx-auto mt-4 max-w-2xl text-lg opacity-80">{x.body}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">{x.buttons.map((b, i) => <ButtonLink key={i} href={b.href} variant={b.style}>{b.label}</ButtonLink>)}</div></Reveal></Container></Section>; }
    case "cards": { const x = (block as B<"cards">).data; if (!x.items.length) return null; return <Section block={block}><Container>
      <Head heading={x.heading} intro={x.intro} d={d} /><div className={cn("grid gap-6", COLS[x.columns])}>{x.items.map((it, i) => {
        const ac = ACCENT[it.accent];
        const inner = <>
          {x.numbered && <span aria-hidden className={cn("absolute right-6 top-5 font-display text-4xl font-bold opacity-20", ac.text)}>{String(i + 1).padStart(2, "0")}</span>}
          <div data-draw data-hover-icon className={cn("mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1", ac.tile)}><Icon name={it.icon || "Sparkles"} className="h-6 w-6" /></div>
          <h3 className="text-xl font-bold text-brand-900">{it.title}</h3>
          {it.tagline && <p className={cn("mt-1 text-xs font-semibold uppercase tracking-wide", ac.text)}>{it.tagline}</p>}
          <p className="mt-3 text-brand-600">{it.text}</p>
          {it.points.length > 0 && <ul className="mt-5 space-y-2 text-sm text-brand-800">{it.points.map((pt) => <li key={pt} className="flex items-center gap-2"><span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full", ac.dot)}><Icons.Check size={10} strokeWidth={3} aria-hidden /></span>{pt}</li>)}</ul>}
          {it.href && <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-700">Learn more <Icons.ArrowRight size={16} aria-hidden /></span>}</>;
        const cls = "relative block h-full rounded-[var(--radius-card)] border border-brand-100 bg-white p-7 shadow-soft transition-shadow hover:shadow-lg";
        return <Reveal key={i} delay={Math.min(i, 5) * 0.06}>{it.href ? <a href={it.href} className={cls} data-item={i} data-hover="lift">{inner}</a> : <div className={cls} data-item={i} data-hover="lift">{inner}</div>}</Reveal>; })}</div></Container></Section>; }
    case "automation": { const x = (block as B<"automation">).data; return (
      <section data-block={block.key} id={block.settings.anchor || undefined} className={cn("dark-surface relative overflow-hidden bg-brand-900 text-white", block.settings.hideOn.map((h) => HIDE[h]))}>
        <div aria-hidden className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(var(--color-brand-300)_1px,transparent_1px),linear-gradient(90deg,var(--color-brand-300)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_70%)]" />
        <div aria-hidden data-parallax="80" className="absolute -right-24 -top-24 h-[30rem] w-[30rem] rounded-full bg-accent-500/25 blur-[110px]" />
        <Container className={cn("relative grid items-center gap-14 py-20 sm:py-28", x.nodes.length > 0 && "lg:grid-cols-2")}>
          <div>
            {x.eyebrow && <Reveal as="p" y={16} data-field="eyebrow" className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-accent-300"><span aria-hidden className="h-2 w-2 rounded-full bg-accent-400" />{x.eyebrow}</Reveal>}
            <h2 className="max-w-3xl text-4xl font-extrabold leading-[1.08] !text-white sm:text-6xl"><span data-field="prefix">{x.prefix}</span>{x.words.length > 0 && <><br /><Typewriter words={x.words} /></>}</h2>
            {x.subheading && <Reveal as="p" delay={0.3} data-field="subheading" className="mt-6 max-w-xl text-lg text-brand-200">{x.subheading}</Reveal>}
            {(x.primaryCta?.label || x.secondaryCta?.label) && <Reveal delay={0.45} className="mt-9 flex flex-wrap gap-3">
              {x.primaryCta?.label && <ButtonLink href={x.primaryCta.href} data-field="primaryCta">{x.primaryCta.label}</ButtonLink>}
              {x.secondaryCta?.label && <ButtonLink href={x.secondaryCta.href} variant="onDark" data-field="secondaryCta">{x.secondaryCta.label}</ButtonLink>}</Reveal>}
          </div>
          {x.nodes.length > 0 && <AutomationDiagram hubLabel={x.hubLabel} hubCaption={x.hubCaption} nodes={x.nodes} />}
        </Container>
      </section>); }
    case "stats": { const x = (block as B<"stats">).data; if (!x.items.length) return null; return <Section block={block}><Container><Head heading={x.heading} d={d} center />
      <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{x.items.map((it, i) => <Reveal key={i} className="text-center"><dd className={cn("font-display text-5xl font-extrabold", d ? "text-accent-300" : "text-accent-700")}><Counter prefix={it.prefix} value={it.value} suffix={it.suffix} /></dd><dt className="mt-2 opacity-80">{it.label}</dt></Reveal>)}</dl></Container></Section>; }
    case "logos": { const x = (block as B<"logos">).data; if (!x.items.length) return null; return <Section block={block}><Container><Head heading={x.heading} d={d} center />
      <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">{x.items.map((it, i) => <li key={i}><Img image={{ media: it.image.media, alt: it.image.alt || it.name }} sizes="160px" className="h-10 w-auto max-w-40 object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0" /></li>)}</ul></Container></Section>; }
    case "testimonials": { const x = (block as B<"testimonials">).data; if (!x.items.length) return null; return <Section block={block}><Container><Head heading={x.heading} d={d} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{x.items.map((it, i) => <Reveal key={i}><figure className="h-full rounded-[var(--radius-card)] border border-brand-100 bg-white p-7 text-brand-900 shadow-soft">
        <blockquote className="text-lg leading-relaxed">“{it.quote}”</blockquote><figcaption className="mt-6 flex items-center gap-3"><Img image={it.image} sizes="48px" className="h-12 w-12 rounded-full object-cover" />
          <span><span className="block font-semibold">{it.name}</span><span className="text-sm text-brand-500">{[it.role, it.company].filter(Boolean).join(", ")}</span></span></figcaption></figure></Reveal>)}</div></Container></Section>; }
    case "projects": return <ProjectsBlock block={block as B<"projects">} ctx={ctx} />;
    case "faq": { const x = (block as B<"faq">).data; if (!x.items.length) return null; return <Section block={block}><Container className="max-w-3xl"><Head heading={x.heading} d={d} />
      <div className="divide-y divide-brand-200 rounded-[var(--radius-card)] border border-brand-100 bg-white text-brand-900">{x.items.map((it, i) => <details key={i} className="group p-6" data-item={i}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">{it.question}<Icons.ChevronDown className="shrink-0 transition group-open:rotate-180" aria-hidden /></summary>
        <RichText value={it.answer} className="mt-4 !text-base text-brand-700" /></details>)}</div></Container></Section>; }
    case "gallery": { const x = (block as B<"gallery">).data; if (!x.items.length) return null; return <Section block={block}><Container><Head heading={x.heading} d={d} />
      <div className={cn("grid gap-4", COLS[x.columns])}>{x.items.map((it, i) => <Reveal key={i}><Img image={it.image} sizes="(min-width:1024px) 33vw, 100vw" className="aspect-[4/3] w-full rounded-2xl object-cover" /></Reveal>)}</div></Container></Section>; }
    case "lead_form": return <LeadBlock block={block as B<"lead_form">} ctx={ctx} />;
    case "spacer": { const x = (block as B<"spacer">).data; return <div data-block={block.key} className={cn(BG[block.settings.background], block.settings.hideOn.map((h) => HIDE[h]))} style={{ height: { sm: 24, md: 48, lg: 96, xl: 160 }[x.size] }}>{x.divider && <Container className="flex h-full items-center"><hr className="w-full border-brand-200" /></Container>}</div>; }
    case "video": { const x = (block as B<"video">).data; if (!x.videoId || !videoIdOk(x.provider, x.videoId)) return null;
      const src = x.provider === "youtube" ? `https://www.youtube-nocookie.com/embed/${x.videoId}` : `https://player.vimeo.com/video/${x.videoId}`;
      return <Section block={block}><Container className="max-w-4xl"><Head heading={x.heading} d={d} center /><div className="aspect-video overflow-hidden rounded-[var(--radius-card)] shadow-soft">
        <iframe src={src} title={x.title || x.heading || "Video"} loading="lazy" allow="fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" className="h-full w-full border-0" /></div></Container></Section>; }
  }
}
