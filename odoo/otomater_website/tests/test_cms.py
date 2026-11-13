import base64
import io

from odoo.exceptions import AccessError, ValidationError
from odoo.tests.common import TransactionCase, tagged
from odoo.tools import mute_logger

from ..controllers import auth


def png_b64(size=(8, 8)):
    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", size, (40, 58, 75)).save(buf, "PNG")
    return base64.b64encode(buf.getvalue()).decode()


def blk(key, type_="richtext", **data):
    return {"key": key, "type": type_, "visible": True, "settings": {}, "data": data or {"heading": key, "body": "", "align": "left"}}


@tagged("post_install", "-at_install")
class TestCms(TransactionCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        Users = cls.env["res.users"].with_context(no_reset_password=True)
        cls.editor = Users.create({"name": "Ed", "login": "ed@t.test", "group_ids": [(4, cls.env.ref("otomater_website.group_otm_website_editor").id)]})
        cls.lead_mgr = Users.create({"name": "Lea", "login": "lea@t.test", "group_ids": [(4, cls.env.ref("otomater_website.group_otm_website_lead").id)]})
        cls.admin = Users.create({"name": "Ada", "login": "ada@t.test", "group_ids": [(4, cls.env.ref("otomater_website.group_otm_website_admin").id)]})
        cls.plain = Users.create({"name": "Pat", "login": "pat@t.test", "group_ids": [(4, cls.env.ref("base.group_user").id)]})
        cls.Page = cls.env["otm.website.page"]

    def _page(self, slug="test-page", blocks=None):
        p = self.Page.create({"name": "T", "slug": slug})
        p.set_layout(blocks or [blk("block_one"), blk("block_two")])
        return p

    # ---- publishing & draft isolation
    def test_seed_published(self):
        slugs = {s["slug"] for s in self.Page.public_snapshots()}
        self.assertTrue({"home", "contact", "privacy-policy"} <= slugs)
        self.assertEqual(self.env["otm.website.setting"].public_all()["site"]["name"], "Otomater")

    def test_draft_never_leaks(self):
        p = self._page()
        self.assertNotIn("test-page", {s["slug"] for s in self.Page.public_snapshots()})
        p.action_publish()
        p.set_layout([blk("block_one", heading="CHANGED", body="", align="left")])
        p.write({"name": "Renamed draft"})
        snap = next(s for s in self.Page.public_snapshots() if s["slug"] == "test-page")
        self.assertEqual(snap["name"], "T")
        self.assertEqual(len(snap["blocks"]), 2)
        self.assertNotIn("CHANGED", str(snap))
        self.assertTrue(p.has_unpublished_changes)
        p.action_publish()
        self.assertFalse(p.has_unpublished_changes)
        self.assertIn("CHANGED", str(next(s for s in self.Page.public_snapshots() if s["slug"] == "test-page")))
        p.action_unpublish()
        self.assertNotIn("test-page", {s["slug"] for s in self.Page.public_snapshots()})
        self.assertFalse(p.published_json)

    def test_publish_needs_blocks(self):
        with self.assertRaises(Exception):
            self.Page.create({"name": "Empty", "slug": "empty-page"}).action_publish()

    # ---- block editing & validation
    def test_layout_reorder_delete(self):
        p = self._page(blocks=[blk("aaaa"), blk("bbbb"), blk("cccc")])
        p.set_layout([blk("cccc"), blk("aaaa")])
        self.assertEqual([b["key"] for b in p.to_admin_dict()["blocks"]], ["cccc", "aaaa"])

    def test_layout_rejects_bad_input(self):
        p = self._page()
        for bad in ([blk("aaaa", "script")], [blk("aaaa"), blk("aaaa")], [blk("x")], [{"key": "aaaa", "type": "hero", "data": "str"}], "nope"):
            with self.assertRaises(ValidationError):
                p.set_layout(bad)

    def test_slug_rules(self):
        for bad in ("Admin", "admin", "api/x", "has space", "UPPER", "a//b", ""):
            with self.assertRaises(ValidationError):
                self.Page.create({"name": "x", "slug": bad})
        self.Page.create({"name": "ok", "slug": "projects/acme-erp"})
        with self.assertRaises(Exception), mute_logger("odoo.sql_db"), self.env.cr.savepoint():
            if True:
                self.Page.create({"name": "dup", "slug": "projects/acme-erp"})

    # ---- settings
    def test_private_setting_stripped(self):
        S = self.env["otm.website.setting"]
        S.set_draft("leads", {"serviceOptions": ["A"], "notificationEmails": ["boss@x.test"], "consentText": "c", "privacyHref": "/p"})
        S.publish_all()
        self.assertNotIn("notificationEmails", S.public_all()["leads"])
        self.assertEqual(S.lead_recipients(), ["boss@x.test"])
        with self.assertRaises(ValidationError):
            S.set_draft("nope", {})

    # ---- media
    def test_media_upload_rules(self):
        M = self.env["otm.website.media"]
        m = M.upload("Logo Image.PNG", png_b64(), "alt")
        self.assertEqual((m.mimetype, m.filename, m.width), ("image/png", "logo-image.png", 8))
        for bad in (base64.b64encode(b"<svg onload=alert(1)>").decode(), base64.b64encode(b"hello").decode(), "!!notbase64"):
            with self.assertRaises(ValidationError):
                M.upload("x", bad)
        p = self._page(blocks=[blk("imgx", "hero", heading="h", image={"media": m.id, "alt": ""})])
        self.assertGreaterEqual(m.usage_count(), 1)
        with self.assertRaises(ValidationError):
            m.unlink()
        p.set_layout([blk("block_one")])
        m.unlink()

    # ---- leads
    def _lead(self, key="k" * 20, **kw):
        p = {"fullName": "Asha K", "email": "Asha@Example.com", "phone": "+91 98765 43210", "consent": True, "idempotencyKey": key,
             "sourcePage": "/contact", "utm": {"source": "g", "medium": "cpc", "campaign": "x"}}
        p.update(kw)
        return self.env["otm.website.lead"].sudo().submit_public(p, "1.2.3.4", "https://ref.test")

    def test_lead_flow(self):
        r = self._lead()
        lead = self.env["otm.website.lead"].sudo().browse(r["id"])
        self.assertEqual((lead.email, lead.utm_source, lead.source_page, lead.status), ("asha@example.com", "g", "/contact", "new"))
        self.assertTrue(lead.consent_date)
        self.assertEqual(self._lead()["duplicate"], True)  # idempotent retry
        self.assertEqual(self._lead(key="h" * 20, website="bot")["id"], 0)  # honeypot stores nothing
        for bad in ({"consent": False}, {"email": "nope"}, {"phone": "abc"}, {"fullName": "A"}, {"idempotencyKey": "short"}):
            with self.assertRaises(ValidationError):
                self._lead(key="z" * 19 + str(len(str(bad))), **bad)

    def test_lead_rate_limit(self):
        for i in range(5):
            self._lead(key=f"rate-key-{i:02d}-aaaaaaaa")
        with self.assertRaisesRegex(ValidationError, "rate_limited"):
            self._lead(key="rate-key-99-aaaaaaaa")

    # ---- permissions (real non-superuser accounts)
    def test_permissions(self):
        Page, Lead = self.env["otm.website.page"], self.env["otm.website.lead"]
        self.assertTrue(Page.with_user(self.editor).search([]))
        with self.assertRaises(AccessError):
            Lead.with_user(self.editor).search([])
        with self.assertRaises(AccessError):
            Page.with_user(self.lead_mgr).search([])
        with self.assertRaises(AccessError):
            Page.with_user(self.plain).search([])
        with self.assertRaises(AccessError):
            Page.with_user(self.editor).search([], limit=1).unlink()
        lead = Lead.sudo().browse(self._lead()["id"])
        lead.with_user(self.lead_mgr).write({"status": "contacted"})
        with self.assertRaises(AccessError):
            Lead.with_user(self.lead_mgr).create({"name": "x", "email": "a@b.co", "phone": "1234567", "consent": True})

    def test_access_admin_only_and_scoped(self):
        A = self.env["otm.website.access"]
        for u in (self.editor, self.plain, self.lead_mgr):
            with self.assertRaises(AccessError):
                A.with_user(u).list_users()
            with self.assertRaises(AccessError):
                A.with_user(u).set_roles(self.plain.id, {"admin": True})
        A.with_user(self.admin).set_roles(self.plain.id, {"editor": True})
        self.assertTrue(self.plain.has_group("otomater_website.group_otm_website_editor"))
        with self.assertRaises(ValidationError):
            A.with_user(self.admin).set_roles(self.plain.id, {"base.group_system": True})  # cannot escalate to other groups
        with self.assertRaises(ValidationError):
            A.with_user(self.admin).set_roles(self.admin.id, {"admin": False})

    # ---- admin tokens
    def test_token_lifecycle(self):
        env = self.env
        t = auth.make_token(env, self.editor.id)
        self.assertEqual(auth.read_token(env, t), self.editor.id)
        self.assertIsNone(auth.read_token(env, t + "x"))
        self.assertIsNone(auth.read_token(env, "garbage"))
        self.assertIsNone(auth.read_token(env, t, now=10 ** 11))  # expired
        self.editor.sudo().write({"password": "A-new-Passw0rd!"})
        self.assertIsNone(auth.read_token(env, t))  # password change kills the token
        t2 = auth.make_token(env, self.editor.id)
        auth.revoke_user(env, self.editor.id)
        self.assertIsNone(auth.read_token(env, t2))  # logout kills the token
