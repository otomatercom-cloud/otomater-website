"""Signed, short-lived admin tokens. A token dies on logout, expiry, password change or user deactivation."""
import base64
import binascii
import hashlib
import hmac
import json
import time

TOKEN_TTL = 8 * 3600
REVOKE_PARAM = "otomater_website.revoked_before.%s"


def _secret(env):
    return (env["ir.config_parameter"].sudo().get_param("database.secret") or "").encode()


def _sign(env, payload):
    return hmac.new(_secret(env), payload, hashlib.sha256).hexdigest()


def _pw_key(env, uid):
    env.flush_all()
    env.cr.execute("SELECT password FROM res_users WHERE id = %s", (int(uid),))
    row = env.cr.fetchone()
    return hashlib.sha256((row[0] if row and row[0] else "").encode()).hexdigest()[:16]


def make_token(env, uid, now=None):
    now = now or time.time()
    claims = {"u": int(uid), "i": round(now, 3), "e": int(now + TOKEN_TTL), "k": _pw_key(env, uid)}
    body = base64.urlsafe_b64encode(json.dumps(claims).encode()).decode()
    return f"{body}.{_sign(env, body.encode())}"


def read_token(env, token, now=None):
    """uid for a valid, unexpired, unrevoked token whose password fingerprint still matches; else None."""
    try:
        body, sig = token.split(".", 1)
        if not hmac.compare_digest(sig, _sign(env, body.encode())):
            return None
        data = json.loads(base64.urlsafe_b64decode(body.encode()))
        uid = int(data["u"])
        if data["e"] <= (now or time.time()):
            return None
        revoked = float(env["ir.config_parameter"].sudo().get_param(REVOKE_PARAM % uid) or 0)
        if float(data["i"]) <= revoked:
            return None
        return uid if hmac.compare_digest(str(data["k"]), _pw_key(env, uid)) else None
    except (ValueError, KeyError, TypeError, AttributeError, binascii.Error):
        return None


def revoke_user(env, uid):
    env["ir.config_parameter"].sudo().set_param(REVOKE_PARAM % int(uid), str(time.time() + 1))
