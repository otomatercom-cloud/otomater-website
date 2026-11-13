import "server-only";
const hits = new Map<string, { n: number; t: number }>();

/** Small in-memory fixed-window limiter (per Node process). Odoo enforces its own limits as the second layer. */
export function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.t > windowMs) hits.delete(k);
  const h = hits.get(key);
  if (!h || now - h.t > windowMs) { hits.set(key, { n: 1, t: now }); return false; }
  h.n++;
  return h.n > max;
}
