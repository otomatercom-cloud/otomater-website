from odoo import api, fields, models
from odoo.exceptions import ValidationError

from .util import BLOCK_KEY_RE, BLOCK_TYPES, MAX_JSON, loads_object


class OtmWebsiteBlock(models.Model):
    _name = "otm.website.block"
    _description = "Website Page Block"
    _order = "page_id, sequence, id"

    _page_key_uniq = models.Constraint("unique(page_id, key)", "Block key must be unique within a page.")

    page_id = fields.Many2one("otm.website.page", required=True, ondelete="cascade", index=True)
    key = fields.Char(required=True, help="Stable id used by the visual editor")
    block_type = fields.Selection([(t, t) for t in BLOCK_TYPES], required=True)
    visible = fields.Boolean(default=True)
    sequence = fields.Integer(default=10)
    settings_json = fields.Text(default="{}")
    data_json = fields.Text(default="{}")

    @api.constrains("key", "settings_json", "data_json")
    def _check_block(self):
        for rec in self:
            if not BLOCK_KEY_RE.match(rec.key or ""):
                raise ValidationError("Invalid block key.")
            loads_object(rec.settings_json, "Block settings", 5_000)
            loads_object(rec.data_json, "Block data", MAX_JSON)

    def _flag_pages(self):
        self.mapped("page_id")._mark_changed()

    @api.model_create_multi
    def create(self, vals_list):
        recs = super().create(vals_list)
        recs._flag_pages()
        return recs

    def write(self, vals):
        res = super().write(vals)
        self._flag_pages()
        return res

    def unlink(self):
        pages = self.mapped("page_id")
        res = super().unlink()
        pages._mark_changed()
        return res

    def to_dict(self):
        import json
        self.ensure_one()
        return {"key": self.key, "type": self.block_type, "visible": self.visible,
                "settings": json.loads(self.settings_json or "{}"), "data": json.loads(self.data_json or "{}")}
