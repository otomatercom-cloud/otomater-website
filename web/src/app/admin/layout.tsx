import type { Metadata } from "next";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-brand-50 text-brand-900">{children}</div>; }
