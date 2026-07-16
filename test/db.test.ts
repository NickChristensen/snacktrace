import {expect} from 'chai'
import Database from 'better-sqlite3'
import {describe, it} from 'mocha'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {FoodNomsDatabase} from '../src/db.js'
import {createFixture} from './fixture.js'

describe('FoodNomsDatabase', () => {
  it('rejects an incompatible SQLite file', () => {
    const path = join(mkdtempSync(join(tmpdir(), 'snacktrace-invalid-')), 'invalid.db')
    new Database(path).close()
    expect(() => new FoodNomsDatabase(path)).to.throw('FoodNoms schema is missing required table: foodEntryRecord')
  })

  it('enforces query-only access', async () => {
    const database = new FoodNomsDatabase(createFixture())
    try {
      expect(() => database.sqlite.prepare('DELETE FROM foodEntryRecord').run()).to.throw()
    } finally {
      await database.close()
    }
  })
})
