# Deployment

## 1. Overview

Deployment is currently **manual** (no CI/CD pipeline — see `architecture.md`
§3). The app is containerized with a single `Dockerfile`; `docker-compose.yml`
wires it up with Postgres and Redis for local development. Production
deployment reuses the same image, pointed at real `DATABASE_URL`/`REDIS_URL`
values via environment variables.

## 2. Local Development (Docker Compose)

```bash
docker compose up -d --build
```

This starts three containers:

| Service    | Image             | Notes |
|------------|--------------------|-------|
| `app`      | built from `Dockerfile` | Runs migrations (`node scripts/migrate.js`) then starts the server (`node server.js`) — see `command` in `docker-compose.yml`. |
| `postgres` | `postgres:16-alpine` | Dev-only credentials (`url_shortly`/`url_shortly`) set directly in `docker-compose.yml`. Host port `5433` (not `5432`) to avoid colliding with a local Postgres install. |
| `redis`    | `redis:7-alpine`   | Host port `6379`. Not yet used by the app (M6 — Redis Cache Integration — is still pending); included now so the full stack is available. |

The app container waits for both `postgres` and `redis` to report healthy
(via `depends_on: condition: service_healthy`) before starting.

Verify it's working:

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/very/long/path"}'
# => {"shortCode":"...","shortUrl":"http://localhost:3000/..."}

curl -i http://localhost:3000/<shortCode>
# => HTTP/1.1 301 Moved Permanently
```

Tear down (and wipe the Postgres volume, e.g. between test runs):

```bash
docker compose down -v
```

## 3. Environment Variables

See `.env.example` for the full list. In Docker Compose, these are set
directly in `docker-compose.yml`'s `environment:` block rather than an
`.env` file, since the dev-only Postgres/Redis credentials there aren't
real secrets (see `SECURITY.md` §4).

| Variable | Purpose |
|----------|---------|
| `PORT` | Port the Express server listens on (default `3000`). |
| `DATABASE_URL` | Postgres connection string, consumed by `src/lib/db.js` and `scripts/migrate.js`. |
| `DB_SSL` | Set to `true` to connect over SSL with `rejectUnauthorized: false` — needed for managed Postgres providers (e.g. Render) whose connection proxy doesn't pass public CA chain validation. Leave unset/`false` for local Docker Compose — that Postgres doesn't support SSL at all, and setting this to `true` there causes a hard connection failure. |
| `REDIS_URL` | Redis connection string (not yet consumed by app code — reserved for M6). |
| `REDIS_CACHE_TTL_SECONDS` | Cache TTL for redirect lookups (not yet consumed — reserved for M6). |

## 4. Manual Production Deploy

1. Build the image: `docker build -t url-shortly:<tag> .`
2. Push it to wherever the target host pulls images from.
3. On the host, run migrations once against the production database:
   ```bash
   docker run --rm -e DATABASE_URL=<prod-url> -e DB_SSL=true url-shortly:<tag> node scripts/migrate.js
   ```
   (`DB_SSL=true` is typically required for managed Postgres providers —
   see the `DB_SSL` row above.)
4. Start the app container with real environment variables injected at
   runtime (via the platform's secret manager, `docker run -e`, or an
   untracked `.env` file passed via `--env-file`) — never baked into the
   image (`SECURITY.md` §4).
5. Put the container behind TLS termination (reverse proxy or the hosting
   platform) — the app itself does not implement HTTPS (`SECURITY.md` §5).

## 5. Troubleshooting

- **App container exits immediately / connection refused errors**: usually
  means Postgres/Redis weren't ready yet. `depends_on` with
  `condition: service_healthy` should prevent this in Compose, but if
  running the image standalone, ensure the DB is reachable before starting.
- **`SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`**:
  `DATABASE_URL` is unset or malformed — `pg` falls back to ambient
  `PG*` env vars / local socket defaults, which usually isn't what you want
  in a container. Double-check the connection string.
- **`The server does not support SSL connections`**: `DB_SSL=true` is set
  against a Postgres instance that doesn't support SSL (e.g. the local
  Docker Compose Postgres). Unset `DB_SSL` or set it to `false` for local
  dev — it should only be `true` against managed providers that require it.
- **Migration reruns every start / "already exists" errors**: shouldn't
  happen — `scripts/migrate.js` tracks applied migrations in a
  `schema_migrations` table and skips ones already recorded. If you see
  this, check whether the Postgres volume was wiped without the
  `schema_migrations` table being recreated in a consistent state.
- **Port conflicts on `5432`/`6379`**: another local Postgres/Redis
  instance is likely already bound to the default port. `docker-compose.yml`
  maps Postgres to host port `5433` for exactly this reason — adjust
  further if `6379` also conflicts locally.
