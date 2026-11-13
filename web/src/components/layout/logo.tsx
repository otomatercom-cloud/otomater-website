import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/features/cms/safe";

/** The supplied Otomater mark is used unaltered (only its empty transparent margin was trimmed). A Media Library logo can override it. */
export function Logo({ name, logoMedia, dark }: { name: string; logoMedia?: number | null; dark?: boolean }) {
  const src = logoMedia ? mediaUrl(logoMedia) : "/brand/otomater-mark.png";
  return (
    <Link href="/" className="flex items-center gap-3" aria-label={`${name || "Home"} – home`}>
      <Image src={src} alt="" width={40} height={40} priority unoptimized={!!logoMedia} className={dark ? "h-10 w-10 brightness-0 invert" : "h-10 w-10"} />
      {name && <span className={`font-display text-xl font-bold tracking-tight ${dark ? "text-white" : "text-brand-700"}`}>{name}</span>}
    </Link>
  );
}
