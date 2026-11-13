import Link from "next/link";
import { cn } from "./cn";

const base = "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-offset-2 disabled:opacity-60";
export const buttonStyles = {
  primary: "bg-accent-600 text-white shadow-soft hover:bg-accent-700 hover:-translate-y-0.5",
  secondary: "border border-brand-300 bg-white text-brand-800 hover:border-brand-700 hover:bg-brand-50",
  ghost: "text-brand-700 hover:bg-brand-100",
  onDark: "bg-white text-brand-900 hover:bg-brand-100",
} as const;
export type ButtonStyle = keyof typeof buttonStyles;

export function ButtonLink({ href, variant = "primary", className, children, ...rest }: { href: string; variant?: ButtonStyle; className?: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const cls = cn(base, buttonStyles[variant], className);
  const external = /^(https?:|mailto:|tel:)/i.test(href);
  return external ? <a href={href} className={cls} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>{children}</a>
    : <Link href={href || "#"} className={cls} {...rest}>{children}</Link>;
}
export function Button({ variant = "primary", className, ...p }: { variant?: ButtonStyle } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(base, buttonStyles[variant], className)} {...p} />;
}
