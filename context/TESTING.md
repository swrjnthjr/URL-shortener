# Testing

## 1. Stack

- **Jest** — test runner, assertions, mocking.
- **Supertest** — HTTP-level integration tests against the Express app.

## 2. Test Types & Where They Live

| Type        | Target                                   | Location                     | Tooling            |
|-------------|-------------------------------------------|-------------------------------|---------------------|
| Unit        | `src/lib/` (e.g. `base62.js`), `src/services/` | `test/unit/**` or co-located `*.test.js` | Jest |
| Integration | `src/routes/` + `src/controllers/` end-to-end via HTTP | `test/integration/**`         | Jest + Supertest    |

Rule of thumb: if the code touches `req`/`res` or the network, it's an
integration test. If it's a pure function or a service with mocked
dependencies, it's a unit test.

## 3. Commands

```bash
npm test              # run the full suite
npm test -- --watch   # watch mode during development
npm test -- --coverage
npm test -- path/to/file.test.js   # run a single file
```

`package.json` currently has a placeholder `test` script — this must be
updated to run Jest once the test suite is scaffolded:
```json
"scripts": {
  "test": "jest"
}
```

## 4. Unit Testing Guidelines

- **`src/lib/base62.js`**: test `encode`/`decode` are inverses across a range
  of IDs (0, 1, small numbers, large numbers near `Number.MAX_SAFE_INTEGER`),
  and that decoding invalid characters throws/returns a clear error.
- **`src/services/`**: services must never import Express, so they can be
  unit tested by mocking their dependencies directly:
  - Mock the Postgres client/query function (e.g. `jest.mock('../db')`).
  - Mock the Redis client (`get`/`set`) to test cache-hit and cache-miss
    branches independently.
- Assert both the happy path and error path (e.g. DB throws -> service
  rejects with the expected error, doesn't swallow it).

## 5. Integration Testing Guidelines (Supertest)

- Spin up the Express `app` (exported separately from the server bootstrap
  that calls `.listen()`, so Supertest can bind it without a real port).
- Cover, per route:
  - **`POST /api/shorten`**: valid URL -> 201 + short code in response;
    missing/malformed URL -> 400.
  - **`GET /:code`**: known code -> 302 with correct `Location` header;
    unknown code -> 404.
- Use a real or dockerized test instance of Postgres/Redis for these tests
  rather than mocking the DB/cache — the point of an integration test is to
  verify the wiring between layers, not re-test unit logic.
- Reset/seed test data between test cases (e.g. truncate the `urls` table
  in `beforeEach`, flush the test Redis DB) so tests don't depend on
  execution order.

## 6. Mocking Conventions

- Unit tests: mock at the module boundary the service depends on (DB client,
  Redis client), never mock the service under test itself.
- Integration tests: avoid mocking Postgres/Redis — use real (containerized)
  instances pointed at by test-specific env vars (see `DEPLOYMENT.md` /
  `.env.test`).
- Don't mix the two within a single test — a test is either a pure unit test
  with everything mocked, or an integration test hitting real dependencies.

## 7. Coverage Expectations

- No hard coverage gate is enforced yet, but new code should not lower
  existing coverage.
- Priority order for coverage: `src/lib/` (100% — pure functions, cheap to
  fully cover) > `src/services/` > `src/controllers/` > `src/routes/`
  (thin, exercised via integration tests).
- Run `npm test -- --coverage` before opening a PR that touches core logic
  and include a summary in the PR description (per `CONTRIBUTING.md`).

## 8. CI Note

There is no CI pipeline yet (deploy is manual via Docker). Until CI exists,
`npm test` passing locally is the merge gate — see the pre-PR checklist in
`CONTRIBUTING.md`.
