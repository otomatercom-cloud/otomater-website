from odoo import _, api, models
from odoo.exceptions import AccessError, ValidationError

ROLES = {"editor": "otomater_website.group_otm_website_editor", "lead": "otomater_website.group_otm_website_lead",
         "admin": "otomater_website.group_otm_website_admin"}


class OtmWebsiteAccess(models.AbstractModel):
    """User/role administration for the Next.js admin. Only the three website groups can ever be changed here."""
    _name = "otm.website.access"
    _description = "Website Access Administration"

    @api.model
    def _require_admin(self):
        if self.env.su or not self.env.user.has_group(ROLES["admin"]):
            raise AccessError(_("Website Administrator rights required."))

    @api.model
    def list_users(self):
        self._require_admin()
        gids = {k: self.env.ref(v).id for k, v in ROLES.items()}
        users = self.env["res.users"].sudo().search([("share", "=", False), ("active", "=", True)], order="name")
        return [{"id": u.id, "name": u.name, "login": u.login,
                 "roles": {k: gid in u.all_group_ids.ids for k, gid in gids.items()}} for u in users]

    @api.model
    def set_roles(self, user_id, roles):
        self._require_admin()
        if not isinstance(roles, dict) or set(roles) - set(ROLES):
            raise ValidationError(_("Unknown role."))
        user = self.env["res.users"].sudo().browse(int(user_id)).exists()
        if not user or user.share:
            raise ValidationError(_("Unknown user."))
        if user.id == self.env.user.id and roles.get("admin") is False:
            raise ValidationError(_("You cannot remove your own administrator role."))
        cmds = []
        for role, on in roles.items():
            gid = self.env.ref(ROLES[role]).id
            cmds.append((4, gid) if on else (3, gid))
        user.write({"group_ids": cmds})
        return self.list_users()
