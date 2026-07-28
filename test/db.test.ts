import {expect} from 'chai'
import Database from 'better-sqlite3'
import {describe, it} from 'mocha'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {FoodNomsDatabase} from '../src/db.js'
import {createCalibratedFixture, createFixture} from './fixture.js'

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

  it('opens a legacy fixture with no migrated strategy tables', async () => {
    const database = new FoodNomsDatabase(createFixture())
    try {
      const migrated = database.sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('bodyMetricEntryRecord', 'bodyProfileRecord', 'energyStrategyRecord', 'weightGoalRecord', 'macroGoalStrategyRecord', 'activityEntryRecord')").all()
      expect(migrated).to.deep.equal([])
    } finally {
      await database.close()
    }
  })

  it('rejects a partial migrated strategy table before it can be queried', () => {
    const path = createFixture()
    const sqlite = new Database(path)
    try {
      sqlite.exec('CREATE TABLE energyStrategyRecord (id INTEGER PRIMARY KEY, dateCreated TEXT, method INTEGER, startDay REAL, manualTotalEnergy REAL, restingEnergyCalculationMode INTEGER, manualRestingEnergy REAL, includedEnergyComponents INTEGER)')
    } finally {
      sqlite.close()
    }

    expect(() => new FoodNomsDatabase(path)).to.throw('FoodNoms schema energyStrategyRecord is missing required columns: activeEnergyScaleFactor')
  })

  it('opens the migrated goal/energy fixture and preserves effective-date probes', async () => {
    const database = new FoodNomsDatabase(createCalibratedFixture())
    try {
      const strategy = database.sqlite.prepare('SELECT method, manualTotalEnergy, calibrationMeanDailyIntake FROM energyStrategyRecord').get() as {method: number; manualTotalEnergy: number; calibrationMeanDailyIntake: number}
      expect(strategy).to.deep.equal({method: 2, manualTotalEnergy: 2200, calibrationMeanDailyIntake: 2085})
      const rules = database.sqlite.prepare("SELECT targetValue, toleranceValue, dateCreated FROM goalRuleRecord WHERE goalType = 'calorie' AND startDay = julianday('2026-07-01') ORDER BY dateCreated").all() as Array<{targetValue: number | null; toleranceValue: number | null; dateCreated: string}>
      expect(rules).to.have.length(2)
      expect(rules.at(-1)).to.deep.include({targetValue: 2100, toleranceValue: 50, dateCreated: '2026-07-02'})
      expect(() => database.sqlite.prepare('DELETE FROM energyStrategyRecord').run()).to.throw()
    } finally {
      await database.close()
    }
  })
})
