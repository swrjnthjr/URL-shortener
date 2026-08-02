# Feature Tracker

Tracks implementation progress against the milestones defined in
`build-plan.md`. Update the status and PR/branch columns as work lands —
this file is the single source of truth for "what's actually built" vs.
`build-plan.md`, which is the plan for what *should* be built.

**Status legend**: `Not started` / `In progress` / `In review` / `Done`

| # | Milestone | Status | Branch / PR | Notes |
|---|-----------|--------|--------------|-------|
| M0 | Project Scaffolding | Done | `feat/scaffolding-and-base62` | Folders, `server.js`/`app.js`, deps, jest config |
| M1 | Base62 Encoding Library | Done | `feat/scaffolding-and-base62` | `src/lib/base62.js` + unit tests, 100% coverage |
| M2 | Database Layer | Done | `feat/database-layer` | Raw SQL migrations + `src/lib/db.js`, 100% unit coverage |
| M3 | Shorten Endpoint (`POST /api/shorten`) | Done | `feat/shorten-and-redirect` | Service mocked in tests — no live Postgres yet |
| M4 | Redirect Endpoint (`GET /:code`, 301) | Done | `feat/shorten-and-redirect` | Service mocked in tests — no live Postgres yet |
| M5 | Click Analytics | Not started | — | `clicks` table writes, decoupled from cache path |
| M6 | Redis Cache Integration | Not started | — | |
| M7 | Frontend | Done | `feat/frontend` | Static HTML/CSS/JS; verified manually against a local server (no DB yet) |
| M8 | Centralized Error Handling & Middleware | Done | `feat/shorten-and-redirect` | Pulled forward — needed by M3/M4 controllers |
| M9 | Dockerization | Not started | — | |
| M10 | Security Hardening Pass | Not started | — | helmet, rate limiting, `npm audit` |
| M11 | Test Coverage Pass | Not started | — | |
| M12 | Linting & Formatting | Done | `chore/eslint-prettier` | ESLint 9 (flat config) + Prettier 3 |

## Unit Test Coverage by Module

Tracks unit test status independently, since a milestone can be "Done" for
functionality but still owe test coverage per `TESTING.md`.

| Module | Unit Tests | Integration Tests (Supertest) |
|--------|------------|-------------------------------|
| `src/lib/base62.js` | Done (100% coverage) | N/A (pure function) |
| `src/lib/db.js` | Done (100% coverage) | N/A |
| `src/lib/cache.js` | Not started | N/A |
| `src/lib/urlValidator.js` | Done (100% coverage) | N/A (pure function) |
| `src/lib/shortCodeValidator.js` | Done (100% coverage) | N/A (pure function) |
| `src/middleware/errorHandler.js` | Done (100% coverage) | N/A |
| `src/services/urlService.js` | Done (100% coverage) | N/A |
| `src/services/analyticsService.js` | Not started | Not started |
| `src/controllers/shortenController.js` | N/A (covered via integration) | Done (service mocked — see note below) |
| `src/controllers/redirectController.js` | N/A (covered via integration) | Done (service mocked — see note below) |

## Log

- 2026-08-02 — Tracker created. No features implemented yet; starting with
  M0 (scaffolding) and M1 (Base62 library + unit tests).
- 2026-08-02 — M0 and M1 done. Express pinned to 4.19.2 per `rules.md`;
  resulting `npm audit` advisories (all inside Express 4's own dependency
  tree) documented as an accepted exception in `SECURITY.md`.
- 2026-08-02 — M2 done. Migration approach resolved: raw SQL files run by
  `scripts/migrate.js`, no ORM. `db.js` is a thin `pg` Pool wrapper, unit
  tested with `pg` mocked.
- 2026-08-02 — M3, M4, and M8 (pulled forward) done, 60 tests passing,
  100% coverage. Supertest tests for the two endpoints mock `urlService`
  rather than hitting a real Postgres instance — no live DB is available
  in this environment yet. True DB-backed integration tests per
  `TESTING.md` §5 are deferred until Docker Compose test infra exists
  (tracked under M9 in `build-plan.md`).
- 2026-08-02 — M7 done. Static frontend (form + fetch + copy button),
  manually verified against a local server: static assets serve
  correctly and the redirect route isn't shadowed. Full shorten-to-
  redirect flow still needs a live Postgres to test end-to-end (M9).
- 2026-08-02 — M12 done. ESLint 9 + Prettier 3 added; existing code now
  passes both clean. Added to the pre-PR checklist in `CONTRIBUTING.md`.
