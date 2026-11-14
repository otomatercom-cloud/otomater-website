import { type BlockType, BLOCK_LABELS, blankBlock, type Block } from "./blocks";
import { ICON_NAMES } from "./safe";
import type { SettingGroup } from "./settings";

type Base = { name: string; label: string; hint?: string };
export type FieldDef =
  | (Base & { kind: "text" | "textarea" | "rich"; max?: number })
  | (Base & { kind: "number"; min?: number; max?: number })
  | (Base & { kind: "bool" })
  | (Base & { kind: "color" })
  | (Base & { kind: "select"; options: [string, string][] })
  | (Base & { kind: "multi"; options: [string, string][] })
  | (Base & { kind: "image" })   // {media, alt}
  | (Base & { kind: "media" })   // plain media id (settings)
  | (Base & { kind: "link"; withStyle?: boolean }) // nullable {label, href[, style]}
  | (Base & { kind: "strings"; max: number })
  | (Base & { kind: "list"; itemLabel: string; titleKey: string; fields: FieldDef[]; max: number; blank: Record<string, unknown> });

const t = (name: string, label: string, max = 200, hint?: string): FieldDef => ({ name, label, kind: "text", max, hint });
const area = (name: string, label: string, max = 400): FieldDef => ({ name, label, kind: "textarea", max });
const rich = (name: string, label: string): FieldDef => ({ name, label, kind: "rich", hint: "Formatting: ## heading, **bold**, *italic*, [text](link), - list" });
const img = (name = "image", label = "Image"): FieldDef => ({ name, label, kind: "image" });
const link = (name: string, label: string, withStyle = false): FieldDef => ({ name, label, kind: "link", withStyle });
const cols: FieldDef = { name: "columns", label: "Columns", kind: "select", options: [["2", "2"], ["3", "3"], ["4", "4"]] };
const ICONS: [string, string][] = [["", "None"], ...ICON_NAMES.map((n) => [n, n] as [string, string])];

