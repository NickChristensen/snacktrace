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
  db.close()
  return path
}
