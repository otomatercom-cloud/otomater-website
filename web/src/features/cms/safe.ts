import { z } from "zod";

/** Allowed link targets: site paths, anchors, http(s), mailto, tel. Never javascript:/data:. */
export const safeHref = (v: string) => v === "" || /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(v.trim());
export const hrefSchema = z.string().max(500).refine(safeHref, "Unsafe or invalid link");

export const linkSchema = z.object({ label: z.string().max(80), href: hrefSchema });
export const buttonSchema = linkSchema.extend({ style: z.enum(["primary", "secondary", "ghost"]).default("primary") });
/** Reference to a Media Library record. url is derived (/media/<id>), never trusted from input. */
export const imageSchema = z.object({ media: z.number().int().positive().nullable().default(null), alt: z.string().max(200).default("") });
export const mediaUrl = (id: number | null | undefined) => (id ? `/media/${id}` : "");

/** Lucide icons the editor may offer (allowlist keeps the bundle small and input safe). */
export const ICON_NAMES = ["MessageCircle", 
  "Workflow", "Boxes", "Code2", "Megaphone", "LineChart", "ShieldCheck", "Layers", "Cog", "Database", "Cloud", "Cpu",
  "Globe", "Rocket", "Target", "Users", "Handshake", "Zap", "Search", "Mail", "Phone", "BarChart3", "Briefcase",
  "Factory", "ShoppingCart", "GraduationCap", "Stethoscope", "Truck", "Building2", "Banknote", "Sparkles", "Wrench",
  "Smartphone", "Lock", "Clock", "CheckCircle2", "Network", "FileText", "Palette", "PieChart", "Headphones",
] as const;
export const iconSchema = z.enum(ICON_NAMES).or(z.literal("")).default("");

/** Rich text = a small markdown subset (## headings, **bold**, *italic*, [links](url), - lists). Rendered by our own parser, never as raw HTML. */
export const richTextSchema = z.string().max(20000).default("");

export const VIDEO_PROVIDERS = ["youtube", "vimeo"] as const;
export const videoIdOk = (provider: string, id: string) =>
  provider === "youtube" ? /^[\w-]{6,20}$/.test(id) : provider === "vimeo" ? /^\d{5,14}$/.test(id) : false;
