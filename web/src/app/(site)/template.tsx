import { SiteMotion } from "@/components/motion/site-motion";

/** Re-mounts on every navigation, which replays the page entrance. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <SiteMotion>{children}</SiteMotion>;
}