export const BLOCK_FIELDS: Record<BlockType, FieldDef[]> = {
  hero: [t("eyebrow", "Small label above heading", 80), t("heading", "Heading", 160), area("subheading", "Sub-heading"), link("primaryCta", "Primary button"), link("secondaryCta", "Secondary button"), img(), { name: "slides", label: "More slides (optional - turns the picture into a slideshow)", kind: "list", itemLabel: "Slide", titleKey: "image.alt", max: 5, blank: { image: { media: null, alt: "" } }, fields: [img()] }, { name: "highlights", label: "Highlight points", kind: "strings", max: 6 }],
  richtext: [t("heading", "Heading", 160), rich("body", "Text"), { name: "align", label: "Alignment", kind: "select", options: [["left", "Left"], ["center", "Centre"]] }],
  image_text: [t("heading", "Heading", 160), rich("body", "Text"), img(), { name: "imagePosition", label: "Image position", kind: "select", options: [["right", "Right"], ["left", "Left"]] }, link("cta", "Button")],
  cta: [t("heading", "Heading", 160), area("body", "Text"), { name: "buttons", label: "Buttons", kind: "list", itemLabel: "Button", titleKey: "label", max: 3, blank: { label: "Button", href: "/contact", style: "primary" },
    fields: [t("label", "Label", 80), t("href", "Link", 500), { name: "style", label: "Style", kind: "select", options: [["primary", "Primary"], ["secondary", "Secondary"], ["ghost", "Ghost"]] }] }],
  cards: [t("heading", "Heading", 160), area("intro", "Intro"), cols, { name: "numbered", label: "Show 01 / 02 numbers", kind: "bool" }, { name: "items", label: "Cards", kind: "list", itemLabel: "Card", titleKey: "title", max: 24, blank: { icon: "Sparkles", title: "Card title", text: "", href: "", tagline: "", accent: "default", points: [] },
    fields: [{ name: "icon", label: "Icon", kind: "select", options: ICONS }, t("title", "Title", 100), t("tagline", "Short tagline (optional)", 80), area("text", "Text", 500), { name: "points", label: "Bullet points (optional)", kind: "strings", max: 6 }, { name: "accent", label: "Colour", kind: "select", options: [["default", "Brand"], ["blue", "Blue"], ["cyan", "Cyan"], ["green", "Green"], ["amber", "Amber"]] }, t("href", "Link (optional)", 500)] }],
  automation_demo: [t("heading", "Heading", 160), area("intro", "Intro"), t("submitLabel", "Button text", 40), area("whatsappText", "Sample WhatsApp message (use {name} for the visitor's first name)", 300), { name: "steps", label: "Steps (4)", kind: "list", itemLabel: "Step", titleKey: "label", max: 4, blank: { label: "Step", caption: "" }, fields: [t("label", "Title", 40), t("caption", "Description", 160)] }],
  automation: [t("eyebrow", "Small label", 80), t("prefix", "Heading start (e.g. Automate Your)", 80), { name: "words", label: "Rotating words (typed one by one)", kind: "strings", max: 8 }, area("subheading", "Sub-heading"), link("primaryCta", "Primary button"), link("secondaryCta", "Secondary button"), t("hubLabel", "Centre tile big text (e.g. 360°)", 20), t("hubCaption", "Centre tile small text", 24), { name: "nodes", label: "Diagram cards (max 4) - use real numbers only", kind: "list", itemLabel: "Card", titleKey: "label", max: 4, blank: { label: "CRM", value: "", caption: "", accent: "blue" }, fields: [t("label", "Short label (e.g. CRM)", 10), t("value", "Number (optional)", 12), t("caption", "Caption (e.g. contacts)", 24), { name: "accent", label: "Colour", kind: "select", options: [["default", "Brand"], ["blue", "Blue"], ["cyan", "Cyan"], ["green", "Green"], ["amber", "Amber"]] }] }],
  stats: [t("heading", "Heading", 160), { name: "items", label: "Numbers (use real values only)", kind: "list", itemLabel: "Number", titleKey: "label", max: 8, blank: { prefix: "", value: "", suffix: "", label: "Label" },
    fields: [t("prefix", "Prefix", 8), t("value", "Value (digits only)", 12), t("suffix", "Suffix (e.g. +, %)", 8), t("label", "Label", 80)] }],
  logos: [t("heading", "Heading", 160), { name: "items", label: "Logos", kind: "list", itemLabel: "Logo", titleKey: "name", max: 20, blank: { name: "Partner", image: { media: null, alt: "" } }, fields: [t("name", "Name", 80), img()] }],
  testimonials: [t("heading", "Heading", 160), { name: "items", label: "Testimonials (real ones only)", kind: "list", itemLabel: "Testimonial", titleKey: "name", max: 12, blank: { quote: "", name: "Name", role: "", company: "", image: { media: null, alt: "" } },
    fields: [area("quote", "Quote", 600), t("name", "Name", 80), t("role", "Role", 80), t("company", "Company", 80), img("image", "Photo")] }],
  projects: [t("heading", "Heading", 160), area("intro", "Intro"), { name: "limit", label: "How many to show", kind: "number", min: 1, max: 12, hint: "Shows published pages of type Project" }],
  faq: [t("heading", "Heading", 160), { name: "items", label: "Questions", kind: "list", itemLabel: "Question", titleKey: "question", max: 30, blank: { question: "Question", answer: "" }, fields: [t("question", "Question", 200), rich("answer", "Answer")] }],
  gallery: [t("heading", "Heading", 160), cols, { name: "items", label: "Images", kind: "list", itemLabel: "Image", titleKey: "image.alt", max: 30, blank: { image: { media: null, alt: "" } }, fields: [img()] }],
  lead_form: [t("heading", "Heading", 160), area("body", "Text"), t("submitLabel", "Button label", 40), area("successMessage", "Success message", 300), { name: "showContact", label: "Show company contact details beside the form", kind: "bool" }],
  spacer: [{ name: "size", label: "Height", kind: "select", options: [["sm", "Small"], ["md", "Medium"], ["lg", "Large"], ["xl", "Extra large"]] }, { name: "divider", label: "Show a divider line", kind: "bool" }],
  video: [t("heading", "Heading", 160), { name: "provider", label: "Provider", kind: "select", options: [["youtube", "YouTube"], ["vimeo", "Vimeo"]] }, t("videoId", "Video ID", 20, "Only the ID, e.g. dQw4w9WgXcQ (YouTube) or 123456789 (Vimeo)"), t("title", "Accessible title", 120)],
};

export const STYLE_FIELDS: FieldDef[] = [
  { name: "background", label: "Background", kind: "select", options: [["default", "White"], ["muted", "Soft grey"], ["dark", "Dark"], ["brand", "Brand colour"]] },
  { name: "padding", label: "Vertical spacing", kind: "select", options: [["none", "None"], ["sm", "Small"], ["md", "Normal"], ["lg", "Large"]] },
  { name: "hideOn", label: "Hide on", kind: "multi", options: [["mobile", "Mobile"], ["tablet", "Tablet"], ["desktop", "Desktop"]] },
  { name: "anchor", label: "Anchor id (for #links)", kind: "text", max: 40 },
];

