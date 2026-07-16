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
- Return an inclusive range of at most 366 days from `/v1/days?from=&to=` with `dayCount`, totals, averages, per-day totals/goals, and goal status summaries. Range items do not embed meals or entries. Reject larger ranges with `{status: 400, code: "RANGE_TOO_LARGE", message: "Date ranges may contain at most 366 days"}`.
- Return complete dated goal history from `/v1/goals`. Resolve progress with the newest active matching weekday override before the newest generic rule, using Foundation weekday numbering.
- Return deterministic latest logged-food snapshots from `/v1/foods` and `/v1/foods/:foodId`. Browse/search pagination uses an opaque cursor bound to the query and sort.

## Data representation

- Normalize 16-byte BLOB identifiers to canonical lowercase UUID strings while preserving native string identifiers.
- Emit entry timestamps in UTC and retain the FoodNoms timezone identifier.
- Scale nutrient values to the logged quantity. Nutrient fields are optional typed scalars with units documented by OpenAPI; missing values remain absent.
- Goal modes are `maximum`, `minimum`, `range`, or `tracking`. Return `below`, `within`, `above`, or `tracking` status, and return a ratio only for single-bound maximum/minimum goals.

## Container

- Build with Node 24, run as a fixed non-root user with a read-only root filesystem, and include an HTTP health check.
- Mount the complete FoodNoms Documents directory at `/foodnoms:ro` so SQLite WAL and SHM sidecars are visible. Do not use SQLite immutable mode.
