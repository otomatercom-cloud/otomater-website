# Otomater website

See `CLAUDE.md` (architecture, commands, status) and `docs/API.md`. Copy `.env.example` to `web/.env.local` and set `otomater_website.api_key` in Odoo (System Parameters) to the same value as `ODOO_API_KEY`.
Install the addon: add `odoo/` to the Odoo addons path, update apps list, install **Otomater Website CMS**. First install seeds neutral placeholder pages and settings (no customer names, statistics or contact details) – replace them in the admin.
