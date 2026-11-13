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
