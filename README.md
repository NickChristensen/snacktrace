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
- `GET /v1/days?from=YYYY-MM-DD&to=YYYY-MM-DD` returns an inclusive range of at most 366 days with totals, averages, and daily items. Each daily item includes its baked goals; it does not embed meals or entries. Larger ranges return `400` with code `RANGE_TOO_LARGE`.
- `GET /v1/library/recipes` and `/v1/library/meals` return saved FoodNoms collections (types 3 and 2). Collections are ordered case-insensitively by name, then collection ID; components are joined from `foodEntryRecord.collectionEditID` and preserve nullable `collectionSortIndex`.
- `GET /v1/foods?q=&limit=50&cursor=&sort=name|-lastLoggedAt` returns deterministic latest food snapshots. `cursor` is opaque and must be used with the same sort.
- `GET /v1/foods/:foodId` returns the latest deterministic snapshot from entry history.
- `GET /v1/freshness` returns the latest FoodNoms data update recorded locally as `{lastUpdate}`, using an ISO 8601 UTC timestamp or `null` when the local event log is empty. It returns `503` with `DATABASE_UNAVAILABLE` when the sibling `logistics.db` cannot be read.

Dates must be real `YYYY-MM-DD` ISO dates. Day and range endpoints intentionally exclude FoodNoms entries whose `day` is null; food history includes them because their timestamp remains meaningful. Entry BLOB UUIDs are normalized to lower-case canonical UUID strings. Nutrient values are optional numeric fields and per-entry nutrients are scaled to the logged quantity. Public `nutrients` objects never contain `calories`; calories are sibling fields on entries, totals, and food snapshots when present in the raw nutrient JSON.

Goals are date-scoped and appear only in day responses; there is no undated `/v1/goals` route. Every goal object contains exactly `goalId`, `type`, `target`, `lowerBound`, `upperBound`, and `actual`; numeric values are rounded to four decimal places. Bounds are inclusive: an upper bound means stay at or below it, a lower bound means stay at or above it, both bounds define an acceptable range, and null bounds make the goal informational. A null `target` or bound means it is unavailable or not configured for that date; `actual` is always the date's measured amount. Goal resolution chooses the most recent active weekday override for the Foundation weekday (`1` Sunday through `7` Saturday), then the most recent active generic rule. Dynamic energy and macro strategies affect the computed target and bounds but do not add public `mode`, `status`, `ratio`, or `goalSummary` fields. An automatic calorie rule's stored minimum is an internal target floor, not a separately exposed field or a guaranteed public lower bound.

Library components expose parsed scalar `measure` JSON, logged quantity/base-unit fields, and scaled nutrients. They never expose entry, food, or collection-edit IDs, or stored raw blobs. Recipe items may include `recipe` serving metadata and, when `servings` is positive, a `servingTotals` object calculated per serving; collections may include safe display metadata. As elsewhere, calories are a sibling of `nutrients`.

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

`npm run openapi:check` regenerates `openapi.json`, lints it with Redocly, and fails if the generated document is not committed.

## Database schema snapshots

`scripts/export-foodnoms-schema.sh` exports deterministic SQLite DDL from a FoodNoms database opened read-only. It writes the schema snapshot to standard output and never exports table rows or personal values:

```sh
scripts/export-foodnoms-schema.sh "$FOODNOMS_DB_PATH" > reference/foodnoms-schema.sql
```

`reference/foodnoms-schema.sql` is a schema reference artifact, not a restore script or migration. It intentionally retains FoodNoms FTS virtual-table declarations and their physical support tables so schema changes remain visible in Git. Keep the filename stable: commit a pre-update export first, then overwrite it with the post-update export so Git presents the migration as a normal diff.
