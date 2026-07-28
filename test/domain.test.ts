import {expect} from 'chai'
import Database from 'better-sqlite3'
import {describe, it} from 'mocha'

import {FoodNomsDatabase} from '../src/db.js'
import {daySummary} from '../src/domain.js'
import {createCalibratedFixture, createFixture} from './fixture.js'

function readDay(path: string, date: string) {
  const database = new FoodNomsDatabase(path)
  try { return daySummary(database, date) } finally { void database.close() }
}

function removeCalorieWeekdayOverride(database: Database.Database) {
  database.prepare("DELETE FROM goalRuleRecord WHERE goalType = 'calorie' AND isOverride = 1").run()
}

describe('date-aware FoodNoms goals', () => {
  it('keeps legacy fixed rules as outcome-oriented targets and inclusive bounds', () => {
    const path = createFixture()
    const writable = new Database(path)
    writable.prepare("UPDATE goalRuleRecord SET targetValue = 100, toleranceValue = 5, toleranceUnit = 2 WHERE goalType = 'protein'").run()
    writable.close()
    const goals = readDay(path, '2026-07-12').goals
    expect(goals.find((goal) => goal.type === 'calorie')).to.deep.include({target: 90, lowerBound: null, upperBound: 90, actual: 100})
    expect(goals.find((goal) => goal.type === 'protein')).to.deep.include({target: 100, lowerBound: 95, upperBound: 105})
    expect(goals.find((goal) => goal.type === 'carbohydrate')).to.deep.include({target: 25, lowerBound: 20, upperBound: 30})
  })

  it('uses the latest same-day rule by date created before falling back to its id', () => {
    const path = createCalibratedFixture()
    const writable = new Database(path)
    writable.prepare("UPDATE energyStrategyRecord SET startDay = julianday('2026-08-01')").run()
    writable.prepare("UPDATE macroGoalStrategyRecord SET startDay = julianday('2026-08-01')").run()
    writable.close()
    expect(readDay(path, '2026-07-02').goals.find((goal) => goal.type === 'calorie')).to.deep.include({target: 2100})
  })

  it('derives calibrated calories and advanced macro targets at four-decimal precision', () => {
    const path = createCalibratedFixture()
    const writable = new Database(path)
    removeCalorieWeekdayOverride(writable)
    writable.exec('ALTER TABLE goalRuleRecord ADD COLUMN minimum REAL')
    writable.prepare("UPDATE energyStrategyRecord SET startDay = julianday('2026-07-12'), manualTotalEnergy = ?").run(2465.888555697443)
    writable.prepare("UPDATE weightGoalRecord SET desiredWeightChangePerWeek = ?").run(-0.226796)
    writable.prepare("UPDATE bodyMetricEntryRecord SET day = julianday('2026-07-12'), value = ?").run(83.3830032348633)
    writable.prepare("UPDATE macroGoalStrategyRecord SET startDay = julianday('2026-07-12'), mode = 3, proteinUnit = 'gramsPerBodyWeight', proteinValue = ?, fatUnit = 'grams', fatValue = 65, carbsUnit = 'remainder', toleranceValue = .1, toleranceUnit = 1").run(2.20462)
    writable.prepare("INSERT INTO macroGoalStrategyRecord (strategyID, dateCreated, startDay, mode, proteinUnit, proteinValue, carbsUnit, fatUnit, fatValue, toleranceValue, toleranceUnit, isOverride) VALUES (?, ?, julianday('2026-07-13'), 3, 'grams', 1, 'remainder', 'grams', 1, .1, 1, 1)").run('one-day-override', '2026-07-13')
    writable.prepare('INSERT INTO goalRecord VALUES (?, ?, ?)').run(Buffer.from('abababababababababababababababab', 'hex'), 'fat', 4)
    writable.prepare("INSERT INTO goalRuleRecord (ruleID, goalType, startDay, mode, isOverride, dateCreated, minimum) VALUES (?, 'calorie', julianday('2026-07-12'), 4, 0, '2026-07-12', 1950)").run(Buffer.from('cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd', 'hex'))
    writable.close()
    const goals = readDay(path, '2026-07-12').goals
    expect(goals.find((goal) => goal.type === 'calorie')).to.deep.include({target: 2216.413, lowerBound: null, upperBound: 2216.413})
    expect(goals.find((goal) => goal.type === 'protein')).to.deep.include({target: 183.8278, lowerBound: 165.4451, upperBound: 202.2106})
    expect(goals.find((goal) => goal.type === 'fat')).to.deep.include({target: 65, lowerBound: 58.5, upperBound: 71.5})
    expect(goals.find((goal) => goal.type === 'carbohydrate')).to.deep.include({target: 224.0254, lowerBound: 201.6229, upperBound: 246.4279})
  })

  it('derives health-backed automatic energy from prior resting days and requested active energy', () => {
    const path = createCalibratedFixture()
    const writable = new Database(path)
    removeCalorieWeekdayOverride(writable)
    writable.prepare("UPDATE energyStrategyRecord SET method = 1, manualTotalEnergy = NULL, restingEnergyCalculationMode = 3, includedEnergyComponents = 1, startDay = julianday('2026-07-12')").run()
    writable.prepare('UPDATE weightGoalRecord SET desiredWeightChangePerWeek = 0').run()
    writable.prepare("INSERT INTO goalRuleRecord (ruleID, goalType, startDay, mode, isOverride, dateCreated) VALUES (?, 'calorie', julianday('2026-07-12'), 4, 0, '2026-07-12')").run(Buffer.from('ababababababababababababababab00', 'hex'))
    const activity = writable.prepare("INSERT INTO activityEntryRecord (dateCreated, day, activityType, value) VALUES (?, julianday(?), ?, ?)")
    for (let offset = 1; offset <= 7; offset++) {
      const date = `2026-07-${String(12 - offset).padStart(2, '0')}`
      activity.run(date, date, 'restingEnergy', 1800)
    }
    activity.run('2026-07-12', '2026-07-12', 'activeEnergy', 500)
    writable.close()
    expect(readDay(path, '2026-07-12').goals.find((goal) => goal.type === 'calorie')).to.deep.include({target: 2300, lowerBound: null, upperBound: 2300})
  })

  it('uses the daily minimum as an automatic calorie floor, not a public lower bound', () => {
    const path = createCalibratedFixture()
    const writable = new Database(path)
    removeCalorieWeekdayOverride(writable)
    writable.exec('ALTER TABLE goalRuleRecord ADD COLUMN minimum REAL')
    writable.prepare('UPDATE energyStrategyRecord SET manualTotalEnergy = 1000').run()
    writable.prepare('UPDATE weightGoalRecord SET desiredWeightChangePerWeek = 0').run()
    writable.prepare("INSERT INTO goalRuleRecord (ruleID, goalType, startDay, mode, isOverride, dateCreated, minimum) VALUES (?, 'calorie', julianday('2026-07-12'), 4, 0, '2026-07-12', 1950)").run(Buffer.from('efefefefefefefefefefefefefefefef', 'hex'))
    writable.close()
    expect(readDay(path, '2026-07-13').goals.find((goal) => goal.type === 'calorie')).to.deep.include({target: 1950, lowerBound: null, upperBound: 1950})
  })

  it('keeps manual calorie maximum and minimum rules when an energy strategy is also active', () => {
    const path = createCalibratedFixture()
    const writable = new Database(path)
    removeCalorieWeekdayOverride(writable)
    writable.prepare('UPDATE energyStrategyRecord SET manualTotalEnergy = 3000').run()
    const insertRule = writable.prepare("INSERT INTO goalRuleRecord (ruleID, goalType, startDay, mode, lowerBound, upperBound, isOverride, dateCreated, targetValue) VALUES (?, 'calorie', julianday(?), ?, ?, ?, 0, ?, ?)")
    insertRule.run(Buffer.from('ababababababababababababababab01', 'hex'), '2026-07-12', 1, 2200, 2300, '2026-07-12', 2300)
    insertRule.run(Buffer.from('ababababababababababababababab02', 'hex'), '2026-07-13', 2, 2150, null, '2026-07-13', 2150)
    writable.close()
    expect(readDay(path, '2026-07-12').goals.find((goal) => goal.type === 'calorie')).to.deep.include({target: 2300, lowerBound: null, upperBound: 2300})
    expect(readDay(path, '2026-07-13').goals.find((goal) => goal.type === 'calorie')).to.deep.include({target: 2150, lowerBound: 2150, upperBound: null})
  })

  it('uses calorie-relative legacy macro values ahead of retained absolute values', () => {
    const path = createCalibratedFixture()
    const writable = new Database(path)
    removeCalorieWeekdayOverride(writable)
    writable.prepare('UPDATE energyStrategyRecord SET manualTotalEnergy = 2000').run()
    writable.prepare('UPDATE weightGoalRecord SET desiredWeightChangePerWeek = 0').run()
    writable.prepare("INSERT INTO goalRecord VALUES (?, 'fat', 5)").run(Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa05', 'hex'))
    writable.prepare("INSERT INTO goalRuleRecord (ruleID, goalType, startDay, mode, isOverride, dateCreated) VALUES (?, 'calorie', julianday('2026-07-12'), 4, 0, '2026-07-12')").run(Buffer.from('ababababababababababababababab03', 'hex'))
    writable.prepare("INSERT INTO goalRuleRecord (ruleID, goalType, startDay, mode, lowerBound, upperBound, isOverride, dateCreated, targetValue, relativeToCalorieGoal, relativeFractionalTargetValue, relativePercentageLowerBound, relativePercentageUpperBound) VALUES (?, 'protein', julianday('2026-07-12'), 3, 999, 999, 0, '2026-07-12', 999, 1, .325, 25, 40)").run(Buffer.from('ababababababababababababababab04', 'hex'))
    writable.prepare("INSERT INTO goalRuleRecord (ruleID, goalType, startDay, mode, isOverride, dateCreated, targetValue, relativeToCalorieGoal, relativeFractionalTargetValue) VALUES (?, 'fat', julianday('2026-07-12'), 1, 0, '2026-07-12', 999, 1, .27)").run(Buffer.from('ababababababababababababababab05', 'hex'))
    writable.close()
    const goals = readDay(path, '2026-07-12').goals
    expect(goals.find((goal) => goal.type === 'protein')).to.deep.include({target: 162.5, lowerBound: 125, upperBound: 200})
    expect(goals.find((goal) => goal.type === 'fat')).to.deep.include({target: 60})
    expect(goals.find((goal) => goal.type === 'carbohydrate')).to.deep.include({target: 25, lowerBound: 20, upperBound: 30})
  })

  it('applies macro and weight overrides only on their exact day', () => {
    const path = createCalibratedFixture()
    const writable = new Database(path)
    removeCalorieWeekdayOverride(writable)
    writable.prepare("INSERT INTO goalRuleRecord (ruleID, goalType, startDay, mode, isOverride, dateCreated) VALUES (?, 'calorie', julianday('2026-07-12'), 4, 0, '2026-07-12')").run(Buffer.from('ababababababababababababababab06', 'hex'))
    const macroOverride = writable.prepare("INSERT INTO macroGoalStrategyRecord (strategyID, dateCreated, startDay, mode, proteinUnit, proteinValue, carbsUnit, fatUnit, fatValue, toleranceValue, toleranceUnit, isOverride) VALUES (?, ?, julianday('2026-07-12'), 3, 'grams', ?, 'remainder', 'grams', 50, .1, 1, 1)")
    macroOverride.run('macro-override-old', '2026-07-12 09:00:00', 100)
    macroOverride.run('macro-override-new', '2026-07-12 10:00:00', 111)
    const weightOverride = writable.prepare("INSERT INTO weightGoalRecord (weightGoalID, dateCreated, startDay, desiredWeightChangePerWeek, isOverride) VALUES (?, ?, julianday('2026-07-12'), ?, 1)")
    weightOverride.run('weight-override-old', '2026-07-12 09:00:00', .1)
    weightOverride.run('weight-override-new', '2026-07-12 10:00:00', 0)
    writable.close()
    const sameDay = readDay(path, '2026-07-12').goals
    expect(sameDay.find((goal) => goal.type === 'calorie')).to.deep.include({target: 2200})
    expect(sameDay.find((goal) => goal.type === 'protein')).to.deep.include({target: 111})
    const nextDay = readDay(path, '2026-07-13').goals
    expect(nextDay.find((goal) => goal.type === 'calorie')).to.deep.include({target: 1925})
    expect(nextDay.find((goal) => goal.type === 'protein')).to.deep.include({target: 10})
  })
})
