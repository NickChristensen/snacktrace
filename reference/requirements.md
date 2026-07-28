# SnackTrace v2 requirements

SnackTrace v2 is a read-only Fastify HTTP service. It completely replaces the oclif CLI and has no compatibility binary or command adapter.

## Runtime

- Require Node 24 or newer and `FOODNOMS_DB_PATH`; never fall back to a user-specific database path.
- Open an existing FoodNoms database read-only, enable SQLite `query_only`, validate the required schema at startup, and close the shared connection during graceful shutdown.
- Return JSON for every HTTP success and failure. Log structured JSON, including configuration and startup failures.
- Serve without authentication or CORS and bind only to loopback when run locally. The container listens on all container interfaces, while Compose publishes the port only on `127.0.0.1`.

## HTTP contract

- Serve the authoritative OpenAPI 3.1.2 document at `/openapi.json` and database health at `/health`.
- Put application routes under `/v1`, reject unknown request parameters, and return errors as `{status, code, message, issues?}`.
- Accept only real `YYYY-MM-DD` calendar dates. Day and range queries use FoodNoms' `day` value and exclude entries whose `day` is null.
- Return a complete day from `/v1/days/:date` and section collections from `/entries`, `/meals`, and `/goals` using `{date, items}`.
- Return an inclusive range of at most 366 days from `/v1/days?from=&to=` with `dayCount`, totals, averages, and per-day totals/goals. Range items do not embed meals or entries. Reject larger ranges with `{status: 400, code: "RANGE_TOO_LARGE", message: "Date ranges may contain at most 366 days"}`.
- Do not expose an undated `/v1/goals` route, goal history, `goalSummary`, goal status, or a goal ratio.
- Return deterministic latest logged-food snapshots from `/v1/foods` and `/v1/foods/:foodId`. Browse/search pagination uses an opaque cursor bound to the query and sort.
- Return saved recipes from `/v1/library/recipes` (`collectionType = 3`) and saved meals from `/v1/library/meals` (`collectionType = 2`) as deterministic `{items}` collections. Sort case-insensitively by name then collection ID. Join components through `foodEntryRecord.collectionEditID`, preserve nullable `collectionSortIndex`, and do not trust `foodCollectionRecord.foodEntries`.

## Data representation

- Normalize 16-byte BLOB identifiers to canonical lowercase UUID strings while preserving native string identifiers.
- Emit entry timestamps in UTC and retain the FoodNoms timezone identifier.
- Scale nutrient values to the logged quantity. Nutrient fields are optional typed scalars with units documented by OpenAPI; missing values remain absent.
- Library items normalize only the public `collectionId`; omit component IDs, collection-edit IDs, and raw stored blobs. Parse a component `measure` only when it is a JSON object containing public scalar values. Recipe serving metadata and safe collection display metadata remain optional. Recipes with a positive finite `servings` value also expose `servingTotals`, calculated from totals per serving; meals and recipes without a valid positive serving count omit it. Calories are sibling fields on library totals and components, never keys inside `nutrients`.
- Goals are baked for each requested date and are returned only by `/v1/days/:date`, `/v1/days/:date/goals`, and each item in `/v1/days?from=&to=`. Every public goal object contains exactly `goalId`, `type`, `target`, `lowerBound`, `upperBound`, and `actual`; numeric values are rounded to four decimal places. Bounds are inclusive: upper-only means stay at or below the upper bound, lower-only means stay at or above the lower bound, both mean the inclusive acceptable range, and neither is informational. `null` means a target or bound is unavailable or unconfigured for that date; `actual` is always the date's measured amount. Resolve date-scoped targets with the newest active matching weekday override before the newest generic rule, using Foundation weekday numbering. Dynamic energy and advanced macro strategies affect the projected target and bounds but do not alter the public shape. An automatic calorie rule's stored minimum is an internal target floor, not a separately exposed field or a guaranteed public lower bound.

## Container

- Build with Node 24, run as a fixed non-root user with a read-only root filesystem, and include an HTTP health check.
- Mount the complete FoodNoms Documents directory at `/foodnoms:ro` so SQLite WAL and SHM sidecars are visible. Do not use SQLite immutable mode.

## OpenAPI maintenance

- Treat generated `openapi.json` as the published contract. Run `npm run openapi:generate` after route or schema changes, then run `npm run openapi:check`; the check regenerates the file, runs `redocly lint openapi.json`, and requires no resulting diff.
