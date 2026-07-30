import Database from 'better-sqlite3'
import {Kysely, SqliteDialect} from 'kysely'
import {dirname, join} from 'node:path'

export interface FoodNomsSchema {
  foodEntryRecord: {
    id: number
    entryID: string | Buffer | null
    date: string | null
    tzID: string | null
    day: number | null
    mealTypeID: string | Buffer | null
    name: string | null
    calories: number | null
    quantity: number | null
    baseAmount: number | null
    baseUnit: string | null
    nutrients: string | Buffer | null
    foodID: string | Buffer | null
    brandOwner: string | null
    barcode: string | null
    source: string | null
    collectionEditID: string | Buffer | null
    collectionSortIndex: number | null
    measure: string | Buffer | null
    measures: string | Buffer | null
  }
  foodCollectionRecord: {
    id: number
    collectionID: string | Buffer | null
    collectionEditID: string | Buffer | null
    version: number | null
    dateCreated: string | null
    dateLastUpdated: string | null
    name: string | null
    collectionType: number | null
    servings: number | null
    servingSizeUnit: string | null
    totalServingSize: number | null
    traits: number | null
    updateCount: number | null
    clock: number | null
    color: string | null
    icon: string | null
    foodEntries: string | Buffer | null
    urlString: string | null
    notes: string | null
  }
  bodyMetricEntryRecord: {id: number; day: number | null; metricType: number | null; value: number | null; dateCreated: string | null}
  bodyProfileRecord: {id: number; sex: number | null; birthdate: number | null}
  energyStrategyRecord: {id: number; dateCreated: string | null; method: number | null; startDay: number | null; manualTotalEnergy: number | null}
  weightGoalRecord: {id: number; dateCreated: string | null; startDay: number | null; desiredWeightChangePerWeek: number | null}
  macroGoalStrategyRecord: {id: number; dateCreated: string | null; startDay: number | null; mode: number | null; proteinUnit: string | null; proteinValue: number | null; carbsUnit: string | null; carbsValue: number | null; fatUnit: string | null; fatValue: number | null; toleranceValue: number | null; toleranceUnit: number | null}
  activityEntryRecord: {id: number; day: number | null; dateCreated: string | null; activityType: string | null; value: number | null}
}

const REQUIRED: Record<string, string[]> = {
  foodEntryRecord: ['id', 'entryID', 'date', 'tzID', 'day', 'mealTypeID', 'name', 'calories', 'quantity', 'baseAmount', 'baseUnit', 'nutrients', 'foodID', 'collectionEditID', 'collectionSortIndex', 'measure', 'measures'],
  foodCollectionRecord: ['id', 'collectionID', 'collectionEditID', 'dateCreated', 'dateLastUpdated', 'name', 'collectionType', 'servings', 'servingSizeUnit', 'totalServingSize', 'color', 'icon', 'foodEntries', 'urlString', 'notes'],
  mealTypeRecord: ['mealTypeID', 'name', 'sortIndex', 'disabled'],
  goalRecord: ['goalID', 'goalType', 'sortIndex'],
  goalRuleRecord: ['ruleID', 'goalType', 'startDay', 'dayOfWeek', 'mode', 'lowerBound', 'upperBound', 'isOverride'],
}

// These tables arrived with FoodNoms' date-aware energy and macro strategies.
// They are optional so older, otherwise readable databases retain their simple
// goal-rule fallback; when present, require the fields that make the strategy
// safe to resolve without guessing.
const MIGRATED: Record<string, string[]> = {
  bodyMetricEntryRecord: ['id', 'day', 'metricType', 'value', 'dateCreated'],
  bodyProfileRecord: ['id', 'dateCreated', 'sex', 'birthdate'],
  energyStrategyRecord: ['id', 'dateCreated', 'method', 'startDay', 'manualTotalEnergy', 'restingEnergyCalculationMode', 'manualRestingEnergy', 'includedEnergyComponents', 'activeEnergyScaleFactor'],
  weightGoalRecord: ['id', 'dateCreated', 'startDay', 'desiredWeightChangePerWeek', 'isOverride'],
  macroGoalStrategyRecord: ['id', 'dateCreated', 'startDay', 'mode', 'proteinUnit', 'proteinValue', 'carbsUnit', 'carbsValue', 'fatUnit', 'fatValue', 'toleranceValue', 'toleranceUnit', 'isOverride'],
  activityEntryRecord: ['id', 'day', 'dateCreated', 'activityType', 'value'],
}

export class FoodNomsDatabase {
  readonly sqlite: Database.Database
  readonly kysely: Kysely<FoodNomsSchema>
  readonly logisticsPath: string

  constructor(dbPath: string) {
    if (!dbPath) throw new Error('FOODNOMS_DB_PATH is required')
    this.sqlite = new Database(dbPath, {readonly: true, fileMustExist: true})
    this.sqlite.pragma('query_only = ON')
    this.validateSchema()
    this.kysely = new Kysely<FoodNomsSchema>({dialect: new SqliteDialect({database: this.sqlite})})
    this.logisticsPath = join(dirname(dbPath), 'logistics.db')
  }

  private validateSchema(): void {
    for (const [table, columns] of Object.entries(REQUIRED)) this.validateTable(table, columns, true)
    for (const [table, columns] of Object.entries(MIGRATED)) this.validateTable(table, columns, false)
  }

  private validateTable(table: string, columns: string[], required: boolean): void {
      const found = this.sqlite.prepare(`PRAGMA table_info("${table}")`).all() as Array<{name: string}>
      if (found.length === 0) {
        if (required) throw new Error(`FoodNoms schema is missing required table: ${table}`)
        return
      }
      const names = new Set(found.map((column) => column.name))
      const missing = columns.filter((column) => !names.has(column))
      if (missing.length > 0) throw new Error(`FoodNoms schema ${table} is missing required columns: ${missing.join(', ')}`)
  }

  read<T>(work: () => T): T {
    return this.sqlite.transaction(work)()
  }

  freshness(): string | null {
    const logistics = new Database(this.logisticsPath, {readonly: true, fileMustExist: true})
    try {
      logistics.pragma('query_only = ON')
      const row = logistics.prepare("SELECT strftime('%Y-%m-%dT%H:%M:%fZ', MAX(date)) AS lastUpdate FROM event").get() as {lastUpdate?: string | null}
      return row?.lastUpdate ?? null
    } finally {
      logistics.close()
    }
  }

  async close(): Promise<void> {
    await this.kysely.destroy()
  }
}