const lk = (): FieldDef[] => [t("label", "Label", 80), t("href", "Link", 500)];
export const SETTING_FIELDS: Record<SettingGroup, FieldDef[]> = {
  site: [t("name", "Site name", 80), t("tagline", "Tagline", 160), { name: "logoMedia", label: "Logo override (leave empty to use the Otomater logo)", kind: "media" }, { name: "logoDarkMedia", label: "Logo for dark footer (optional)", kind: "media" }, { name: "faviconMedia", label: "Favicon", kind: "media" }, link("headerCta", "Header button")],
  navigation: [{ name: "items", label: "Menu", kind: "list", itemLabel: "Menu item", titleKey: "label", max: 10, blank: { label: "New item", href: "/", children: [] },
    fields: [t("label", "Label", 60), t("href", "Link (leave empty for a dropdown only)", 500), { name: "children", label: "Dropdown links", kind: "list", itemLabel: "Link", titleKey: "label", max: 12, blank: { label: "Link", href: "/" }, fields: lk() }] }],
  footer: [area("blurb", "Short company text", 300), t("copyright", "Copyright line", 160),
    { name: "columns", label: "Link columns", kind: "list", itemLabel: "Column", titleKey: "title", max: 4, blank: { title: "Column", links: [] }, fields: [t("title", "Title", 60), { name: "links", label: "Links", kind: "list", itemLabel: "Link", titleKey: "label", max: 10, blank: { label: "Link", href: "/" }, fields: lk() }] },
    { name: "legalLinks", label: "Legal links", kind: "list", itemLabel: "Link", titleKey: "label", max: 6, blank: { label: "Link", href: "/" }, fields: lk() }],
  contact: [t("email", "Email", 120), t("phone", "Phone", 40), t("whatsapp", "WhatsApp number (with country code)", 40), area("address", "Address", 300), t("hours", "Opening hours", 120), t("mapEmbedUrl", "Google Maps embed URL", 500, "Maps > Share > Embed a map > copy the src URL")],
  social: [{ name: "items", label: "Social links", kind: "list", itemLabel: "Link", titleKey: "platform", max: 8, blank: { platform: "linkedin", url: "https://" },
    fields: [{ name: "platform", label: "Network", kind: "select", options: ["linkedin", "facebook", "instagram", "x", "youtube", "whatsapp"].map((x) => [x, x]) }, t("url", "URL", 500)] }],
  theme: [{ name: "brand", label: "Brand colour (headings, dark sections)", kind: "color" }, { name: "accent", label: "Accent colour (buttons, highlights)", kind: "color", hint: "Keep enough contrast with white text" },
    { name: "fontHeading", label: "Heading font", kind: "select", options: [["sora", "Sora"], ["inter", "Inter"]] }, { name: "radius", label: "Corner style", kind: "select", options: [["sharp", "Sharp"], ["soft", "Soft"], ["round", "Round"]] },
    { name: "spacing", label: "Section spacing", kind: "select", options: [["compact", "Compact"], ["comfortable", "Comfortable"], ["spacious", "Spacious"]] }],
  seo: [t("titleTemplate", "Title template", 120, "Use %s for the page title, e.g. %s | Otomater"), area("defaultDescription", "Default description", 300), { name: "ogImageMedia", label: "Default social share image", kind: "media" }, { name: "indexing", label: "Allow search engines to index the site", kind: "bool" }],
  leads: [{ name: "serviceOptions", label: "Service options in the enquiry form", kind: "strings", max: 20 }, area("consentText", "Consent checkbox text", 300), t("privacyHref", "Privacy policy link", 500),
    { name: "notificationEmails", label: "Email new enquiries to (private, never public)", kind: "strings", max: 10 }],
};
export const SETTING_TITLES: Record<SettingGroup, string> = { site: "Site & header", navigation: "Navigation", footer: "Footer", contact: "Contact details", social: "Social links", theme: "Theme & design", seo: "SEO defaults", leads: "Enquiry form" };

/** Starter content when an editor adds a block (clearly generic, replaced by the editor). */
export function starterBlock(type: BlockType, key: string): Block {
  const b = blankBlock(type, key);
  const d = b.data as Record<string, unknown>;
  const set = (o: Record<string, unknown>) => Object.assign(d, o);
  switch (type) {
    case "automation_demo": set({ heading: "Try the automation", submitLabel: "Try it", steps: [{ label: "Enquiry captured", caption: "" }, { label: "WhatsApp reply", caption: "" }, { label: "CRM lead", caption: "" }, { label: "ERP order", caption: "" }] }); break;
    case "automation": set({ prefix: "Automate Your", words: ["Business"], subheading: "Edit this sub-heading." }); break;
    case "hero": set({ heading: "Edit this heading", subheading: "Edit this sub-heading." }); break;
    case "richtext": set({ heading: "Edit this heading", body: "Edit this text." }); break;
    case "image_text": set({ heading: "Edit this heading", body: "Edit this text." }); break;
    case "cta": set({ heading: "Edit this heading", buttons: [{ label: "Contact us", href: "/contact", style: "primary" }] }); break;
    case "cards": set({ heading: "Edit this heading", items: [1, 2, 3].map((i) => ({ icon: "Sparkles", title: `Card ${i}`, text: "Edit this text.", href: "" })) }); break;
    case "faq": set({ heading: "Frequently asked questions", items: [{ question: "Question", answer: "Answer" }] }); break;
    case "lead_form": set({ heading: "Send an enquiry", submitLabel: "Send enquiry", successMessage: "Thank you. We will contact you soon." }); break;
    case "projects": set({ heading: "Case studies" }); break;
    case "stats": case "logos": case "testimonials": case "gallery": case "video": set({ heading: "Edit this heading" }); break;
  }
  return b;
}
export { BLOCK_LABELS };
