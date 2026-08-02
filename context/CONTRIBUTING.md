# Contributing

## 1. Prerequisites

- Node.js v20.12 LTS
- Docker (for Postgres/Redis locally, and for building the app image)
- `npm install` to install dependencies

## 2. Branching Model — GitHub Flow

- `main` is always deployable. No direct commits to `main`.
- Create a short-lived feature branch off `main` for every change:
  ```
  git checkout -b <type>/<short-description>
  ```
  Examples: `feat/base62-encoder`, `fix/redirect-404-handling`,
  `chore/update-jest-config`.
- Open a Pull Request into `main` as soon as the branch is ready for review.
- Merge via **squash merge** so `main` history stays one commit per PR.
- Delete the branch after merge.

There is no `develop` branch and no release branches — deployment is manual,
so `main` reflects what's actually running.

## 3. Commit Messages — Conventional Commits

Format:
```
<type>(<optional scope>): <short summary>

<optional body>
```

**Types**
| Type       | Use for                                              |
|------------|-------------------------------------------------------|
| `feat`     | A new feature (e.g., `feat(api): add POST /shorten`)   |
| `fix`      | A bug fix                                              |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test`     | Adding or correcting tests                             |
| `docs`     | Documentation only changes                             |
| `chore`    | Tooling, dependencies, config — no production code change |
| `perf`     | Performance improvement                                |

**Rules**
- Summary in imperative mood, lowercase, no trailing period:
  `fix(redirect): handle missing short code`.
- Keep the summary under 72 characters.
- One logical change per commit. Don't bundle unrelated fixes into a feature
  commit.
- Breaking changes: add `!` after the type/scope (`feat(api)!: ...`) and
  explain the break in the body.

## 4. Pull Requests

- PR title follows the same Conventional Commits format as the squash commit
  will use — it becomes the commit message.
- PR description should cover:
  - What changed and why.
  - How it was tested (which Jest/Supertest suites, manual verification if
    any).
  - Any follow-up work intentionally left out of scope.
- Keep PRs small and focused on one concern (one route, one service, one
  fix). Large PRs should be flagged and split if practical.
- All PRs must pass `npm test` before merge.

## 5. Code Style

Follow `context/rules.md` for the authoritative conventions. Highlights
relevant to reviewers:
- CommonJS only (`require`/`module.exports`) — no ESM.
- `const` over `let`, never `var`.
- `async/await` only — no mixing with `.then().catch()` or callbacks.
- Strict layering: `routes/` -> `controllers/` -> `services/` -> `lib/`.
  `services/` must never import Express or reference `req`/`res`.
- Every async controller wraps logic in `try/catch` and calls `next(err)` on
  failure — no raw error handling inside services or routes.
- Keep modules under 200 lines; extract shared logic into `src/lib/`.

## 6. Linting & Formatting

- **ESLint** (`eslint.config.js`) enforces the guardrails in §5 that can be
  checked mechanically (no `var`, `prefer-const`, `eqeqeq`) plus JS
  correctness rules. Run `npm run lint` / `npm run lint:fix`.
- **Prettier** (`.prettierrc.json`) owns formatting (quotes, semicolons,
  line width, trailing commas) — don't hand-format or debate style in
  review, run `npm run format` / `npm run format:check`.
- `eslint-config-prettier` disables any ESLint stylistic rules that would
  conflict with Prettier, so the two never fight over the same concern.
- Scope: both tools run against `src/`, `test/`, `scripts/`, and `public/`.
  `context/`, `README.md` (docs) and `.claude/` (harness config) are
  intentionally excluded from Prettier — they're prose/config, not code
  style.
- **Enforced automatically**: a Husky `pre-commit` hook (`.husky/pre-commit`)
  runs `npm run lint` and `npm run format:check` on every commit. A commit
  with lint errors or unformatted files is rejected locally — you won't
  find out only after opening a PR. Run `npm run lint:fix` / `npm run
  format` to fix and re-commit.
- The hook is installed automatically via the `prepare` script the first
  time anyone runs `npm install` after cloning (standard Husky v9 setup) —
  no manual setup step required.

## 7. Before Opening a PR

- [ ] `npm test` passes locally.
- [ ] `npm run lint` passes with no errors (also enforced by the pre-commit
      hook).
- [ ] `npm run format:check` passes (also enforced by the pre-commit hook).
- [ ] New/changed logic in `src/services/` or `src/lib/` has corresponding
      Jest unit tests.
- [ ] New/changed routes have Supertest coverage.
- [ ] No stray `console.log` debugging left in.
- [ ] Commit messages and PR title follow Conventional Commits.
