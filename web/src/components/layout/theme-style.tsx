import type { SiteSettings } from "@/features/cms/settings";

const mix = (hex: string, to: number, amt: number) => {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (to - v) * amt));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
};
const RADIUS = { sharp: "0.375rem", soft: "1.25rem", round: "2rem" };
const SPACING = { compact: "4rem", comfortable: "6rem", spacious: "8rem" };

/** Admin > Theme -> CSS variables. Only validated hex colours and enum presets are ever emitted (no arbitrary CSS). */
export function ThemeStyle({ t }: { t: SiteSettings["theme"] }) {
  const css = `:root{--color-brand-700:${t.brand};--color-brand-800:${mix(t.brand, 0, 0.25)};--color-brand-900:${mix(t.brand, 0, 0.5)};--color-brand-600:${mix(t.brand, 255, 0.15)};--color-brand-500:${mix(t.brand, 255, 0.3)};--color-accent-600:${t.accent};--color-accent-700:${mix(t.accent, 0, 0.22)};--color-accent-500:${mix(t.accent, 255, 0.12)};--color-accent-300:${mix(t.accent, 255, 0.55)};--radius-card:${RADIUS[t.radius]};--section-y:${SPACING[t.spacing]}}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
