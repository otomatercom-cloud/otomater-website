import base64
import csv
import hmac
import io
import json
import logging

from odoo import _, http
from odoo.exceptions import AccessDenied, AccessError, MissingError, UserError, ValidationError
from odoo.http import request

from .auth import make_token, read_token, revoke_user, TOKEN_TTL

_logger = logging.getLogger(__name__)
P = "/api/otomater/v1"
KEY_PARAM = "otomater_website.api_key"
MAX_BODY = 14 * 1024 * 1024  # an 8 MB image in base64
LEVELS = {"editor": "otomater_website.group_otm_website_editor", "lead": "otomater_website.group_otm_website_lead",
          "admin": "otomater_website.group_otm_website_admin"}
LOGIN_LIMIT, LOGIN_WINDOW = 5, 900


def _json(payload, status=200):
    return http.Response(json.dumps(payload, default=str), status=status, headers=[
        ("Content-Type", "application/json"), ("Cache-Control", "no-store"), ("X-Content-Type-Options", "nosniff")])


def _err(code, status, message=""):
    return _json({"ok": False, "error": code, "message": message}, status)


def _int(v, default=0):
    """Ids from a browser/JSON are often strings. Never trust their type."""
    try:
        return int(v)
    except (TypeError, ValueError):
        return default


