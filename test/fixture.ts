import Database from 'better-sqlite3'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

export function createFixture(): string {
  const path = join(mkdtempSync(join(tmpdir(), 'snacktrace-')), 'foodnoms.db')
  const db = new Database(path)
  db.exec(`
    CREATE TABLE foodEntryRecord (id INTEGER PRIMARY KEY, entryID BLOB, date TEXT, tzID TEXT, day REAL, mealTypeID TEXT, name TEXT, calories REAL, quantity REAL, baseAmount REAL, baseUnit TEXT, nutrients TEXT, foodID BLOB, brandOwner TEXT, barcode TEXT, source TEXT);
    CREATE TABLE mealTypeRecord (mealTypeID TEXT, name TEXT, sortIndex INTEGER, disabled INTEGER);
    CREATE TABLE goalRecord (goalID BLOB, goalType TEXT, sortIndex INTEGER);
    CREATE TABLE goalRuleRecord (ruleID BLOB, goalType TEXT, startDay REAL, dayOfWeek INTEGER, mode INTEGER, lowerBound REAL, upperBound REAL, isOverride INTEGER, dateCreated TEXT);
  `)
  db.prepare('INSERT INTO mealTypeRecord VALUES (?, ?, ?, ?)').run('1', '', 1, 0)
  db.prepare('INSERT INTO mealTypeRecord VALUES (?, ?, ?, ?)').run('8', 'Brunch', 2, 0)
  const id = (hex: string) => Buffer.from(hex, 'hex')
  db.prepare('INSERT INTO foodEntryRecord VALUES (?, ?, ?, ?, julianday(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(1, id('00112233445566778899aabbccddeeff'), '2026-07-12 12:00:00.000', 'America/Chicago', '2026-07-12', '1', 'Apple', 95, 1, 100, 'g', '{"calories":100,"carbs":25,"fiber":4,"biotin":2,"chlorine":3,"sugarsAdded":5}', id('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'), null, null, 'fixture')
  db.prepare('INSERT INTO foodEntryRecord VALUES (?, ?, ?, ?, julianday(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(2, id('10112233445566778899aabbccddeeff'), '2026-07-12 13:00:00.000', 'America/Chicago', '2026-07-12', '1', 'Coffee', 5, 1, 1, 'cup', '{"calories":5,"caffeine":80}', id('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'), null, null, 'fixture')
  db.prepare('INSERT INTO foodEntryRecord VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(3, id('20112233445566778899aabbccddeeff'), '2026-07-13 15:00:00.000', 'America/Chicago', '1', 'Undated', 10, 1, 1, 'g', '{"calories":10}', id('cccccccccccccccccccccccccccccccc'), null, null, 'fixture')
  db.prepare('INSERT INTO foodEntryRecord VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(4, id('30112233445566778899aabbccddeeff'), null, 'America/Chicago', '1', 'No Timestamp', 0, 1, 1, 'g', '{}', id('dddddddddddddddddddddddddddddddd'), null, null, 'fixture')
  db.prepare('INSERT INTO foodEntryRecord VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(5, id('40112233445566778899aabbccddeeff'), '2026-07-11 12:00:00.000', 'America/Chicago', '1', 'Apple Historical', 95, 1, 100, 'g', '{"calories":100}', id('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'), null, null, 'fixture')
  db.prepare('INSERT INTO foodEntryRecord VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(6, id('50112233445566778899aabbccddeeff'), '2026-07-12 12:00:00.000', 'America/Chicago', '1', 'Apple Final', 95, 1, 100, 'g', '{"calories":100}', id('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'), null, null, 'fixture')
  db.prepare('INSERT INTO foodEntryRecord VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(7, id('60112233445566778899aabbccddeeff'), null, 'America/Chicago', '1', 'No Timestamp Latest', 0, 1, 1, 'g', '{}', id('dddddddddddddddddddddddddddddddd'), null, null, 'fixture')
  db.prepare('INSERT INTO foodEntryRecord VALUES (?, ?, ?, ?, julianday(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(8, id('70112233445566778899aabbccddeeff'), '2026-07-14 12:00:00.000', 'America/Chicago', '2026-07-14', '7', 'Unknown meal type', 10, 1, 1, 'g', '{"calories":10}', null, null, null, 'fixture')
  db.prepare('INSERT INTO foodEntryRecord VALUES (?, ?, ?, ?, julianday(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(9, id('80112233445566778899aabbccddeeff'), '2026-07-14 13:00:00.000', 'America/Chicago', '2026-07-14', '8', 'Custom meal type', 10, 1, 1, 'g', '{"calories":10}', null, null, null, 'fixture')
  db.prepare('INSERT INTO foodEntryRecord VALUES (?, ?, ?, ?, julianday(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(10, id('90112233445566778899aabbccddeeff'), '2026-07-14 14:00:00.000', 'America/Chicago', '2026-07-14', null, 'No meal type', 10, 1, 1, 'g', '{"calories":10}', null, null, null, 'fixture')
  db.prepare('INSERT INTO goalRecord VALUES (?, ?, ?)').run(id('dddddddddddddddddddddddddddddddd'), 'calorie', 1)
  db.prepare('INSERT INTO goalRecord VALUES (?, ?, ?)').run(id('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'), 'protein', 2)
  db.prepare('INSERT INTO goalRecord VALUES (?, ?, ?)').run(id('ffffffffffffffffffffffffffffffff'), 'carbohydrate', 3)
  db.prepare('INSERT INTO goalRecord VALUES (?, ?, ?)').run(id('99999999999999999999999999999999'), 'caffeine', 4)
  db.prepare('INSERT INTO goalRuleRecord VALUES (?, ?, julianday(?), ?, ?, ?, ?, ?, ?)').run(id('11111111111111111111111111111111'), 'calorie', '2026-01-01', null, 1, null, 100, 0, '2026-01-01')
  db.prepare('INSERT INTO goalRuleRecord VALUES (?, ?, julianday(?), ?, ?, ?, ?, ?, ?)').run(id('22222222222222222222222222222222'), 'calorie', '2026-01-01', 1, 1, null, 90, 1, '2026-01-02')
  db.prepare('INSERT INTO goalRuleRecord VALUES (?, ?, julianday(?), ?, ?, ?, ?, ?, ?)').run(id('33333333333333333333333333333333'), 'protein', '2026-01-01', null, 2, 10, null, 0, '2026-01-01')
  db.prepare('INSERT INTO goalRuleRecord VALUES (?, ?, julianday(?), ?, ?, ?, ?, ?, ?)').run(id('44444444444444444444444444444444'), 'carbohydrate', '2026-01-01', null, 3, 20, 30, 0, '2026-01-01')
  db.prepare('INSERT INTO goalRuleRecord VALUES (?, ?, julianday(?), ?, ?, ?, ?, ?, ?)').run(id('55555555555555555555555555555555'), 'caffeine', '2026-01-01', null, 4, null, null, 0, '2026-01-01')
  // Newer FoodNoms goal-rule fields are nullable and absent from legacy rows.
  // Keeping them on the baseline fixture lets the resolver exercise both the
  // legacy bounds and migrated target/tolerance shapes.
  db.exec(`
    ALTER TABLE goalRuleRecord ADD COLUMN targetValue REAL;
    ALTER TABLE goalRuleRecord ADD COLUMN toleranceValue REAL;
    ALTER TABLE goalRuleRecord ADD COLUMN toleranceUnit INTEGER;
    ALTER TABLE goalRuleRecord ADD COLUMN relativeFractionalLowerBound REAL;
    ALTER TABLE goalRuleRecord ADD COLUMN relativeFractionalUpperBound REAL;
    ALTER TABLE goalRuleRecord ADD COLUMN relativeFractionalTargetValue REAL;
    ALTER TABLE goalRuleRecord ADD COLUMN relativePercentageLowerBound INTEGER;
    ALTER TABLE goalRuleRecord ADD COLUMN relativePercentageUpperBound INTEGER;
    ALTER TABLE goalRuleRecord ADD COLUMN relativeToCalorieGoal INTEGER;
    ALTER TABLE goalRuleRecord ADD COLUMN calorieAdjustmentType INTEGER;
  `)
  db.exec(`
    ALTER TABLE foodEntryRecord ADD COLUMN collectionEditID BLOB;
    ALTER TABLE foodEntryRecord ADD COLUMN collectionSortIndex INTEGER;
    ALTER TABLE foodEntryRecord ADD COLUMN measure TEXT;
    ALTER TABLE foodEntryRecord ADD COLUMN measures TEXT;
    CREATE TABLE foodCollectionRecord (id INTEGER PRIMARY KEY, collectionID BLOB, collectionEditID BLOB, version INTEGER, dateCreated TEXT, dateLastUpdated TEXT, name TEXT, collectionType INTEGER, servings REAL, servingSizeUnit TEXT, totalServingSize REAL, traits INTEGER, updateCount INTEGER, clock INTEGER, color TEXT, icon TEXT, foodEntries BLOB, urlString TEXT, notes TEXT);
  `)
  const collection = db.prepare('INSERT INTO foodCollectionRecord (id, collectionID, collectionEditID, dateCreated, dateLastUpdated, name, collectionType, servings, servingSizeUnit, totalServingSize, color, icon, foodEntries, urlString, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const recipeEdit = id('111111111111111111111111111111aa')
  const recipeTwoEdit = id('111111111111111111111111111111bb')
  const mealEdit = id('111111111111111111111111111111cc')
  collection.run(101, id('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa01'), recipeEdit, '2026-07-01 10:00:00.000', '2026-07-02 11:30:00.000', 'alpha recipe', 3, 4, 'portion', 800, '#fff', 'fork.knife', null, 'https://example.test/alpha', 'Fixture recipe')
  collection.run(102, id('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa02'), recipeTwoEdit, '2026-07-03 10:00:00.000', '2026-07-03 10:00:00.000', 'Bravo Recipe', 3, 0, null, null, null, null, null, null, null)
  collection.run(103, id('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa03'), mealEdit, '2026-07-04 10:00:00.000', '2026-07-05 10:00:00.000', 'Breakfast Box', 2, null, null, null, null, null, null, null, null)
  const component = db.prepare('INSERT INTO foodEntryRecord (id, entryID, name, calories, quantity, baseAmount, baseUnit, nutrients, collectionEditID, collectionSortIndex, measure) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  component.run(101, id('10112233445566778899aabbccddee01'), 'Oats', 105, 1, 100, 'g', '{"calories":100,"protein":5}', recipeEdit, 1, '{"descriptionQuantity":0.666,"descriptionText":"cup","traits":0,"unit":"gram","value":80,"internalValue":"do not expose"}')
  component.run(102, id('10112233445566778899aabbccddee02'), 'Milk', 50, 1, 100, 'g', '{"calories":50,"protein":3}', recipeEdit, null, '{"descriptionText":"cup","traits":0,"unit":"gram","value":240}')
  component.run(103, id('10112233445566778899aabbccddee03'), 'Berries', 25, 1, 100, 'g', '{"calories":25,"carbs":6}', recipeTwoEdit, 0, '{"descriptionText":"cup","traits":0,"unit":"gram","value":140}')
  component.run(104, id('10112233445566778899aabbccddee04'), 'Eggs', 140, 2, 100, 'g', '{"calories":70,"protein":6}', mealEdit, 0, '{"descriptionText":"egg","traits":0,"unit":"gram","value":50}')
  db.close()
  return path
}

/**
 * Fixture containing the post-migration energy and macro goal tables. It
 * intentionally starts from the legacy fixture so callers can compare
 * fallback behaviour with the calibrated strategy data below.
 */
export function createCalibratedFixture(): string {
  const path = createFixture()
  const db = new Database(path)
  db.exec(`
    CREATE TABLE bodyMetricEntryRecord (id INTEGER PRIMARY KEY AUTOINCREMENT, entryID TEXT, day REAL, metricType INTEGER, value REAL, dateCreated TEXT);
    CREATE TABLE bodyProfileRecord (id INTEGER PRIMARY KEY AUTOINCREMENT, dateCreated TEXT, sex INTEGER, birthdate REAL);
    CREATE TABLE energyStrategyRecord (id INTEGER PRIMARY KEY AUTOINCREMENT, strategyID TEXT, dateCreated TEXT, method INTEGER, startDay REAL, restingEnergyCalculationMode INTEGER, manualRestingEnergy REAL, includedEnergyComponents INTEGER, activeEnergyScaleFactor REAL, manualTotalEnergy REAL, calibrationMeanDailyIntake REAL, calibrationWeightRate REAL, calibrationLoggedDayCount INTEGER, calibrationFlaggedDayCount INTEGER, calibrationWindowDays INTEGER, calibrationConfidence TEXT);
    CREATE TABLE weightGoalRecord (id INTEGER PRIMARY KEY AUTOINCREMENT, weightGoalID TEXT, dateCreated TEXT, startDay REAL, desiredWeightChangePerWeek REAL, targetWeight REAL, isOverride INTEGER, startingWeight REAL, startingWeightDay REAL);
    CREATE TABLE macroGoalStrategyRecord (id INTEGER PRIMARY KEY AUTOINCREMENT, strategyID TEXT, dateCreated TEXT, startDay REAL, mode INTEGER, proteinUnit TEXT, proteinValue REAL, carbsUnit TEXT, carbsValue REAL, fatUnit TEXT, fatValue REAL, toleranceValue REAL, toleranceUnit INTEGER, isOverride INTEGER);
    CREATE TABLE activityEntryRecord (id INTEGER PRIMARY KEY AUTOINCREMENT, dateCreated TEXT, day REAL, activityType TEXT, value REAL);
  `)
  db.prepare('INSERT INTO bodyProfileRecord (dateCreated, sex, birthdate) VALUES (?, ?, ?)').run('2026-07-01', 1, 3000)
  // Method 2 is FoodNoms' calibrated/manual-total-energy strategy. The
  // calibrated value is deliberately distinct from the legacy 100 kcal goal.
  db.prepare(`INSERT INTO energyStrategyRecord (strategyID, dateCreated, method, startDay, manualTotalEnergy, calibrationMeanDailyIntake, calibrationWeightRate, calibrationLoggedDayCount, calibrationFlaggedDayCount, calibrationWindowDays, calibrationConfidence) VALUES (?, ?, ?, julianday(?), ?, ?, ?, ?, ?, ?, ?)`)
    .run('energy-calibrated', '2026-07-01', 2, '2026-07-01', 2200, 2085, -0.25, 28, 1, 28, 'high')
  db.prepare('INSERT INTO bodyMetricEntryRecord (entryID, day, metricType, value, dateCreated) VALUES (?, julianday(?), ?, ?, ?)').run('weight-1', '2026-07-12', 1, 80, '2026-07-12')
  db.prepare('INSERT INTO weightGoalRecord (weightGoalID, dateCreated, startDay, desiredWeightChangePerWeek, targetWeight, isOverride, startingWeight, startingWeightDay) VALUES (?, ?, julianday(?), ?, ?, ?, ?, julianday(?))').run('weight-goal-1', '2026-07-01', '2026-07-01', -0.25, 75, 0, 80, '2026-07-01')
  db.prepare('INSERT INTO macroGoalStrategyRecord (strategyID, dateCreated, startDay, mode, proteinUnit, proteinValue, carbsUnit, carbsValue, fatUnit, fatValue, toleranceValue, toleranceUnit, isOverride) VALUES (?, ?, julianday(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run('macro-1', '2026-07-01', '2026-07-01', 1, 'g', 150, 'percent', 40, 'percent', 30, 10, 1, 0)
  // Effective-date and dedupe probes: same day and type, where the later row
  // wins; an older row must not leak into the selected result.
  db.prepare('INSERT INTO goalRuleRecord (ruleID, goalType, startDay, dayOfWeek, mode, lowerBound, upperBound, isOverride, dateCreated, targetValue, toleranceValue, toleranceUnit) VALUES (?, ?, julianday(?), ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'hex'), 'calorie', '2026-07-01', null, 1, null, null, 0, '2026-07-01', 2200, 100, 1)
  db.prepare('INSERT INTO goalRuleRecord (ruleID, goalType, startDay, dayOfWeek, mode, lowerBound, upperBound, isOverride, dateCreated, targetValue, toleranceValue, toleranceUnit) VALUES (?, ?, julianday(?), ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(Buffer.from('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'hex'), 'calorie', '2026-07-01', null, 1, null, null, 0, '2026-07-02', 2100, 50, 1)
  db.close()
  return path
}
