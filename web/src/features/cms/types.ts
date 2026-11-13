import { z } from "zod";
import { type Block, parseBlocks } from "./blocks";

export const PAGE_TYPES = ["standard", "service", "industry", "project", "post", "legal"] as const;
export type PageType = (typeof PAGE_TYPES)[number];

export const pageMetaSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*){0,2}$/, "lowercase letters, numbers and dashes"),
  pageType: z.enum(PAGE_TYPES).default("standard"),
  seoTitle: z.string().max(120).default(""), seoDescription: z.string().max(300).default(""),
  canonicalUrl: z.string().max(300).default(""), ogImageMedia: z.number().int().positive().nullable().default(null),
  noindex: z.boolean().default(false), showInNav: z.boolean().default(false), sequence: z.number().int().default(10),
  summary: z.string().max(300).default(""), cardImageMedia: z.number().int().positive().nullable().default(null),
});
export type PageMeta = z.infer<typeof pageMetaSchema>;

export type PublicPage = PageMeta & { id: number; blocks: Block[]; publishedAt: string | null };
export const toPublicPage = (raw: Record<string, unknown>): PublicPage => ({
  ...(pageMetaSchema.parse({ ...raw })),
  id: Number(raw.id), blocks: parseBlocks(raw.blocks), publishedAt: (raw.publishedAt as string) ?? null,
});

export const leadInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(160),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number"),
  company: z.string().trim().max(120).default(""),
  service: z.string().trim().max(80).default(""),
  message: z.string().trim().max(3000).default(""),
  consent: z.literal(true),
  sourcePage: z.string().max(200).default(""),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
  website: z.string().max(0).optional(), // honeypot: must stay empty
  utm: z.object({ source: z.string().max(100).default(""), medium: z.string().max(100).default(""), campaign: z.string().max(100).default("") }).default({ source: "", medium: "", campaign: "" }),
});
export type LeadInput = z.infer<typeof leadInputSchema>;
