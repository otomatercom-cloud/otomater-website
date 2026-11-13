import json

from odoo.tests.common import HttpCase, tagged

P = "/api/otomater/v1"


@tagged("post_install", "-at_install")
class TestHttp(HttpCase):

    def setUp(self):
        super().setUp()
        self.env["ir.config_parameter"].sudo().set_param("otomater_website.api_key", "test-key-0123456789abcdef")
        self.h = {"Authorization": "Bearer test-key-0123456789abcdef", "Content-Type": "application/json"}

    def _get(self, path, headers=None):
        return self.url_open(P + path, headers=headers if headers is not None else self.h)

    def test_key_required(self):
        self.assertEqual(self._get("/public/site", {}).status_code, 401)
        self.assertEqual(self._get("/public/site", {"Authorization": "Bearer wrong"}).status_code, 401)
        self.assertEqual(self._get("/admin/pages").status_code, 401)  # key ok, no admin token

    def test_public_content_published_only(self):
        r = self._get("/public/site")
        self.assertEqual(r.status_code, 200)
        data = r.json()["data"]
        self.assertIn("home", [p["slug"] for p in data["pages"]])
        self.assertNotIn("notificationEmails", json.dumps(data["settings"]))
        draft = self.env["otm.website.page"].create({"name": "Secret", "slug": "secret-draft"})
        self.assertEqual(self._get("/public/pages/secret-draft").status_code, 404)
        self.assertEqual(self._get("/public/pages/home").json()["data"]["slug"], "home")

    def test_admin_login_and_roles(self):
        env = self.env
        env["res.users"].with_context(no_reset_password=True).create({"name": "Plain", "login": "plain@t.test", "password": "Plain-Passw0rd!", "group_ids": [(4, env.ref("base.group_user").id)]})
        ed = env["res.users"].with_context(no_reset_password=True).create({"name": "Edi", "login": "edi@t.test", "password": "Edi-Passw0rd!", "group_ids": [(4, env.ref("otomater_website.group_otm_website_editor").id)]})
        post = lambda path, body, h=None: self.url_open(P + path, data=json.dumps(body), headers=h or self.h)
        self.assertEqual(post("/admin/login", {"login": "plain@t.test", "password": "Plain-Passw0rd!"}).status_code, 403)  # valid Odoo user, no website role
        self.assertEqual(post("/admin/login", {"login": "edi@t.test", "password": "bad"}).status_code, 401)
        ok = post("/admin/login", {"login": "edi@t.test", "password": "Edi-Passw0rd!"})
        self.assertEqual(ok.status_code, 200)
        tok = ok.json()["data"]["token"]
        h = dict(self.h, **{"X-Admin-Token": tok})
        self.assertEqual(self.url_open(P + "/admin/pages", headers=h).status_code, 200)
        self.assertEqual(self.url_open(P + "/admin/leads", headers=h).status_code, 403)  # editor is not a lead manager
        self.assertEqual(self.url_open(P + "/admin/users", headers=h).status_code, 403)
        self.assertEqual(post("/admin/logout", {}, h).status_code, 200)
        self.assertEqual(self.url_open(P + "/admin/pages", headers=h).status_code, 401)  # token revoked
        # brute force: 5 failures then locked even with the right password
        for _ in range(5):
            post("/admin/login", {"login": "edi@t.test", "password": "bad"})
        self.assertEqual(post("/admin/login", {"login": "edi@t.test", "password": "Edi-Passw0rd!"}).status_code, 429)

    def test_public_lead_endpoint(self):
        body = {"fullName": "Asha K", "email": "a@b.co", "phone": "+91 98765 43210", "consent": True, "idempotencyKey": "http-test-key-0001-abcd"}
        r = self.url_open(P + "/public/leads", data=json.dumps(body), headers=dict(self.h, **{"X-Client-IP": "9.9.9.9"}))
        self.assertEqual(r.status_code, 200, r.text)
        self.assertFalse(r.json()["data"]["duplicate"])
        r2 = self.url_open(P + "/public/leads", data=json.dumps(body), headers=self.h)
        self.assertTrue(r2.json()["data"]["duplicate"])
        bad = self.url_open(P + "/public/leads", data=json.dumps(dict(body, consent=False, idempotencyKey="http-test-key-0002-abcd")), headers=self.h)
        self.assertEqual(bad.status_code, 400)
        self.assertEqual(self._get("/admin/leads").status_code, 401)  # leads are never public
