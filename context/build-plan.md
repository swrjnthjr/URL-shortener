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
- [x] Confirm all queries are parameterized (no string-concatenated SQL) —
      `SECURITY.md` §2. Verified in M3/M4's actual queries (`urlService.js`).
- [x] `migrations/003_set_urls_id_start.sql` — restarts the `urls_id_seq`
      sequence at `100001` so early short codes aren't single/double-digit.
      A separate migration rather than editing `001_create_urls.sql`, since
      that one may already be applied elsewhere. Verified against a fresh
      Docker Compose stack: first inserted row got `id=100001`, encoded to
      `q0V`.

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

## M5 — Click Analytics — Done

- [x] Add `src/services/analyticsService.js` — `recordClick(shortCode, {
      referrer, userAgent })`: inserts a row into the `clicks` table.
- [x] Wire `recordClick` into the redirect flow — called from
      `redirectController` (not `urlService`) after a successfully resolved
      request, since it needs `req` for the `referer`/`user-agent` headers.
      Decoupled from the cache path (architecture.md D7) — no cache exists
      yet (M6), so this is a non-issue for now but the ordering already
      matches the intended design.
- [x] Ensure a failure to record a click never blocks or fails the redirect
      itself: `recordClickSafely()` in `redirectController.js` awaits
      `recordClick` inside its own `try/catch` and only logs on failure —
      verified with a test that rejects `recordClick` and asserts the
      redirect still returns 301.
- [x] Jest unit tests for `analyticsService` with the DB client mocked.
- [x] Supertest test confirming a redirect calls `recordClick` with the
      right `shortCode`/`referrer`/`userAgent`. Same caveat as M3/M4:
      `analyticsService` is mocked, no live Postgres in this environment —
      a real "row actually inserted" check is deferred to M9.
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

## M9 — Dockerization — Done

- [x] `Dockerfile` for the Node app — single-stage (`node:20.12-alpine`,
      matching `rules.md`'s pinned Node version), kept simple given project
      scope. `npm ci --omit=dev --ignore-scripts` (skips `prepare`/Husky —
      not needed in the image).
- [x] `docker-compose.yml` for local dev: `app` + `postgres:16-alpine` +
      `redis:7-alpine`, with healthchecks gating app startup. Postgres
      mapped to host port `5433` (not `5432`) to avoid colliding with a
      local Postgres install encountered during testing.
- [x] Confirm no secrets are baked into image layers — the `Dockerfile`
      only `COPY`s source directories (no `.env`), and `.dockerignore`
      excludes `.env`/`.git`/`context/`/`test/`. Compose's Postgres/Redis
      credentials are dev-only defaults, not real secrets (`SECURITY.md`
      §4).
- [x] Document manual deploy steps in `context/DEPLOYMENT.md`.
- [x] **Real end-to-end verification** (first time this was possible with a
      live Postgres/Redis): `docker compose up -d --build`, then exercised
      `POST /api/shorten` -> `GET /:code` -> queried the `urls`/`clicks`
      tables directly via `psql`. This caught a real bug — `pg` returns
      `BIGSERIAL`/`int8` columns as **strings**, not numbers, so
      `base62.encode(id)` was throwing on every real insert (unit tests had
      mocked the DB with a JS number, masking this). Fixed in
      `urlService.js` by coercing with `Number(...)` before encoding, with
      a comment explaining why; the unit test mock was also corrected to
      return a string id so this regression class can't silently reappear.

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

## M12 — Linting & Formatting — Done

- [x] Install ESLint 9 (flat config, `eslint.config.js`) + Prettier 3.
- [x] `eslint-config-prettier` to disable ESLint stylistic rules that would
      conflict with Prettier.
- [x] `eslint-plugin-jest` + a `test/**` override with Jest globals.
- [x] `.prettierrc.json` / `.prettierignore` — scoped to `src/`, `test/`,
      `scripts/`, `public/`; `context/` (docs) and `.claude/` (harness
      config) intentionally excluded.
- [x] `npm run lint` / `lint:fix` / `format` / `format:check` scripts.
- [x] Ran across the existing codebase: one real finding (Express error
      middleware's unused `next` — required by its 4-arg signature, fixed
      with a scoped `eslint-disable-next-line`), four files reformatted by
      Prettier (whitespace-only, verified via `git diff`).
- [x] Added to the pre-PR checklist in `CONTRIBUTING.md`.
- [x] Husky `pre-commit` hook (`.husky/pre-commit`) runs `npm run lint`
      and `npm run format:check` on every commit, so violations are caught
      locally before a PR is even opened. Verified manually: a commit with
      an ESLint error was rejected; a clean commit passed. Installed via
      the standard `prepare` script (`npm install` wires it up
      automatically, no manual step).

---

## Deferred (Out of Scope for Now)

Per `architecture.md` §2 Non-Goals — revisit only if explicitly added here:
- User accounts / auth
- Custom aliases / vanity codes
- Link expiry
- Stats/reporting endpoint or dashboard on top of the `clicks` table (raw
  event recording is in scope via M5; querying/visualizing it is not)
- CI/CD pipeline (currently manual deploy per `architecture.md` §3)
