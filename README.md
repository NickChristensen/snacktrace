# SnackTrace API

SnackTrace is a read-only HTTP API over a local FoodNoms SQLite database. It uses Fastify 5, TypeBox request validation, Kysely with better-sqlite3, and returns JSON for every successful and failed request.

## Run locally

Node 24 or later is required. Set `FOODNOMS_DB_PATH` to the FoodNoms `db.db` file; there is deliberately no fallback path and no authentication or CORS layer.

```sh
npm ci
FOODNOMS_DB_PATH="$HOME/Library/Containers/com.algebraiclabs.foodnoms/Data/Documents/db.db" npm run dev
```

The API listens on `127.0.0.1:3000` by default. `GET /health` returns `{"status":"ok"}` and `GET /openapi.json` serves the generated OpenAPI 3.1.2 contract.

## Routes

- `GET /v1/days/:date` returns the full date summary; `/entries`, `/meals`, and `/goals` return its individual sections.
- `GET /v1/days?from=YYYY-MM-DD&to=YYYY-MM-DD` returns an inclusive range of at most 366 days with totals, averages, daily items, and per-goal status counts. Larger ranges return `400` with code `RANGE_TOO_LARGE`.
- `GET /v1/goals` returns each configured goal with its full dated rule history.
- `GET /v1/foods?q=&limit=50&cursor=&sort=name|-lastLoggedAt` returns deterministic latest food snapshots. `cursor` is opaque and must be used with the same sort.
- `GET /v1/foods/:foodId` returns the latest deterministic snapshot from entry history.

Dates must be real `YYYY-MM-DD` ISO dates. Day and range endpoints intentionally exclude FoodNoms entries whose `day` is null; food history includes them because their timestamp remains meaningful. Entry BLOB UUIDs are normalized to lower-case canonical UUID strings. Nutrient values are optional numeric fields and per-entry nutrients are scaled to the logged quantity. Public `nutrients` objects never contain `calories`; calories are sibling fields on entries, totals, and food snapshots when present in the raw nutrient JSON.

Goal resolution chooses the most recent active weekday override for the Foundation weekday (`1` Sunday through `7` Saturday), then the most recent active generic rule. Status is `below`, `within`, `above`, or `tracking`; ratio appears only when exactly one non-zero goal bound is present.

## Container

```sh
FOODNOMS_DIR="$HOME/Library/Containers/com.algebraiclabs.foodnoms/Data/Documents" docker compose up --build
```

The Compose service is loopback-only, non-root, read-only, and mounts `FOODNOMS_DIR` at `/foodnoms:ro`.

## Verification

```sh
npm run build
npm test
npm run lint
npm run openapi:generate
npm run openapi:check
```
