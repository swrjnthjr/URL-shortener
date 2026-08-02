# Build Plan

Status: nothing built yet — `package.json` exists, no `src/` code, no schema,
no Docker files. This plan sequences the work from zero.

Conventions for every milestone (see `CONTRIBUTING.md` / `rules.md`):
one feature branch + one PR per milestone (or per task, if a milestone is
large), Conventional Commits, `npm test` passing before merge.

---

## M0 — Project Scaffolding

- [ ] Create `src/routes/`, `src/controllers/`, `src/services/`,
      `src/middleware/`, `src/lib/` per the layout in `rules.md`.
- [ ] Add `server.js` (bootstraps Express, mounts routes, mounts the
      centralized error-handling middleware last).
- [ ] Add `app.js` exporting the Express app separately from `.listen()` so
      Supertest can bind it directly (see `TESTING.md` §5).
- [ ] Replace the placeholder `test` script in `package.json` with `jest`.
- [ ] Install core deps: `express`, `pg`, `redis` (or `ioredis`), `jest`,
      `supertest`, `nodemon` (dev).
- [ ] Add `.env.example` (placeholders only) and confirm `.env` is
      gitignored — see `SECURITY.md` §4.

## M1 — Base62 Encoding Library

- [ ] Implement `src/lib/base62.js`: `encode(id: number): string` and
      `decode(code: string): number`. Pure function, no I/O (architecture.md D1, D3).
- [ ] Reject invalid characters in `decode` with a clear error rather than
      silently producing a wrong ID.
- [ ] Jest unit tests: encode/decode are inverses across a range of IDs
      (0, 1, large numbers near `Number.MAX_SAFE_INTEGER`); invalid input
      throws (see `TESTING.md` §4).

## M2 — Database Layer — Done

- [x] Decide and document the migration approach: raw SQL files in
      `migrations/`, applied via `scripts/migrate.js` (tracks applied
      migrations in a `schema_migrations` table). No ORM/query builder.
- [x] Write the `urls` table schema (id, short_code, long_url, created_at)
      as a migration.
- [x] Write the `clicks` table schema (id, short_code, ts, referrer,
      user_agent) as a migration (architecture.md §6, D7). No FK to
      `urls.short_code` — it's populated in a second UPDATE after the
      initial INSERT, so it can be briefly null; an index is used instead.
- [x] Add `src/lib/db.js` — thin Postgres client wrapper (connection pool),
      framework-agnostic. Unit tested with `pg` mocked (query delegation,
      result passthrough, error propagation), 100% coverage.
- [ ] Confirm all queries are parameterized (no string-concatenated SQL) —
      `SECURITY.md` §2. (Applies once M3/M4 write actual queries.)

## M3 — Shorten Endpoint (`POST /api/shorten`) — Done

- [x] `src/routes/shorten.js` — route definition only, no logic.
- [x] `src/controllers/shortenController.js` — validates the input URL
      (well-formed, `http:`/`https:` only per `SECURITY.md` §2), wraps logic
      in `try/catch`, forwards errors via `next(err)`.
- [x] `src/services/urlService.js` — `createShortUrl(longUrl)`: inserts into
      Postgres, gets the auto-assigned `id`, encodes it via `base62.js`,
      writes the `short_code` back.
- [x] Jest unit tests for `urlService` with the DB client mocked.
- [x] Supertest test: valid URL -> 201 + short code; malformed URL -> 400.
      **Caveat**: `urlService` is mocked (no live Postgres in this
      environment yet) — these verify route/controller/error-handler
      wiring, not real DB behavior. True DB-backed integration tests
      (`TESTING.md` §5) are deferred until Docker Compose test infra exists
      (M9).

## M4 — Redirect Endpoint (`GET /:code`) — Done

- [x] `src/routes/redirect.js`.
- [x] `src/controllers/redirectController.js` — validates the code against
      the Base62 charset before decoding (`SECURITY.md` §2), wraps in
      `try/catch`.
- [x] Extend `urlService` with `resolveShortCode(code)`: decode -> ID,
      look up long URL, return 404 if not found.
- [x] Redirect with **301** (permanent) — see architecture.md D6 for the
      analytics-caching tradeoff this implies; accepted as-is.
- [x] Supertest test: known code -> 301 with correct `Location` header;
      unknown code -> 404. Same mocked-service caveat as M3.

## M5 — Click Analytics

- [ ] Add `src/services/analyticsService.js` — `recordClick(shortCode, {
      referrer, userAgent })`: inserts a row into the `clicks` table.
