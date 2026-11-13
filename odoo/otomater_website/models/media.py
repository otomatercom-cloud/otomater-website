import base64
import io
import re

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

MAX_BYTES = 8 * 1024 * 1024
MAX_SIDE = 6000
ALLOWED = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}


def sniff_mime(raw):
    """Decide the type from file content (never from the client-supplied name/type). SVG is refused on purpose."""
    if raw[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if raw[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if raw[:4] == b"RIFF" and raw[8:12] == b"WEBP":
        return "image/webp"
    if raw[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    return None


def safe_filename(name, ext):
    stem = re.sub(r"[^a-z0-9]+", "-", (name or "image").rsplit(".", 1)[0].lower()).strip("-")[:60] or "image"
    return f"{stem}.{ext}"


class OtmWebsiteMedia(models.Model):
    _name = "otm.website.media"
    _description = "Website Media"
    _order = "id desc"

    name = fields.Char(required=True)
    file = fields.Binary(attachment=True, required=True)  # stored through ir.attachment
    filename = fields.Char(readonly=True)
    mimetype = fields.Char(readonly=True)
    file_size = fields.Integer(readonly=True)
    width = fields.Integer(readonly=True)
    height = fields.Integer(readonly=True)
    alt_text = fields.Char()

    @api.model
    def upload(self, name, b64, alt_text=""):
        if not isinstance(b64, str) or len(b64) > MAX_BYTES * 4 // 3 + 64:
            raise ValidationError(_("File is too large (max 8 MB)."))
        try:
            raw = base64.b64decode(b64.split(",", 1)[-1], validate=True)
        except ValueError:
            raise ValidationError(_("Invalid file data."))
        if len(raw) > MAX_BYTES:
            raise ValidationError(_("File is too large (max 8 MB)."))
        mime = sniff_mime(raw)
        if not mime:
            raise ValidationError(_("Upload a JPG, PNG, WebP or GIF image (SVG is not allowed)."))
        from PIL import Image
        try:
            with Image.open(io.BytesIO(raw)) as im:
                im.verify()
            with Image.open(io.BytesIO(raw)) as im:
                width, height = im.size
        except Exception:  # noqa: BLE001
            raise ValidationError(_("The image file is corrupt."))
        if max(width, height) > MAX_SIDE:
            raise ValidationError(_("Image is larger than %(n)s px on one side.", n=MAX_SIDE))
        filename = safe_filename(name, ALLOWED[mime])
        return self.create({
            "name": (name or filename)[:120], "file": base64.b64encode(raw), "filename": filename, "mimetype": mime,
            "file_size": len(raw), "width": width, "height": height, "alt_text": (alt_text or "")[:200]})

    def to_dict(self):
        self.ensure_one()
        return {"id": self.id, "name": self.name, "filename": self.filename, "mimetype": self.mimetype, "size": self.file_size, "usage": self.usage_count(),
                "width": self.width, "height": self.height, "alt": self.alt_text or "", "url": f"/media/{self.id}"}

    def usage_count(self):
        """How many blocks, settings or pages still point at this image (draft or published)."""
        self.ensure_one()
        pat = r'"[A-Za-z]*[mM]edia":%d([,}])' % self.id
        n = 0
        for table, col in (("otm_website_block", "data_json"), ("otm_website_page", "published_json"),
                           ("otm_website_setting", "draft_json"), ("otm_website_setting", "published_json")):
            self.env.cr.execute(f"SELECT count(*) FROM {table} WHERE {col} ~ %s", (pat,))
            n += self.env.cr.fetchone()[0]
        n += self.env["otm.website.page"].sudo().search_count(["|", ("og_image_id", "=", self.id), ("card_image_id", "=", self.id)])
        return n

    def unlink(self):
        for rec in self:
            if rec.usage_count() and not self.env.context.get("otm_force_media_delete"):
                raise ValidationError(_("'%s' is still used on the website. Replace it first.", rec.name))
        return super().unlink()
