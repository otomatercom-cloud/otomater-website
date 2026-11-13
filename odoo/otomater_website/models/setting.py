import json

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

from .util import PRIVATE_SETTING_KEYS, SETTING_GROUPS, dumps, loads_object, notify_revalidate


class OtmWebsiteSetting(models.Model):
    _name = "otm.website.setting"
    _description = "Website Global Setting"
    _order = "id"
    _rec_name = "group_key"

    _group_uniq = models.Constraint("unique(group_key)", "Each settings group exists once.")

    group_key = fields.Selection([(g, g.title()) for g in SETTING_GROUPS], required=True, index=True)
    draft_json = fields.Text(default="{}")
    published_json = fields.Text(default="{}", readonly=True)
    has_unpublished_changes = fields.Boolean(readonly=True)

    @api.constrains("draft_json")
    def _check_json(self):
        for rec in self:
            loads_object(rec.draft_json, "Setting", 60_000)

    @api.model
    def _get(self, group):
        if group not in SETTING_GROUPS:
            raise ValidationError(_("Unknown settings group."))
        return self.search([("group_key", "=", group)], limit=1) or self.create({"group_key": group})

    @api.model
    def admin_all(self):
        return {g: {"draft": json.loads(self._get(g).draft_json or "{}"), "dirty": self._get(g).has_unpublished_changes} for g in SETTING_GROUPS}

    @api.model
    def set_draft(self, group, value):
        if not isinstance(value, dict):
            raise ValidationError(_("Settings must be an object."))
        rec = self._get(group)
        rec.write({"draft_json": dumps(value), "has_unpublished_changes": True})
        return rec

    @api.model
    def publish_all(self):
        for g in SETTING_GROUPS:
            rec = self._get(g)
            if rec.has_unpublished_changes or not rec.published_json or rec.published_json == "{}":
                rec.write({"published_json": rec.draft_json, "has_unpublished_changes": False})
        notify_revalidate(self.env, ["otomater:site"])

    @api.model
    def public_all(self):
        """Published values with private keys removed. Safe to return to the website."""
        out = {}
        for g in SETTING_GROUPS:
            data = json.loads(self.sudo()._get(g).published_json or "{}")
            for k in PRIVATE_SETTING_KEYS.get(g, ()):
                data.pop(k, None)
            out[g] = data
        return out

    @api.model
    def lead_recipients(self):
        data = json.loads(self.sudo()._get("leads").published_json or "{}")
        return [e for e in data.get("notificationEmails", []) if isinstance(e, str) and "@" in e]
