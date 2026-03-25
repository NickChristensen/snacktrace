import Database from 'better-sqlite3'
import {Kysely, SqliteDialect} from 'kysely'
import os from 'node:os'
import path from 'node:path'

import {DatabaseSchema} from './schema.js'

const DEFAULT_DB_PATH = path.join(
  os.homedir(),
  'Library/Containers/com.algebraiclabs.foodnoms/Data/Documents/db.db',
)

let _db: Kysely<DatabaseSchema> | null = null

export function getDb(): Kysely<DatabaseSchema> {
  if (_db) return _db

  const dbPath = process.env.FOODNOMS_DB ?? DEFAULT_DB_PATH

  _db = new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: new Database(dbPath, {readonly: true}),
    }),
  })

  return _db
}
