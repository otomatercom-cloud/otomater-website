# Otomater website – working notes

Next.js 16 (App Router, TS, Tailwind 4, Framer Motion) frontend + one Odoo 19 addon `odoo/otomater_website` (depends on `base` only).
Flow: Browser → Next.js server/API (BFF) → Odoo addon → PostgreSQL. The browser never talks to Odoo.

## Commands
- web: `cd web && npm i && npm run typecheck && npm test && npm run build`
- odoo test: `odoo-bin -d <db> -u otomater_website --test-enable --test-tags /otomater_website --addons-path=...,<repo>/odoo`

## Architecture decisions (keep short, add as we go)
- Models use the Otomater convention `otm.website.*` (page, block, setting, media, lead, throttle) instead of the scope's suggested `otomater.website.*`; license OPL-1.
- **Draft/publish**: blocks are the editable draft rows. Publishing freezes the whole page (meta + blocks) into `page.published_json`; public API reads only that snapshot, so drafts cannot leak into public cache. Settings use `draft_json` / `published_json` the same way.
- Layout is saved atomically with `PUT /admin/pages/<id> {blocks:[…]}` (create/reorder/duplicate/delete are client-side list operations); block keys are stable ids.
- Block schemas live in `web/src/features/cms/blocks.ts` (zod). Odoo validates type allowlist, key format, JSON object + size; Next validates fields and drops invalid blocks on read.
- Rich text is a markdown subset rendered by our own parser (no raw HTML anywhere).
- Home page slug is `home` (served at `/`). Slugs may nest up to 3 segments (`projects/acme`).
- Next ↔ Odoo auth: shared `otomater_website.api_key` (Bearer) on every call + signed 8 h admin token (`X-Admin-Token`, dies on logout/password change/deactivation). Next keeps the token in an HttpOnly SameSite=Strict cookie. Odoo re-checks the group on every admin call.
- Media: stored via `ir.attachment` (Binary attachment=True), served only through Odoo→Next `/media/<id>`; raster images only (no SVG); content-sniffed.
- Leads: idempotency key, honeypot, per-IP rate limit (5 / 10 min) in `otm.website.throttle`, notification mail sent after commit (never loses the lead). Notification recipients are Odoo-only (stripped from the public API).
- Logo: supplied PNG kept as `public/brand/otomater-logo-original.png`; `otomater-mark.png` is the same artwork with only the empty transparent margin trimmed. Brand ink `#283a4b` sampled from it.

## Phases
- [x] 0 inspect/plan  [x] 1 foundation  [x] 2 Odoo addon (17 tests pass on real Odoo 19)
- [x] 3 public site (e2e verified against real Odoo 19)  [x] 4 visual editor  [x] 5 lead UI/admin  [ ] 6 verification + docs

- Public pages: `app/(site)/[[...slug]]`, `force-dynamic` render; Odoo data cached via fetch `revalidate` + tags (`otomater:site|pages|page:<slug>`), cleared by `POST /api/revalidate` (Bearer REVALIDATE_SECRET) or by Odoo after publish. Odoo down => cached data keeps serving; uncached page shows a controlled "temporarily unavailable" message (noindex), no invented copy. Empty blocks (stats/logos/testimonials/projects with no data) render nothing.
- Blocks render on the server (`components/blocks/blocks.tsx`); only counter, lead form, header, reveal are client components. Sections carry `data-block=<key>`, editable texts `data-field=<name>` for the Phase 4 click-to-edit preview.
- Lead API `/api/leads`: same-origin check, in-memory rate limit, honeypot (fake ok), zod, forwards client IP to Odoo.

## Known issues / todo
- Uncached page while Odoo is down returns HTTP 200 with the fallback text (not 503); revisit if it matters for SEO.
- Next admin login rate-limit (in-memory) comes with Phase 4; Odoo-side limit already exists.

## Phase 4 notes (visual editor)
- Admin lives in Next: `/admin/login`, `(console)` shell (Pages, Global, Theme, SEO, Media, Users), full-screen builder at `/admin/edit/<id>`. All calls go browser → `/api/admin/*` proxy (HttpOnly cookie, per-method allowlist, origin check) → Odoo.
- Builder: sortable sections (dnd-kit, keyboard works), schema-driven forms from `features/cms/editor-fields.ts`, iframe `/preview` fed by postMessage (same-origin only); clicking text/section in preview opens its field. Undo/redo coalesces typing (800 ms). Save draft / Publish / Unpublish are explicit; beforeunload guards unsaved work; zod + `parseBlock` run before save.
- **Next 16 cache gotcha**: `revalidateTag(tag, "max")` is stale-while-revalidate and a 404 refetch is never cached, so unpublish/delete kept serving the old page. Use `revalidateTag(tag, { expire: 0 })` after admin actions. Also `pkill -f next-server` (not "next start") before restarting a prod server.
- Phase 5: `/admin/leads` (search, status filter, pagination, detail drawer with status + notes, CSV export through the proxy; Odoo guards formula injection). Not yet done: admin login rate-limit is in-memory, no browser/visual e2e of the builder.

## Motion (Anime.js 4, replaces framer-motion)
- Import Anime only via `web/src/lib/anim` (shared easing/durations, `canAnimate()` = no reduced-motion and not inside the admin preview iframe). Components in `components/motion/`: `Reveal` (scroll reveal, `delay` in seconds, `as` prop; re-exported from `ui/reveal`), `SplitText` (staggered word headings; real text stays server-rendered, element gets aria-label), `SiteMotion` (page entrance, SVG icon draw for `[data-draw]`, scroll-linked drift for `[data-parallax]`; mounted by `(site)/template.tsx` so it replays per navigation), `HoverMotion` (one delegated listener; `data-hover="lift|btn"`, mouse only).
- Hiding is CSS-only inside `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)` (globals.css), so no-JS and reduced-motion users always see content. Every effect uses `createScope` and reverts on cleanup. Do not add CSS `transform`/`translate` hovers to elements that carry `data-hover` (Anime owns the transform).
- Verified in headless Chrome: desktop, 390px mobile (no x-overflow), reduced-motion, no-JS, hover/press, client navigation. Headless reports `(hover: hover)` false, so hover tests must override matchMedia.
