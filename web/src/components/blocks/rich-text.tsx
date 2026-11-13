import Link from "next/link";
import { type Inline, parseRichText } from "@/features/cms/richtext";

function Inl({ nodes }: { nodes: Inline[] }) {
  return <>{nodes.map((n, i) => n.t === "text" ? n.v : n.t === "b" ? <strong key={i}><Inl nodes={n.c} /></strong> : n.t === "i" ? <em key={i}><Inl nodes={n.c} /></em> :
    /^https?:/i.test(n.href) ? <a key={i} href={n.href} target="_blank" rel="noopener noreferrer" className="font-medium text-accent-700 underline underline-offset-4"><Inl nodes={n.c} /></a>
      : /^(mailto|tel):/i.test(n.href) ? <a key={i} href={n.href} className="font-medium text-accent-700 underline underline-offset-4"><Inl nodes={n.c} /></a>
      : <Link key={i} href={n.href} className="font-medium text-accent-700 underline underline-offset-4"><Inl nodes={n.c} /></Link>)}</>;
}

export function RichText({ value, className = "" }: { value: string; className?: string }) {
  return (
    <div className={`space-y-4 text-lg leading-relaxed ${className}`} data-field="body">
      {parseRichText(value).map((n, i) => n.t === "h2" ? <h3 key={i} className="pt-2 text-2xl font-bold"><Inl nodes={n.c} /></h3>
        : n.t === "h3" ? <h4 key={i} className="pt-1 text-xl font-semibold"><Inl nodes={n.c} /></h4>
        : n.t === "ul" ? <ul key={i} className="list-disc space-y-1.5 pl-6">{n.items.map((it, j) => <li key={j}><Inl nodes={it} /></li>)}</ul>
        : n.t === "ol" ? <ol key={i} className="list-decimal space-y-1.5 pl-6">{n.items.map((it, j) => <li key={j}><Inl nodes={it} /></li>)}</ol>
        : <p key={i}><Inl nodes={n.c} /></p>)}
    </div>
  );
}
