import hashlib
import re

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

from .util import notify_revalidate  # noqa: F401  (kept for symmetry)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$")
PHONE_RE = re.compile(r"^\+?[0-9 ()-]{7,20}$")
KEY_RE = re.compile(r"^[A-Za-z0-9_-]{16,64}$")
STATUSES = [("new", "New"), ("contacted", "Contacted"), ("qualified", "Qualified"), ("won", "Won"), ("lost", "Lost"), ("spam", "Spam")]
LEAD_LIMIT, LEAD_WINDOW = 5, 600


def _clip(v, n):
    return (v or "").strip()[:n] if isinstance(v, str) else ""


class OtmWebsiteLead(models.Model):
    _name = "otm.website.lead"
    _description = "Website Enquiry"
    _order = "id desc"

    _idem_uniq = models.Constraint("unique(idempotency_key)", "Duplicate submission.")

    name = fields.Char(required=True)
    email = fields.Char(required=True, index=True)
    phone = fields.Char(required=True)
    company = fields.Char()
    service = fields.Char()
    message = fields.Text()
    consent = fields.Boolean(required=True)
    consent_date = fields.Datetime(readonly=True)
    source_page = fields.Char(readonly=True)
    referrer = fields.Char(readonly=True)
    utm_source = fields.Char(readonly=True)
    utm_medium = fields.Char(readonly=True)
    utm_campaign = fields.Char(readonly=True)
    submitted_date = fields.Datetime(default=fields.Datetime.now, readonly=True, index=True)
    status = fields.Selection(STATUSES, default="new", required=True, index=True)
    notes = fields.Text(string="Internal Notes")
    idempotency_key = fields.Char(readonly=True, copy=False)

    @api.model
    def submit_public(self, p, ip, referrer=""):
        """Validate + store a website enquiry. `self` must be the elevated (sudo) env; only the BFF may call this."""
        if not isinstance(p, dict):
            raise ValidationError(_("Invalid request."))
        if p.get("website"):  # honeypot: pretend success, store nothing
            return {"id": 0, "duplicate": False}
        key = p.get("idempotencyKey")
        if not isinstance(key, str) or not KEY_RE.match(key):
            raise ValidationError(_("Invalid request."))
        existing = self.search([("idempotency_key", "=", key)], limit=1)
        if existing:
            return {"id": existing.id, "duplicate": True}
        ip_hash = hashlib.sha256((ip or "unknown").encode()).hexdigest()[:24]
        throttle = self.env["otm.website.throttle"]
        tkey = f"lead:{ip_hash}"
        if throttle.is_blocked(tkey, LEAD_LIMIT, LEAD_WINDOW):
            raise ValidationError("rate_limited")
        name, email, phone = _clip(p.get("fullName"), 120), _clip(p.get("email"), 160).lower(), _clip(p.get("phone"), 20)
        if len(name) < 2 or not EMAIL_RE.match(email) or not PHONE_RE.match(phone) or p.get("consent") is not True:
            raise ValidationError(_("Please check the required fields."))
        utm = p.get("utm") if isinstance(p.get("utm"), dict) else {}
        throttle.hit(tkey, LEAD_WINDOW)
        rec = self.create({
            "name": name, "email": email, "phone": phone, "company": _clip(p.get("company"), 120), "service": _clip(p.get("service"), 80),
            "message": _clip(p.get("message"), 3000), "consent": True, "consent_date": fields.Datetime.now(),
            "source_page": _clip(p.get("sourcePage"), 200), "referrer": _clip(referrer, 300),
            "utm_source": _clip(utm.get("source"), 100), "utm_medium": _clip(utm.get("medium"), 100), "utm_campaign": _clip(utm.get("campaign"), 100),
            "idempotency_key": key})
        rec._queue_notification()
        return {"id": rec.id, "duplicate": False}

    def _queue_notification(self):
        """Email configured recipients after COMMIT. A mail failure must never lose or roll back the saved lead."""
        recipients = self.env["otm.website.setting"].lead_recipients()
        if not recipients:
            return
        db, lead_id = self.env.cr.dbname, self.id

        def _send():
            try:
                from odoo.modules.registry import Registry
                with Registry(db).cursor() as cr:
                    env = api.Environment(cr, 1, {})
                    lead = env["otm.website.lead"].browse(lead_id)
                    server = env["ir.mail_server"]
                    sender = env["ir.config_parameter"].get_param("otomater_website.email_from") or env.company.email
                    if not sender:
                        return
                    body = "\n".join(f"{k}: {v}" for k, v in (
                        ("Name", lead.name), ("Email", lead.email), ("Phone", lead.phone), ("Company", lead.company),
                        ("Service", lead.service), ("Page", lead.source_page), ("Message", lead.message)) if v)
                    msg = server.build_email(sender, recipients, f"New website enquiry: {lead.name}", body, subtype="plain")
                    server.send_email(msg)
            except Exception:  # noqa: BLE001
                import logging
                logging.getLogger(__name__).warning("otomater_website: enquiry notification failed", exc_info=True)

        import threading
        self.env.cr.postcommit.add(lambda: threading.Thread(target=_send, daemon=True).start())

    def to_dict(self):
        self.ensure_one()
        return {"id": self.id, "name": self.name, "email": self.email, "phone": self.phone, "company": self.company or "",
                "service": self.service or "", "message": self.message or "", "status": self.status, "notes": self.notes or "",
                "sourcePage": self.source_page or "", "referrer": self.referrer or "", "utmSource": self.utm_source or "",
                "utmMedium": self.utm_medium or "", "utmCampaign": self.utm_campaign or "",
                "submittedAt": fields.Datetime.to_string(self.submitted_date), "consent": self.consent}