class OtomaterApi(http.Controller):

    # ------------------------------------------------------------------ guards
    def _server_ok(self):
        configured = request.env["ir.config_parameter"].sudo().get_param(KEY_PARAM)
        header = request.httprequest.headers.get("Authorization", "")
        supplied = header[7:] if header.startswith("Bearer ") else ""
        return bool(configured) and hmac.compare_digest(supplied.encode(), configured.encode())

    def _admin_env(self, level):
        """(env, None) for a valid admin token with the required group, else (None, error response)."""
        uid = read_token(request.env, request.httprequest.headers.get("X-Admin-Token", ""))
        user = request.env["res.users"].sudo().browse(uid).exists() if uid else None
        if not user or not user.active:
            return None, _err("unauthorized", 401)
        allowed = [LEVELS[level]] if level != "any" else list(LEVELS.values())
        if not any(user.has_group(g) for g in allowed):
            return None, _err("forbidden", 403)
        return request.env(user=user.id), None

    def _body(self):
        raw = request.httprequest.get_data(cache=True)
        if len(raw) > MAX_BODY:
            raise ValidationError(_("Request too large."))
        try:
            data = json.loads(raw or b"{}")
        except ValueError:
            raise ValidationError(_("Invalid JSON."))
        if not isinstance(data, dict):
            raise ValidationError(_("Invalid JSON."))
        return data

    def _run(self, level, fn, body=False):
        """level None = public (key only); else admin level. Errors roll the transaction back before answering."""
        if not self._server_ok():
            return _err("unauthorized", 401)
        env = request.env
        try:
            if level:
                env, resp = self._admin_env(level)
                if resp:
                    return resp
            return _json({"ok": True, "data": fn(env, self._body() if body else {})})
        except AccessError:  # AccessError/MissingError subclass UserError: they must be matched first
            request.env.cr.rollback()
            return _err("forbidden", 403)
        except MissingError:
            request.env.cr.rollback()
            return _err("not_found", 404)
        except (ValidationError, UserError) as e:
            request.env.cr.rollback()
            return _err("validation", 400, str(e.args[0]) if e.args else "")
        except Exception:  # noqa: BLE001
            request.env.cr.rollback()
            _logger.exception("otomater api failure")
            return _err("server_error", 500)

    def _page(self, env, pid):
        page = env["otm.website.page"].browse(_int(pid)).exists()
        if not page:
            raise MissingError(_("Page not found."))
        return page

    # ------------------------------------------------------------------ public
    @http.route(f"{P}/public/site", type="http", auth="public", methods=["GET"], csrf=False, save_session=False)
    def public_site(self, **kw):
        def go(env, _b):
            pages = [{k: s.get(k) for k in ("id", "name", "slug", "pageType", "showInNav", "sequence", "summary", "cardImageMedia", "publishedAt")}
                     for s in env["otm.website.page"].public_snapshots()]
            return {"settings": env["otm.website.setting"].public_all(), "pages": sorted(pages, key=lambda p: (p["sequence"], p["id"]))}
        return self._run(None, go)

    @http.route(f"{P}/public/pages/<path:slug>", type="http", auth="public", methods=["GET"], csrf=False, save_session=False)
    def public_page(self, slug, **kw):
        def go(env, _b):
            page = env["otm.website.page"].sudo().search([("slug", "=", slug), ("status", "=", "published")], limit=1)
            if not page or not page.published_json:
                raise MissingError("nf")
            return json.loads(page.published_json)
        return self._run(None, go)

    @http.route(f"{P}/public/media/<int:media_id>", type="http", auth="public", methods=["GET"], csrf=False, save_session=False)
    def public_media(self, media_id, **kw):
        if not self._server_ok():
            return _err("unauthorized", 401)
        m = request.env["otm.website.media"].sudo().browse(media_id).exists()
        if not m or not m.file:
            return _err("not_found", 404)
        return request.make_response(base64.b64decode(m.file), headers=[
            ("Content-Type", m.mimetype), ("Cache-Control", "public, max-age=86400"), ("X-Content-Type-Options", "nosniff"),
            ("Content-Security-Policy", "default-src 'none'"), ("Content-Disposition", f'inline; filename="{m.filename}"')])

    @http.route(f"{P}/public/leads", type="http", auth="public", methods=["POST"], csrf=False, save_session=False)
    def public_lead(self, **kw):
        def go(env, body):
            ip = request.httprequest.headers.get("X-Client-IP", "")[:64]
            res = env["otm.website.lead"].sudo().submit_public(body, ip, body.get("referrer", ""))
            return {"id": res["id"], "duplicate": res["duplicate"]}
        resp = self._run(None, go, body=True)
        if resp.status_code == 400 and b"rate_limited" in resp.get_data():
            return _err("rate_limited", 429)
        return resp

    # ------------------------------------------------------------------ admin auth
    @http.route(f"{P}/admin/login", type="http", auth="public", methods=["POST"], csrf=False, save_session=False)
    def login(self, **kw):
        if not self._server_ok():
            return _err("unauthorized", 401)
        try:
            data = self._body()
            login, password = str(data.get("login") or ""), str(data.get("password") or "")
            ip = str(request.httprequest.headers.get("X-Client-IP", ""))[:64]
            throttle = request.env["otm.website.throttle"].sudo()
            tkeys = [f"login:{login.lower()[:100]}", f"loginip:{ip}"]
            if any(throttle.is_blocked(k, LOGIN_LIMIT, LOGIN_WINDOW) for k in tkeys):
                return _err("rate_limited", 429)
            if not login or not password or len(login) > 200 or len(password) > 500:
                return _err("invalid_credentials", 401)
            try:
                request.session.authenticate(request.env, {"type": "password", "login": login, "password": password})
                uid = request.session.uid
            except (AccessDenied, ValidationError):
                uid = None
            user = request.env["res.users"].sudo().browse(uid) if uid else None
            if not user or not any(user.has_group(g) for g in LEVELS.values()):
                for k in tkeys:
                    throttle.hit(k, LOGIN_WINDOW)
                return _err("invalid_credentials" if not user else "forbidden", 401 if not user else 403)
            throttle.reset(tkeys[0])
            roles = {k: user.has_group(g) for k, g in LEVELS.items()}
            return _json({"ok": True, "data": {"token": make_token(request.env, uid), "name": user.name, "uid": uid, "roles": roles, "expiresIn": TOKEN_TTL}})
        except ValidationError:
            return _err("validation", 400)
        except Exception:  # noqa: BLE001 - never leak details of an auth failure
            _logger.exception("otomater admin login failed unexpectedly")
            return _err("invalid_credentials", 401)

    @http.route(f"{P}/admin/logout", type="http", auth="public", methods=["POST"], csrf=False, save_session=False)
    def logout(self, **kw):
        def go(env, _b):
            revoke_user(request.env, env.uid)
            return {}
        return self._run("any", go)

    @http.route(f"{P}/admin/session", type="http", auth="public", methods=["GET"], csrf=False, save_session=False)
    def session(self, **kw):
        def go(env, _b):
            u = env.user
            return {"uid": u.id, "name": u.name, "roles": {k: u.has_group(g) for k, g in LEVELS.items()}}
        return self._run("any", go)

    # ------------------------------------------------------------------ pages & blocks
    @http.route(f"{P}/admin/pages", type="http", auth="public", methods=["GET"], csrf=False, save_session=False)
    def pages_list(self, **kw):
        return self._run("editor", lambda env, b: [p.to_admin_dict(False) for p in env["otm.website.page"].search([])])

    @http.route(f"{P}/admin/pages", type="http", auth="public", methods=["POST"], csrf=False, save_session=False)
    def pages_create(self, **kw):
        def go(env, b):
            page = env["otm.website.page"].create({"name": str(b.get("name") or "")[:120], "slug": str(b.get("slug") or ""),
                                                   "page_type": b.get("pageType") or "standard"})
            if isinstance(b.get("blocks"), list):
                page.set_layout(b["blocks"])
            return page.to_admin_dict()
        return self._run("editor", go, body=True)

    @http.route(f"{P}/admin/pages/<int:pid>", type="http", auth="public", methods=["GET"], csrf=False, save_session=False)
    def pages_get(self, pid, **kw):
        return self._run("editor", lambda env, b: self._page(env, pid).to_admin_dict())

    @http.route(f"{P}/admin/pages/<int:pid>", type="http", auth="public", methods=["PUT"], csrf=False, save_session=False)
    def pages_update(self, pid, **kw):
        def go(env, b):
            page = self._page(env, pid)
            if isinstance(b.get("meta"), dict):
                page.set_meta(b["meta"])
            if "blocks" in b:
                page.set_layout(b["blocks"])
            return page.to_admin_dict()
        return self._run("editor", go, body=True)

    @http.route(f"{P}/admin/pages/<int:pid>", type="http", auth="public", methods=["DELETE"], csrf=False, save_session=False)
    def pages_delete(self, pid, **kw):
        def go(env, b):
            page = self._page(env, pid)
            if not env.user.has_group(LEVELS["admin"]):
                raise AccessError("admin only")
            page.unlink()
            return {}
        return self._run("editor", go)

    @http.route(f"{P}/admin/pages/<int:pid>/<any(publish,unpublish,duplicate):action>", type="http", auth="public", methods=["POST"], csrf=False, save_session=False)
    def pages_action(self, pid, action, **kw):
        def go(env, b):
            page = self._page(env, pid)
            if action == "duplicate":
                return page.action_duplicate_page().to_admin_dict()
            (page.action_publish if action == "publish" else page.action_unpublish)()
            return page.to_admin_dict()
        return self._run("editor", go)

    # ------------------------------------------------------------------ settings
    @http.route(f"{P}/admin/settings", type="http", auth="public", methods=["GET"], csrf=False, save_session=False)
    def settings_get(self, **kw):
        return self._run("editor", lambda env, b: env["otm.website.setting"].admin_all())

    @http.route(f"{P}/admin/settings/publish", type="http", auth="public", methods=["POST"], csrf=False, save_session=False)
    def settings_publish(self, **kw):
        def go(env, b):
            env["otm.website.setting"].publish_all()
            return env["otm.website.setting"].admin_all()
        return self._run("editor", go)

    @http.route(f"{P}/admin/settings/<string:group>", type="http", auth="public", methods=["PUT"], csrf=False, save_session=False)
    def settings_put(self, group, **kw):
        def go(env, b):
            env["otm.website.setting"].set_draft(group, b.get("value"))
            return env["otm.website.setting"].admin_all()
        return self._run("editor", go, body=True)

    # ------------------------------------------------------------------ media
    @http.route(f"{P}/admin/media", type="http", auth="public", methods=["GET"], csrf=False, save_session=False)
    def media_list(self, **kw):
        return self._run("editor", lambda env, b: [m.to_dict() for m in env["otm.website.media"].search([], limit=500)])

    @http.route(f"{P}/admin/media", type="http", auth="public", methods=["POST"], csrf=False, save_session=False)
    def media_upload(self, **kw):
        return self._run("editor", lambda env, b: env["otm.website.media"].upload(str(b.get("name") or "")[:120], b.get("data"), str(b.get("alt") or "")).to_dict(), body=True)

    @http.route(f"{P}/admin/media/<int:mid>", type="http", auth="public", methods=["PUT", "DELETE"], csrf=False, save_session=False)
    def media_item(self, mid, **kw):
        def go(env, b):
            m = env["otm.website.media"].browse(mid).exists()
            if not m:
                raise MissingError("nf")
            if request.httprequest.method == "DELETE":
                m.unlink()
                return {}
            m.write({k: str(b[k])[:200] for k in ("name", "alt_text") if k in b} | ({"alt_text": str(b["alt"])[:200]} if "alt" in b else {}))
            return m.to_dict()
        return self._run("editor", go, body=request.httprequest.method == "PUT")

    # ------------------------------------------------------------------ leads
    def _lead_domain(self, args):
        dom = []
        if args.get("status"):
            dom.append(("status", "=", args["status"]))
        if args.get("service"):
            dom.append(("service", "=", args["service"][:80]))
        q = (args.get("search") or "").strip()[:80]
        if q:
            dom += ["|", "|", "|", ("name", "ilike", q), ("email", "ilike", q), ("phone", "ilike", q), ("company", "ilike", q)]
        return dom

    @http.route(f"{P}/admin/leads", type="http", auth="public", methods=["GET"], csrf=False, save_session=False)
    def leads_list(self, **kw):
        def go(env, b):
            a = request.httprequest.args
            limit, offset = min(max(_int(a.get("limit"), 25), 1), 100), max(_int(a.get("offset"), 0), 0)
            L, dom = env["otm.website.lead"], self._lead_domain(a)
            return {"total": L.search_count(dom), "items": [r.to_dict() for r in L.search(dom, limit=limit, offset=offset)]}
        return self._run("lead", go)

    @http.route(f"{P}/admin/leads/export", type="http", auth="public", methods=["GET"], csrf=False, save_session=False)
    def leads_export(self, **kw):
        if not self._server_ok():
            return _err("unauthorized", 401)
        env, resp = self._admin_env("lead")
        if resp:
            return resp
        rows = env["otm.website.lead"].search(self._lead_domain(request.httprequest.args), limit=10000)
        out, cols = io.StringIO(), ["submittedAt", "name", "email", "phone", "company", "service", "status", "sourcePage", "utmSource", "utmMedium", "utmCampaign", "message"]
        w = csv.writer(out)
        w.writerow(cols)
        for r in rows:
            d = r.to_dict()
            w.writerow([("'" + str(d[c])) if str(d[c])[:1] in "=+-@" else d[c] for c in cols])  # spreadsheet formula-injection guard
        return request.make_response(out.getvalue(), headers=[("Content-Type", "text/csv; charset=utf-8"), ("Content-Disposition", 'attachment; filename="enquiries.csv"'), ("Cache-Control", "no-store")])

    @http.route(f"{P}/admin/leads/<int:lid>", type="http", auth="public", methods=["GET", "PUT"], csrf=False, save_session=False)
    def lead_item(self, lid, **kw):
        def go(env, b):
            lead = env["otm.website.lead"].browse(lid).exists()
            if not lead:
                raise MissingError("nf")
            if request.httprequest.method == "PUT":
                vals = {}
                if "status" in b:
                    if b["status"] not in dict(env["otm.website.lead"]._fields["status"].selection):
                        raise ValidationError(_("Invalid status."))
                    vals["status"] = b["status"]
                if "notes" in b:
                    vals["notes"] = str(b["notes"])[:5000]
                lead.write(vals)
            return lead.to_dict()
        return self._run("lead", go, body=request.httprequest.method == "PUT")

    # ------------------------------------------------------------------ users / access
    @http.route(f"{P}/admin/users", type="http", auth="public", methods=["GET"], csrf=False, save_session=False)
    def users_list(self, **kw):
        return self._run("admin", lambda env, b: env["otm.website.access"].list_users())

    @http.route(f"{P}/admin/users/<int:uid>/roles", type="http", auth="public", methods=["PUT"], csrf=False, save_session=False)
    def users_roles(self, uid, **kw):
        return self._run("admin", lambda env, b: env["otm.website.access"].set_roles(uid, b.get("roles")), body=True)
