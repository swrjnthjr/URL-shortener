# Security

## 1. Reporting a Vulnerability

This is a portfolio project without a dedicated security team or bug bounty.
If you find a vulnerability:
- Do not open a public GitHub issue with exploit details.
- Open a private report via GitHub's "Report a vulnerability" (Security
  Advisories) feature on the repo, or contact the maintainer directly.
- Include: affected endpoint/file, reproduction steps, and potential impact.

There's no formal SLA, but reports will be acknowledged and triaged as soon
as possible given this is a single-maintainer project.

## 2. Threat Model Specific to a URL Shortener

A URL shortener's core function — accepting arbitrary input and redirecting
to it — has a few well-known risk areas that any implementation here must
account for:

**Open Redirect**
- The service's entire purpose is redirecting to user-supplied URLs, so
  "open redirect" isn't a bug in the usual sense — but it means this service
  must never be trusted as a validator of destination safety by other
  systems, and the frontend should show the destination (or a confirmation
  interstitial) rather than silently redirecting for unfamiliar codes if
  this is ever exposed beyond a portfolio context.

**SSRF via URL submission**
- If the service is ever extended to *fetch* the submitted URL (e.g., to
  generate a preview, check liveness, or follow redirects server-side),
  that introduces SSRF risk — it must not be allowed to request internal/
  private IP ranges (`127.0.0.1`, `169.254.169.254`, RFC1918 ranges, etc.).
  As of this version, the service does not fetch submitted URLs — it only
  stores and redirects — so this risk is currently theoretical but must be
  re-evaluated if that changes.

**Input Validation**
- All submitted URLs must be validated before storage:
  - Well-formed URL (reject unparseable input).
  - Restrict to `http:`/`https:` protocols — reject `javascript:`, `data:`,
    `file:`, etc., which could be used for XSS if ever reflected/rendered
    rather than redirected.
- Short codes accepted in `GET /:code` must be validated against the
  expected Base62 charset before attempting to decode — reject anything
  else with 400/404 rather than passing untrusted input into decoding logic.

**Injection**
- All Postgres queries must use parameterized queries / prepared statements
  (via the `pg` driver's parameterized query support or an ORM/query
  builder). Never build SQL via string concatenation with user input.

**Abuse / Rate Limiting**
- `POST /api/shorten` is rate-limited per IP via `express-rate-limit`
  (`src/middleware/rateLimiter.js`) to prevent the service being used to
  mass-generate short links (spam, phishing redirection). Default: 20
  requests per 15-minute window, configurable via `RATE_LIMIT_MAX_REQUESTS`
  / `RATE_LIMIT_WINDOW_MS`. Verified against a real Docker Compose stack:
  the 20th request onward returns `429`. `GET /:code` is intentionally not
  rate-limited — it's the core redirect path and limiting it would degrade
  the product for legitimate traffic; abuse there is bounded by the short
  code space itself, not by request volume.
- Uses `req.ip` for the per-client key, which depends on Express's `trust
  proxy` setting. Not configured yet — if this is ever deployed behind a
  reverse proxy/load balancer, `app.set('trust proxy', ...)` must be set
  correctly, or every request will appear to come from the proxy's IP and
  the limit will apply globally instead of per-client.

## 3. Dependency Auditing

- Run `npm audit` before merging any PR that changes `package.json` /
  `package-lock.json`.
- Fix advisories via `npm audit fix` where possible; avoid `--force` unless
  the resulting version bump has been manually reviewed for breaking changes.
- Since there is no CI pipeline yet, dependency auditing is a manual step
  in the PR checklist (see `CONTRIBUTING.md`) rather than an automated gate.
- Prefer well-maintained, minimal-dependency packages given the small scope
  of this project — avoid adding a library for something a short utility
  function in `src/lib/` can do.

**Known accepted exception — Express 4.x transitive advisories**
Express is pinned to `4.19.2` (see `context/rules.md`) specifically because
Express 4 does not natively catch async route-handler errors, which is used
deliberately to demonstrate the `try/catch` + `next(err)` pattern documented
in `rules.md` and `CONTRIBUTING.md`. As a result, `npm audit` reports 7
advisories (body-parser, path-to-regexp, qs, send/serve-static, cookie) that
live inside Express 4's own pinned dependency tree — `npm audit fix` cannot
resolve them without a major-version bump to Express 5. These are accepted
as-is for this portfolio project. Re-evaluate if Express is ever upgraded to
5.x, or if this service handles untrusted traffic beyond a portfolio demo.

## 4. Secrets & Configuration

- Postgres and Redis connection strings, and any other credentials, are
  supplied via environment variables — never committed to the repo.
- `.env` is gitignored. `.env.example` (with placeholder values only) is
  committed so contributors know which variables are required — see
  `DEPLOYMENT.md`.
- Docker images must not bake secrets into layers (no `ARG`/`ENV` with real
  credentials in the `Dockerfile`) — inject at runtime via `docker run -e`
  or a compose env file that is itself gitignored.

## 5. Transport & Headers

- Production deployment should sit behind TLS termination (reverse proxy or
  hosting platform) — the app itself does not implement HTTPS.
- Baseline security headers are applied via `helmet()` (mounted first in
  `src/app.js`, before body-parsing/static/routes): `X-Content-Type-Options:
  nosniff`, `X-Frame-Options`, a default `Content-Security-Policy`
  (`default-src 'self'`, appropriate for the static frontend since it has
  no third-party scripts/styles/fonts), and `X-Powered-By` removed.
  Verified against a real Docker Compose stack, including that static
  assets (`/`, `/app.js`, `/style.css`) still load correctly under the
  default CSP.
