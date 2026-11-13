from odoo import api, models

from .seed_content import PAGES, SETTINGS
from .util import dumps


class OtmWebsiteSeed(models.AbstractModel):
    """Idempotent first-install content. Neutral placeholder copy only: no invented customers, numbers or contact details."""
    _name = "otm.website.seed"
    _description = "Website Seed Content"

    @api.model
    def run(self):
        icp = self.env["ir.config_parameter"].sudo()
        if icp.get_param("otomater_website.seeded"):
            return
        Setting = self.env["otm.website.setting"]
        for group, value in SETTINGS.items():
            rec = Setting._get(group)
            rec.write({"draft_json": dumps(value), "has_unpublished_changes": True})
        Setting.publish_all()
        Page = self.env["otm.website.page"]
        for i, p in enumerate(PAGES):
            if Page.search_count([("slug", "=", p["slug"])]):
                continue
            page = Page.create({"name": p["name"], "slug": p["slug"], "page_type": p.get("type", "standard"), "sequence": (i + 1) * 10,
                                "summary": p.get("summary", ""), "seo_description": p.get("summary", ""), "show_in_nav": p.get("nav", False)})
            page.set_layout(p["blocks"])
            page.action_publish()
        icp.set_param("otomater_website.seeded", "1")

    @api.model
    def apply_content(self, slugs=None, publish=True):
        """Replace the draft layout of the given pages (default: the main service pages) with the bundled copy.
        Run once on an existing site:  env['otm.website.seed'].apply_content(); env.cr.commit()
        This OVERWRITES those pages' sections, so do not run it after editing them in the admin."""
        Page = self.env["otm.website.page"]
        for p in PAGES:
            if slugs is not None and p["slug"] not in slugs:
                continue
            if slugs is None and p["slug"] not in ("home", "about", "erp-solutions", "software-development", "digital-marketing", "industries"):
                continue
            page = Page.search([("slug", "=", p["slug"])], limit=1)
            if not page:
                page = Page.create({"name": p["name"], "slug": p["slug"], "page_type": p.get("type", "standard"), "summary": p.get("summary", ""),
                                    "seo_description": p.get("summary", ""), "show_in_nav": p.get("nav", False)})
            else:
                page.write({"summary": p.get("summary", ""), "seo_description": p.get("summary", "")})
            page.set_layout(p["blocks"])
            if publish:
                page.action_publish()
        return True
