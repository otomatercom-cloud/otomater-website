import { z } from "zod";
import { buttonSchema, hrefSchema, iconSchema, imageSchema, linkSchema, richTextSchema, videoIdOk, VIDEO_PROVIDERS } from "./safe";

const t = (max = 200) => z.string().max(max).default("");
const item = <T extends z.ZodRawShape>(shape: T, max = 24) => z.array(z.object(shape)).max(max).default([]);

export const BLOCK_TYPES = [
  "hero", "richtext", "image_text", "cta", "cards", "stats", "logos", "testimonials",
  "projects", "faq", "gallery", "lead_form", "spacer", "video",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const blockData = {
  hero: z.object({
    eyebrow: t(80), heading: t(160), subheading: t(400),
    primaryCta: linkSchema.nullable().default(null), secondaryCta: linkSchema.nullable().default(null),
    image: imageSchema.default({ media: null, alt: "" }), highlights: z.array(z.string().max(80)).max(6).default([]),
  }),
  richtext: z.object({ heading: t(160), body: richTextSchema, align: z.enum(["left", "center"]).default("left") }),
  image_text: z.object({
    heading: t(160), body: richTextSchema, image: imageSchema.default({ media: null, alt: "" }),
    imagePosition: z.enum(["left", "right"]).default("right"), cta: linkSchema.nullable().default(null),
  }),
  cta: z.object({ heading: t(160), body: t(400), buttons: z.array(buttonSchema).max(3).default([]) }),
  cards: z.object({
    heading: t(160), intro: t(400), columns: z.enum(["2", "3", "4"]).default("3"),
    items: item({ icon: iconSchema, title: t(100), text: t(500), href: hrefSchema.default("") }),
  }),
  stats: z.object({
    heading: t(160),
    items: item({ prefix: t(8), value: z.string().max(12).regex(/^\d*\.?\d*$/).default(""), suffix: t(8), label: t(80) }, 8),
  }),
  logos: z.object({ heading: t(160), items: item({ name: t(80), image: imageSchema.default({ media: null, alt: "" }) }, 20) }),
  testimonials: z.object({
    heading: t(160),
    items: item({ quote: t(600), name: t(80), role: t(80), company: t(80), image: imageSchema.default({ media: null, alt: "" }) }, 12),
  }),
  projects: z.object({ heading: t(160), intro: t(400), limit: z.number().int().min(1).max(12).default(3) }),
  faq: z.object({ heading: t(160), items: item({ question: t(200), answer: richTextSchema }, 30) }),
  gallery: z.object({ heading: t(160), columns: z.enum(["2", "3", "4"]).default("3"), items: item({ image: imageSchema.default({ media: null, alt: "" }) }, 30) }),
  lead_form: z.object({ heading: t(160), body: t(400), submitLabel: t(40), successMessage: t(300), showContact: z.boolean().default(false) }),
  spacer: z.object({ size: z.enum(["sm", "md", "lg", "xl"]).default("md"), divider: z.boolean().default(false) }),
  video: z
    .object({ heading: t(160), provider: z.enum(VIDEO_PROVIDERS).default("youtube"), videoId: t(20), title: t(120) })
    .refine((v) => v.videoId === "" || videoIdOk(v.provider, v.videoId), "Invalid video id"),
} satisfies Record<BlockType, z.ZodType>;

export const blockSettings = z.object({
  background: z.enum(["default", "muted", "dark", "brand"]).default("default"),
  padding: z.enum(["none", "sm", "md", "lg"]).default("md"),
  hideOn: z.array(z.enum(["mobile", "tablet", "desktop"])).max(3).default([]),
  anchor: z.string().max(40).regex(/^[a-z0-9-]*$/).default(""),
});
export type BlockSettings = z.infer<typeof blockSettings>;

const keySchema = z.string().regex(/^[a-z0-9_-]{4,40}$/);
/** A block as stored/transported. `data` is validated against the schema for `type` (see parseBlock). */
export const blockEnvelope = z.object({
  key: keySchema, type: z.enum(BLOCK_TYPES), visible: z.boolean().default(true),
  settings: blockSettings.default(blockSettings.parse({})), data: z.record(z.string(), z.unknown()),
});

export type BlockOf<T extends BlockType> = {
  key: string; type: T; visible: boolean; settings: BlockSettings; data: z.infer<(typeof blockData)[T]>;
};

/** Discriminated union: narrowing on `type` gives the exact `data` shape. */
export type Block = { [K in BlockType]: BlockOf<K> }[BlockType];

/** Validate one block; returns null when invalid so a bad block can never break a public page. */
export function parseBlock(raw: unknown): Block | null {
  const env = blockEnvelope.safeParse(raw);
  if (!env.success) return null;
  const data = blockData[env.data.type].safeParse(env.data.data);
  if (!data.success) return null;
  return { ...env.data, data: data.data } as Block;
}
export const parseBlocks = (raw: unknown): Block[] => (Array.isArray(raw) ? raw.map(parseBlock).filter((b): b is Block => !!b) : []);

export function blankBlock(type: BlockType, key: string): Block {
  return { key, type, visible: true, settings: blockSettings.parse({}), data: blockData[type].parse({}) } as Block;
}
export const newKey = () => `b_${Math.random().toString(36).slice(2, 10)}`;

export const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero / banner", richtext: "Heading & text", image_text: "Image with text", cta: "Call to action",
  cards: "Service / feature cards", stats: "Statistics", logos: "Logo strip", testimonials: "Testimonials",
  projects: "Case-study cards", faq: "FAQ", gallery: "Gallery", lead_form: "Enquiry form", spacer: "Spacer / divider", video: "Video",
};
