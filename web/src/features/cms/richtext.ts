import { safeHref } from "./safe";

/** Tiny markdown subset -> a plain tree. No HTML is ever produced from input; unsafe links degrade to text. */
export type Inline = { t: "text"; v: string } | { t: "b"; c: Inline[] } | { t: "i"; c: Inline[] } | { t: "a"; href: string; c: Inline[] };
export type Node = { t: "h2"; c: Inline[] } | { t: "h3"; c: Inline[] } | { t: "p"; c: Inline[] } | { t: "ul"; items: Inline[][] } | { t: "ol"; items: Inline[][] };

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /\[([^\]]{1,200})\]\(([^)\s]{1,500})\)|\*\*([^*]{1,500})\*\*|\*([^*]{1,500})\*/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: "text", v: s.slice(last, m.index) });
    if (m[1] !== undefined) out.push(safeHref(m[2]) && m[2] !== "" ? { t: "a", href: m[2], c: [{ t: "text", v: m[1] }] } : { t: "text", v: m[1] });
    else if (m[3] !== undefined) out.push({ t: "b", c: parseInline(m[3]) });
    else out.push({ t: "i", c: parseInline(m[4]) });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: "text", v: s.slice(last) });
  return out;
}

export function parseRichText(src: string): Node[] {
  const nodes: Node[] = [];
  for (const block of src.replace(/\r/g, "").split(/\n{2,}/)) {
    const lines = block.split("\n").filter((l) => l.trim());
    if (!lines.length) continue;
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) nodes.push({ t: "ul", items: lines.map((l) => parseInline(l.replace(/^\s*[-*]\s+/, ""))) });
    else if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) nodes.push({ t: "ol", items: lines.map((l) => parseInline(l.replace(/^\s*\d+\.\s+/, ""))) });
    else if (/^###\s/.test(lines[0])) nodes.push({ t: "h3", c: parseInline(lines[0].replace(/^###\s+/, "")) });
    else if (/^##?\s/.test(lines[0])) nodes.push({ t: "h2", c: parseInline(lines[0].replace(/^##?\s+/, "")) });
    else nodes.push({ t: "p", c: parseInline(lines.join(" ")) });
  }
  return nodes;
}
