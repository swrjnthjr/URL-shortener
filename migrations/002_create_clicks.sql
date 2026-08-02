-- No FK on short_code: urls.short_code is populated in a second UPDATE
-- after the initial INSERT (id -> base62 encode -> short_code), so it
-- can be briefly null; an index is sufficient since clicks are only ever
-- written after a url is fully resolved.
CREATE TABLE IF NOT EXISTS clicks (
  id BIGSERIAL PRIMARY KEY,
  short_code VARCHAR(16) NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  referrer TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_clicks_short_code ON clicks(short_code);
