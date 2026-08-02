# Feature Tracker

Tracks implementation progress against the milestones defined in
`build-plan.md`. Update the status and PR/branch columns as work lands —
this file is the single source of truth for "what's actually built" vs.
`build-plan.md`, which is the plan for what *should* be built.

**Status legend**: `Not started` / `In progress` / `In review` / `Done`

| # | Milestone | Status | Branch / PR | Notes |
|---|-----------|--------|--------------|-------|
| M0 | Project Scaffolding | Not started | — | Folders, `server.js`/`app.js`, deps, jest config |
| M1 | Base62 Encoding Library | Not started | — | `src/lib/base62.js` + unit tests |
| M2 | Database Layer | Not started | — | `urls` + `clicks` schema, `src/lib/db.js` |
| M3 | Shorten Endpoint (`POST /api/shorten`) | Not started | — | |
| M4 | Redirect Endpoint (`GET /:code`, 301) | Not started | — | |
| M5 | Click Analytics | Not started | — | `clicks` table writes, decoupled from cache path |
| M6 | Redis Cache Integration | Not started | — | |
| M7 | Frontend | Not started | — | Static HTML/CSS/JS |
| M8 | Centralized Error Handling & Middleware | Not started | — | |
| M9 | Dockerization | Not started | — | |
| M10 | Security Hardening Pass | Not started | — | helmet, rate limiting, `npm audit` |
| M11 | Test Coverage Pass | Not started | — | |

## Unit Test Coverage by Module

Tracks unit test status independently, since a milestone can be "Done" for
functionality but still owe test coverage per `TESTING.md`.

| Module | Unit Tests | Integration Tests (Supertest) |
|--------|------------|-------------------------------|
| `src/lib/base62.js` | Not started | N/A (pure function) |
| `src/lib/db.js` | Not started | N/A |
| `src/lib/cache.js` | Not started | N/A |
| `src/services/urlService.js` | Not started | Not started |
| `src/services/analyticsService.js` | Not started | Not started |
| `src/controllers/shortenController.js` | N/A (covered via integration) | Not started |
| `src/controllers/redirectController.js` | N/A (covered via integration) | Not started |

## Log

- 2026-08-02 — Tracker created. No features implemented yet; starting with
  M0 (scaffolding) and M1 (Base62 library + unit tests).
