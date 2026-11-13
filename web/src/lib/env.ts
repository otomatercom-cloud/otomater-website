import "server-only";
import { z } from "zod";

const schema = z.object({
  SITE_URL: z.url().default("http://localhost:3000"),
  ODOO_BASE_URL: z.url(),
  ODOO_DATABASE: z.string().min(1),
  ODOO_API_KEY: z.string().min(16),
  SESSION_SECRET: z.string().min(32),
  REVALIDATE_SECRET: z.string().min(16),
  CONTENT_REVALIDATE_S: z.coerce.number().int().min(1).default(300),
  CONTENT_TIMEOUT_MS: z.coerce.number().int().min(500).default(4000),
});
export type Env = z.infer<typeof schema>;

let cached: Env | undefined;
/** Validated server environment. Throws a readable error naming the bad variables (never their values). */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const names = [...new Set(parsed.error.issues.map((i) => i.path.join(".")))].join(", ");
    throw new Error(`Invalid or missing environment variables: ${names}. See .env.example`);
  }
  return (cached = parsed.data);
}
