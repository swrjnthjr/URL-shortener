**1. Division of work.** I made the product and process decisions; the AI
did the drafting and implementation inside those constraints. I decided the
core feature (Base62 ID-encoded URL shortener), the exact stack (Express +
vanilla JS frontend, Postgres as source of truth, Redis as cache), the git
workflow (GitHub Flow + Conventional Commits, one branch per milestone), and
the build sequence — documentation first (`architecture.md`,
`CONTRIBUTING.md`, `TESTING.md`, `SECURITY.md`), then a milestone-by-
milestone build plan, then implementation feature by feature. Where a
design question came up mid-build (redirect status code, click-analytics
scope, migration tooling, whether to upgrade Express to fix audit
advisories), I made the call and the AI executed and documented it. The AI
wrote the actual code, tests, Docker setup, and CI-adjacent tooling
(ESLint/Prettier/Husky) inside that plan, and was expected to run and verify
its own work (tests, lint, and eventually a real Docker Compose stack)
rather than just producing code.

---

**2. What I overrode.** The clearest override was the redirect status code:
the AI recommended 302 (temporary) because a 301 can be cached by browsers/
CDNs and undercount repeat clicks against our own analytics — I kept 301
anyway, because a short link is meant to be a permanent alias, and I'd
rather accept some undercounting than break that semantic. Similarly, when
`npm audit` flagged advisories inside Express 4's own dependency tree, I
chose to accept and document the exception rather than have the AI upgrade
to Express 5, since the project deliberately pins Express 4 to demonstrate
manual async error handling. Separately, I made a couple of direct hotfix
commits to `main` myself (SSL config for a Render deploy) outside the
usual branch/PR flow to unblock a live deployment quickly — that's the one
place I bypassed the process I'd set up. It turned out to be too broad a
fix (it made SSL unconditional and broke local Docker Compose), which the
AI caught later while verifying an unrelated UI change end-to-end and
fixed by making it opt-in via an env var.

---

**3. Biggest trade-offs.**

- **301 vs. 302 redirects** — permanent link semantics vs. click-analytics
  accuracy. Took the semantic correctness, accepted the undercounting.
- **Mocked vs. real integration tests** — for most of the build there was
  no live Postgres/Redis available, so Supertest "integration" tests mocked
  the service layer instead of hitting a real database, with the caveat
  written directly into the test-plan docs rather than silently treated as
  equivalent to `TESTING.md`'s stated strategy. Real DB verification was
  deferred until the Docker Compose milestone existed, then used
  retroactively to catch a real bug (Postgres returning `BIGSERIAL` ids as
  strings, not numbers) that the mocks had missed entirely.
- **Raw SQL migrations vs. an ORM** — chose plain SQL files plus a small
  custom runner over Prisma/Knex, favoring transparency and zero extra
  dependencies over convenience, consistent with the project's minimal-
  dependency stance.

---

**4. With another day.** I'd finish **M6 (Redis cache in front of the
redirect path)** — the most conspicuous gap, since Redis is provisioned in
Docker Compose but not yet used. I'd also replace the mocked-service
Supertest tests with real DB-backed integration tests now that Docker
Compose exists, add a small CI pipeline (GitHub Actions running lint/test/
audit) instead of relying solely on the local Husky pre-commit hook, and
make the rate limiter's store Redis-backed rather than in-memory so it
survives restarts and works correctly across multiple app instances.
