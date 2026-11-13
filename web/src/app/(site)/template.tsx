"use client";
import { motion, useReducedMotion } from "framer-motion";

/** Soft page transition; skipped entirely for reduced-motion users. */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return reduce ? <>{children}</> : <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>{children}</motion.div>;
}
