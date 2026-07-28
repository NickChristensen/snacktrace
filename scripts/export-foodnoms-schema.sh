#!/bin/sh

set -eu

usage() {
  printf 'Usage: %s PATH_TO_FOODNOMS_DB\n' "$0" >&2
  exit 2
}

if [ "$#" -ne 1 ]; then
  usage
fi

database_path=$1

if [ ! -f "$database_path" ] || [ ! -r "$database_path" ]; then
  printf 'error: database is not a readable file: %s\n' "$database_path" >&2
  exit 1
fi

# The CLI's -readonly flag prevents accidental writes (including creation of a
# missing database). The query emits only schema SQL from sqlite_master; it does
# not read or export table rows.
sqlite3 -readonly -batch -bail -- "$database_path" <<'SQL'
.headers off
.mode list

WITH objects AS (
  SELECT
    type,
    name,
    CASE
      WHEN substr(rtrim(sql), -1) = ';' THEN rtrim(sql)
      ELSE rtrim(sql) || ';'
    END AS ddl,
    CASE type
      WHEN 'table' THEN 10
      WHEN 'view' THEN 20
      WHEN 'index' THEN 30
      WHEN 'trigger' THEN 40
      ELSE 50
    END AS type_order
  FROM sqlite_master
  WHERE sql IS NOT NULL
    AND lower(name) NOT GLOB 'sqlite_*'
), header AS (
  SELECT 0 AS output_order, 0 AS type_order, '' AS name,
         '-- FoodNoms schema snapshot (DDL only).' AS output
  UNION ALL
  SELECT 0, 1, '', '-- This file is not a restore script or migration.'
  UNION ALL
  SELECT 0, 2, '', printf(
    '-- Objects: tables=%d, views=%d, indexes=%d, triggers=%d.',
    COALESCE(SUM(CASE WHEN type = 'table' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'view' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'index' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'trigger' THEN 1 ELSE 0 END), 0)
  ) FROM objects
  UNION ALL
  SELECT 0, 3, '', printf('-- SQLite user_version=%d.', user_version)
  FROM pragma_user_version
), output AS (
  SELECT output_order, type_order, name, output FROM header
  UNION ALL
  SELECT 1, type_order, name, ddl FROM objects
)
SELECT output
FROM output
ORDER BY output_order, type_order, name;
SQL