- [ ] Wire `recordClick` into the redirect flow in `urlService`, called on
      every successfully resolved request (cache hit or miss) — see
      architecture.md D7 for why this is decoupled from the cache path.
- [ ] Ensure a failure to record a click never blocks or fails the redirect
      itself (log and continue — the redirect response is the priority, not
      the analytics write).
- [ ] Jest unit tests for `analyticsService` with the DB client mocked.
- [ ] Supertest test confirming a redirect still inserts a `clicks` row
      (query the test DB directly after the request).
- [ ] (Optional, follow-up) `GET /api/stats/:code` — returns click count/
      recent events for a given short code. Not required for the initial
      analytics milestone; add only if explicitly scoped in later.

## M6 — Redis Cache Integration

- [ ] Add `src/lib/cache.js` — thin Redis client wrapper (`get`/`set` with
      TTL).
- [ ] Wire `resolveShortCode` to check Redis first, fall back to Postgres on
      miss, populate Redis after a DB hit (architecture.md §5, D2).
- [ ] Decide and document the TTL value (resolves the open question in
      `architecture.md` §9).
- [ ] Jest unit tests for both cache-hit and cache-miss branches with the
      Redis client mocked (`TESTING.md` §4).
- [ ] Supertest test confirming a second request for the same code doesn't
      re-hit Postgres (optional: verify via a DB call spy/counter).

## M7 — Frontend — Done

- [x] Static `public/index.html` — form to submit a long URL, displays the
      returned short URL.
- [x] Vanilla JS (`public/app.js`) — calls `POST /api/shorten` via `fetch`,
      renders the result (with a copy-to-clipboard button) or error message.
- [x] Minimal CSS (`public/style.css`) — no build step, no framework
      (architecture.md D5); supports light/dark via `prefers-color-scheme`.
- [x] Serve `public/` as static assets from Express (already wired in
      `src/app.js` since M0). Verified manually: `GET /`, `/style.css`,
      `/app.js` all return 200; `GET /:code` for an unrelated code still
      falls through to the redirect route correctly.
- Note: full end-to-end form submission (shorten -> real short URL) isn't
  testable yet in this environment without a running Postgres instance —
  verified the shorten endpoint fails gracefully (500 via the centralized
  error handler, not a crash) when no DB is reachable. Revisit once M9
  (Docker Compose) stands up local Postgres/Redis.

## M8 — Centralized Error Handling & Middleware — Done (pulled forward)

Implemented ahead of schedule in M3/M4 since the shorten/redirect
controllers needed somewhere to send caught errors via `next(err)`.

- [x] Global error-handling middleware, `src/middleware/errorHandler.js`,
      mounted last in `src/app.js`.
- [x] Consistent error response shape: `{ error: { message } }`.
- [x] Confirm no controller or service writes a raw 500 response directly —
      `shortenController`/`redirectController` both funnel exceptions to
      `next(err)`; validation failures (400/404) are returned directly since
      they're expected control flow, not exceptions.

## M9 — Dockerization

- [ ] `Dockerfile` for the Node app (multi-stage if useful, but keep simple
      given project scope).
- [ ] `docker-compose.yml` for local dev: app + Postgres + Redis.
- [ ] Confirm no secrets are baked into image layers — injected via env at
      runtime (`SECURITY.md` §4).
- [ ] Document manual deploy steps in `DEPLOYMENT.md`.

## M10 — Security Hardening Pass

- [ ] Add `helmet` (or manual headers) — `SECURITY.md` §5.
- [ ] Add rate limiting to `POST /api/shorten` (`SECURITY.md` §2, "Abuse /
      Rate Limiting").
- [ ] Run `npm audit`, resolve any advisories (`SECURITY.md` §3).
- [ ] Re-review input validation on both endpoints against the threat model
      in `SECURITY.md` §2 before considering this "done."

## M11 — Test Coverage Pass

- [ ] `npm test -- --coverage`, confirm `src/lib/` is fully covered and
      `src/services/` has strong coverage per `TESTING.md` §7.
- [ ] Fill any gaps found before closing out the plan.

---

## Deferred (Out of Scope for Now)

Per `architecture.md` §2 Non-Goals — revisit only if explicitly added here:
- User accounts / auth
- Custom aliases / vanity codes
- Link expiry
- Stats/reporting endpoint or dashboard on top of the `clicks` table (raw
  event recording is in scope via M5; querying/visualizing it is not)
- CI/CD pipeline (currently manual deploy per `architecture.md` §3)
