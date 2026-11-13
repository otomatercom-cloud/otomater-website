import json

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError

from .util import (BLOCK_KEY_RE, BLOCK_TYPES, MAX_JSON, PAGE_TYPES, RESERVED_SLUGS, SLUG_RE, dumps, loads_object,
                   notify_revalidate)

DRAFT_FIELDS = {"name", "slug", "page_type", "seo_title", "seo_description", "canonical_url", "og_image_id", "noindex",
                "show_in_nav", "sequence", "summary", "card_image_id"}
MAX_BLOCKS = 80


class OtmWebsitePage(models.Model):
    _name = "otm.website.page"
    _description = "Website Page"
    _order = "sequence, id"

    _slug_uniq = models.Constraint("unique(slug)", "Another page already uses this slug.")

    name = fields.Char(required=True)
    slug = fields.Char(required=True, index=True, copy=False, help="URL path, e.g. erp-solutions. 'home' is the home page.")
    page_type = fields.Selection([(t, t.title()) for t in PAGE_TYPES], required=True, default="standard")
    status = fields.Selection([("draft", "Draft"), ("published", "Published")], required=True, default="draft", index=True, copy=False)
    sequence = fields.Integer(default=10)
    seo_title = fields.Char()
    seo_description = fields.Char()
    canonical_url = fields.Char()
    og_image_id = fields.Many2one("otm.website.media", ondelete="set null")
    noindex = fields.Boolean()
    show_in_nav = fields.Boolean()
    summary = fields.Char(help="Short text for cards and listings")
    card_image_id = fields.Many2one("otm.website.media", ondelete="set null")
    publication_date = fields.Datetime(readonly=True, copy=False)
    has_unpublished_changes = fields.Boolean(readonly=True, copy=False)
    published_json = fields.Text(readonly=True, copy=False, help="Frozen copy served publicly. Drafts never leave Odoo.")
    block_ids = fields.One2many("otm.website.block", "page_id", string="Content Blocks")

    @api.constrains("slug")
    def _check_slug(self):
        for rec in self:
            if not SLUG_RE.match(rec.slug or "") or rec.slug.split("/")[0] in RESERVED_SLUGS:
                raise ValidationError(_("Invalid or reserved slug '%s'.", rec.slug))

    # ---------- change tracking
    def _mark_changed(self):
        pages = self.filtered(lambda p: p.status == "published" and not p.has_unpublished_changes)
        if pages:
            super(OtmWebsitePage, pages).write({"has_unpublished_changes": True})

    def write(self, vals):
        if DRAFT_FIELDS & set(vals) and not self.env.context.get("otm_publishing"):
            vals = dict(vals, has_unpublished_changes=True) if any(p.status == "published" for p in self) else vals
        return super().write(vals)

    def unlink(self):
        published = self.filtered(lambda p: p.status == "published")
        slugs = published.mapped("slug")
        res = super().unlink()
        if slugs:
            notify_revalidate(self.env, ["otomater:site", "otomater:pages"] + [f"otomater:page:{s}" for s in slugs])
        return res

    # ---------- serialisation
    def _meta(self):
        self.ensure_one()
        return {"name": self.name, "slug": self.slug, "pageType": self.page_type, "seoTitle": self.seo_title or "",
                "seoDescription": self.seo_description or "", "canonicalUrl": self.canonical_url or "",
                "ogImageMedia": self.og_image_id.id or None, "noindex": self.noindex, "showInNav": self.show_in_nav,
                "sequence": self.sequence, "summary": self.summary or "", "cardImageMedia": self.card_image_id.id or None}

    def to_admin_dict(self, with_blocks=True):
        self.ensure_one()
        d = dict(self._meta(), id=self.id, status=self.status, hasUnpublishedChanges=self.has_unpublished_changes,
                 publishedAt=fields.Datetime.to_string(self.publication_date) if self.publication_date else None,
                 updatedAt=fields.Datetime.to_string(self.write_date))
        if with_blocks:
            d["blocks"] = [b.to_dict() for b in self.block_ids.sorted(lambda b: (b.sequence, b.id))]
        return d

    # ---------- editing
    def set_meta(self, vals):
        """Apply camelCase meta from the editor. Unknown keys are ignored (strict allowlist)."""
        self.ensure_one()
        m = {"name": "name", "slug": "slug", "pageType": "page_type", "seoTitle": "seo_title", "seoDescription": "seo_description",
             "canonicalUrl": "canonical_url", "noindex": "noindex", "showInNav": "show_in_nav", "sequence": "sequence", "summary": "summary"}
        out = {}
        for k, f in m.items():
            if k in vals:
                out[f] = vals[k]
        if "pageType" in vals and vals["pageType"] not in PAGE_TYPES:
            raise ValidationError(_("Invalid page type."))
        for k, f in (("ogImageMedia", "og_image_id"), ("cardImageMedia", "card_image_id")):
            if k in vals:
                mid = int(vals[k]) if vals[k] else False
                out[f] = self.env["otm.website.media"].browse(mid).exists().id if mid else False
        self.write(out)

    def set_layout(self, blocks):
        """Replace the draft layout atomically. Order of `blocks` becomes the page order."""
        self.ensure_one()
        if not isinstance(blocks, list) or len(blocks) > MAX_BLOCKS:
            raise ValidationError(_("Invalid block list (max %s blocks).", MAX_BLOCKS))
        seen, rows = set(), []
        for i, b in enumerate(blocks):
            if not isinstance(b, dict) or b.get("type") not in BLOCK_TYPES:
                raise ValidationError(_("Unknown block type."))
            key = b.get("key")
            if not isinstance(key, str) or not BLOCK_KEY_RE.match(key) or key in seen:
                raise ValidationError(_("Invalid or duplicate block key."))
            seen.add(key)
            data, settings = b.get("data", {}), b.get("settings", {})
            if not isinstance(data, dict) or not isinstance(settings, dict):
                raise ValidationError(_("Block data must be an object."))
            rows.append({"key": key, "block_type": b["type"], "visible": bool(b.get("visible", True)), "sequence": (i + 1) * 10,
                         "settings_json": dumps(settings), "data_json": dumps(data)})
        existing = {b.key: b for b in self.block_ids}
        for r in rows:
            if r["key"] in existing:
                existing[r["key"]].write({k: v for k, v in r.items() if k != "key"})
            else:
                self.env["otm.website.block"].create(dict(r, page_id=self.id))
        self.block_ids.filtered(lambda b: b.key not in seen).unlink()
        self._mark_changed()

    # ---------- publishing
    def _snapshot(self):
        self.ensure_one()
        snap = dict(self._meta(), id=self.id, blocks=[b.to_dict() for b in self.block_ids.sorted(lambda b: (b.sequence, b.id))],
                    publishedAt=fields.Datetime.to_string(fields.Datetime.now()))
        text = dumps(snap)
        if len(text) > MAX_JSON * 2:
            raise ValidationError(_("Page is too large to publish."))
        return text

    def action_publish(self):
        for page in self:
            if not page.block_ids:
                raise UserError(_("Add at least one block before publishing '%s'.", page.name))
            page.with_context(otm_publishing=True).write({
                "published_json": page._snapshot(), "status": "published", "publication_date": fields.Datetime.now(),
                "has_unpublished_changes": False})
        notify_revalidate(self.env, ["otomater:site", "otomater:pages"] + [f"otomater:page:{s}" for s in self.mapped("slug")])

    def action_unpublish(self):
        self.with_context(otm_publishing=True).write({"status": "draft", "published_json": False, "has_unpublished_changes": False})
        notify_revalidate(self.env, ["otomater:site", "otomater:pages"] + [f"otomater:page:{s}" for s in self.mapped("slug")])

    def action_duplicate_page(self):
        self.ensure_one()
        base, n = self.slug, 1
        while self.search_count([("slug", "=", f"{base}-copy{n if n > 1 else ''}")]):
            n += 1
        new = self.create(dict(self._meta_for_copy(), slug=f"{base}-copy{n if n > 1 else ''}", name=f"{self.name} (copy)"))
        for b in self.block_ids:
            self.env["otm.website.block"].create({"page_id": new.id, "key": b.key, "block_type": b.block_type, "visible": b.visible,
                                                  "sequence": b.sequence, "settings_json": b.settings_json, "data_json": b.data_json})
        return new

    def _meta_for_copy(self):
        return {"page_type": self.page_type, "sequence": self.sequence + 1, "seo_title": self.seo_title, "seo_description": self.seo_description,
                "summary": self.summary, "show_in_nav": False}

    @api.model
    def public_snapshots(self):
        """Published pages only, parsed. Used by the public API; reads the frozen copy, never the draft rows."""
        out = []
        for p in self.sudo().search([("status", "=", "published"), ("published_json", "!=", False)]):
            try:
                out.append(json.loads(p.published_json))
            except ValueError:
                continue
        return out
