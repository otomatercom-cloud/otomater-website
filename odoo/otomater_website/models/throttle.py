from odoo import api, fields, models


class OtmWebsiteThrottle(models.Model):
    """Tiny fixed-window counter used for login brute-force and enquiry rate limits."""
    _name = "otm.website.throttle"
    _description = "Website Rate Limit Counter"

    _key_uniq = models.Constraint("unique(key)", "Throttle key must be unique.")

    key = fields.Char(required=True, index=True)
    count = fields.Integer(default=0)
    window_start = fields.Datetime(required=True, default=fields.Datetime.now)

    @api.model
    def is_blocked(self, key, limit, window_s):
        self.env.cr.execute(
            "SELECT count FROM otm_website_throttle WHERE key = %s AND window_start > (now() at time zone 'utc') - make_interval(secs => %s)",
            (key, window_s))
        row = self.env.cr.fetchone()
        return bool(row and row[0] >= limit)

    @api.model
    def hit(self, key, window_s):
        """Atomically count one event; restarts the window when the previous one expired. Returns the new count."""
        self.env.cr.execute(
            """INSERT INTO otm_website_throttle (key, count, window_start, create_date, write_date)
               VALUES (%(k)s, 1, now() at time zone 'utc', now() at time zone 'utc', now() at time zone 'utc')
               ON CONFLICT (key) DO UPDATE SET
                 count = CASE WHEN otm_website_throttle.window_start > (now() at time zone 'utc') - make_interval(secs => %(w)s)
                              THEN otm_website_throttle.count + 1 ELSE 1 END,
                 window_start = CASE WHEN otm_website_throttle.window_start > (now() at time zone 'utc') - make_interval(secs => %(w)s)
                              THEN otm_website_throttle.window_start ELSE now() at time zone 'utc' END
               RETURNING count""", {"k": key, "w": window_s})
        return self.env.cr.fetchone()[0]

    @api.model
    def reset(self, key):
        self.env.cr.execute("DELETE FROM otm_website_throttle WHERE key = %s", (key,))

    @api.autovacuum
    def _gc_old_counters(self):
        self.env.cr.execute("DELETE FROM otm_website_throttle WHERE window_start < (now() at time zone 'utc') - interval '1 day'")
