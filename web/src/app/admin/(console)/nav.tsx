"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Globe, Image as Img, Inbox, LogOut, Palette, Search, Users } from "lucide-react";
import type { Roles } from "@/lib/admin/session";

export function AdminNav({ name, roles }: { name: string; roles: Roles }) {
  const path = usePathname();
  const items = [
    roles.editor && { href: "/admin/pages", label: "Pages", icon: FileText },
    roles.editor && { href: "/admin/settings/site", label: "Global content", icon: Globe, match: "/admin/settings/" , not: ["theme", "seo"] },
    roles.editor && { href: "/admin/settings/theme", label: "Theme", icon: Palette },
    roles.editor && { href: "/admin/settings/seo", label: "SEO", icon: Search },
    roles.editor && { href: "/admin/media", label: "Media", icon: Img },
    roles.lead && { href: "/admin/leads", label: "Leads", icon: Inbox },
    roles.admin && { href: "/admin/users", label: "Users", icon: Users },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Globe; match?: string; not?: string[] }[];
  const active = (i: (typeof items)[number]) => i.match ? path.startsWith(i.match) && !i.not?.some((n) => path.endsWith("/" + n)) : path.startsWith(i.href);
  async function out() { await fetch("/api/admin/logout", { method: "POST" }); location.href = "/admin/login"; }
  return (
    <nav aria-label="Admin" className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-brand-100 bg-white p-4">
      <p className="mb-6 text-lg font-extrabold">Otomater <span className="text-accent-600">CMS</span></p>
      <ul className="grid gap-1">{items.map((i) => <li key={i.href}><Link href={i.href} aria-current={active(i) ? "page" : undefined} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${active(i) ? "bg-accent-600 text-white" : "text-brand-700 hover:bg-brand-50"}`}><i.icon size={16} />{i.label}</Link></li>)}</ul>
      <div className="mt-auto grid gap-2 border-t border-brand-100 pt-4 text-sm"><p className="truncate text-brand-600">{name}</p>
        <a href="/" target="_blank" rel="noopener" className="text-accent-700 hover:underline">View site ↗</a>
        <button onClick={out} className="flex items-center gap-2 text-left text-brand-700 hover:text-red-700"><LogOut size={14} />Sign out</button></div>
    </nav>
  );
}
