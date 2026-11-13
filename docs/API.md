# Odoo ↔ Next.js API (v1)

Base: `{ODOO_BASE_URL}/api/otomater/v1`, `?db=<name>`. Every call needs `Authorization: Bearer <otomater_website.api_key>`.
Admin calls also need `X-Admin-Token`. Envelope: `{ok:true,data}` or `{ok:false,error,message}` (401 unauthorized, 403 forbidden, 404 not_found, 400 validation, 429 rate_limited).

## Public (published content only)
| Method | Path | Notes |
|---|---|---|
| GET | /public/site | `{settings, pages[]}` published settings (private keys removed) + published page index |
| GET | /public/pages/<slug> | published snapshot or 404 |
| GET | /public/media/<id> | image bytes (nosniff, CSP none) |
| POST | /public/leads | enquiry; `X-Client-IP` forwarded by Next; idempotent on `idempotencyKey` |

## Admin
Login `POST /admin/login {login,password}` → `{token,name,roles}`; `POST /admin/logout`; `GET /admin/session`.
Levels: editor (pages, settings, media), lead (enquiries), admin (users; page delete).

- `GET/POST /admin/pages`, `GET/PUT/DELETE /admin/pages/<id>` (PUT `{meta?, blocks?}`), `POST /admin/pages/<id>/publish|unpublish|duplicate`
- `GET /admin/settings`, `PUT /admin/settings/<group> {value}`, `POST /admin/settings/publish`
- `GET/POST /admin/media`, `PUT/DELETE /admin/media/<id>` (delete refused while in use)
- `GET /admin/leads?search&status&service&limit&offset`, `GET/PUT /admin/leads/<id> {status,notes}`, `GET /admin/leads/export` (CSV)
- `GET /admin/users`, `PUT /admin/users/<id>/roles {roles:{editor,lead,admin}}` (admin only; only the three website groups can change)

Odoo → Next revalidation (optional): system params `otomater_website.revalidate_url` (`https://site/api/revalidate`) and `otomater_website.revalidate_secret`; body `{tags:[…]}`.
