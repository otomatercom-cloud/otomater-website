import json
import logging
import re
import threading

from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)

BLOCK_TYPES = ["hero", "richtext", "image_text", "cta", "cards", "stats", "logos", "testimonials",
               "projects", "faq", "gallery", "lead_form", "spacer", "video", "automation", "automation_demo"]
PAGE_TYPES = ["standard", "service", "industry", "project", "post", "legal"]
SETTING_GROUPS = ["site", "navigation", "footer", "contact", "social", "theme", "seo", "leads"]
# keys that must never leave Odoo through the public API
PRIVATE_SETTING_KEYS = {"leads": {"notificationEmails"}}
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*){0,2}$")
RESERVED_SLUGS = {"admin", "api", "media", "preview", "_next", "sitemap.xml", "robots.txt", "login"}
BLOCK_KEY_RE = re.compile(r"^[a-z0-9_-]{4,40}$")
MAX_JSON = 200_000


def loads_object(text, label, limit=MAX_JSON):
    """Parse a JSON object from a stored/incoming string; raise ValidationError otherwise."""
    if not text:
        return {}
    if len(text) > limit:
        raise ValidationError(f"{label} is too large.")
    try:
        data = json.loads(text)
    except ValueError:
        raise ValidationError(f"{label} is not valid JSON.")
    if not isinstance(data, dict):
        raise ValidationError(f"{label} must be a JSON object.")
    return data


def dumps(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def notify_revalidate(env, tags):
    """Tell the Next.js site to drop cached pages. Runs only after COMMIT; failures never affect the save."""
    icp = env["ir.config_parameter"].sudo()
    url, secret = icp.get_param("otomater_website.revalidate_url"), icp.get_param("otomater_website.revalidate_secret")
    if not url or not secret:
        return

    def _fire():
        try:
            import requests
            requests.post(url, json={"tags": list(tags)}, headers={"Authorization": f"Bearer {secret}"}, timeout=5)
        except Exception:  # noqa: BLE001 - revalidation is best effort
            _logger.warning("otomater_website: cache revalidation call failed", exc_info=True)

    env.cr.postcommit.add(lambda: threading.Thread(target=_fire, daemon=True).start())
