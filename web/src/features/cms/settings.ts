import { z } from "zod";
import { hrefSchema, linkSchema } from "./safe";

const t = (max = 200) => z.string().max(max).default("");
const media = z.number().int().positive().nullable().default(null);

export const SETTING_GROUPS = ["site", "navigation", "footer", "contact", "social", "theme", "seo", "leads"] as const;
export type SettingGroup = (typeof SETTING_GROUPS)[number];

const navItem = z.object({ label: t(60), href: hrefSchema.default(""), children: z.array(linkSchema).max(12).default([]) });
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const settingSchemas = {
  site: z.object({ name: t(80), tagline: t(160), logoMedia: media, logoDarkMedia: media, faviconMedia: media, headerCta: linkSchema.nullable().default(null) }),
  navigation: z.object({ items: z.array(navItem).max(10).default([]) }),
  footer: z.object({
    blurb: t(300), copyright: t(160),
    columns: z.array(z.object({ title: t(60), links: z.array(linkSchema).max(10).default([]) })).max(4).default([]),
    legalLinks: z.array(linkSchema).max(6).default([]),
  }),
  contact: z.object({ email: t(120), phone: t(40), whatsapp: t(40), address: t(300), hours: t(120), mapEmbedUrl: z.string().max(500).refine((v) => v === "" || /^https:\/\/(www\.)?google\.com\/maps\/embed/.test(v), "Only Google Maps embed URLs").default("") }),
  social: z.object({ items: z.array(z.object({ platform: z.enum(["linkedin", "facebook", "instagram", "x", "youtube", "whatsapp"]), url: hrefSchema })).max(8).default([]) }),
  theme: z.object({
    brand: hex.default("#283a4b"), accent: hex.default("#19a595"),
    fontHeading: z.enum(["sora", "inter"]).default("sora"), fontBody: z.enum(["inter"]).default("inter"),
    radius: z.enum(["sharp", "soft", "round"]).default("soft"), buttonStyle: z.enum(["solid", "outline"]).default("solid"),
    spacing: z.enum(["compact", "comfortable", "spacious"]).default("comfortable"),
  }),
  seo: z.object({ titleTemplate: t(120), defaultDescription: t(300), ogImageMedia: media, indexing: z.boolean().default(true) }),
  // `notificationEmails` is stripped by Odoo from the public API; only admins ever see it.
  leads: z.object({ serviceOptions: z.array(z.string().max(80)).max(20).default([]), consentText: t(300), privacyHref: hrefSchema.default(""), notificationEmails: z.array(z.string().email()).max(10).default([]) }),
} satisfies Record<SettingGroup, z.ZodType>;

export type SiteSettings = { [K in SettingGroup]: z.infer<(typeof settingSchemas)[K]> };
export const parseSetting = <G extends SettingGroup>(g: G, raw: unknown): SiteSettings[G] => settingSchemas[g].parse(raw ?? {}) as SiteSettings[G];
