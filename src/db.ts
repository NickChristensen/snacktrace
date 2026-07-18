import Database from 'better-sqlite3'
import {Kysely, SqliteDialect} from 'kysely'

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
}

const REQUIRED: Record<string, string[]> = {
  foodEntryRecord: ['id', 'entryID', 'date', 'tzID', 'day', 'mealTypeID', 'name', 'calories', 'quantity', 'baseAmount', 'baseUnit', 'nutrients', 'foodID', 'collectionEditID', 'collectionSortIndex', 'measure', 'measures'],
  foodCollectionRecord: ['id', 'collectionID', 'collectionEditID', 'dateCreated', 'dateLastUpdated', 'name', 'collectionType', 'servings', 'servingSizeUnit', 'totalServingSize', 'color', 'icon', 'foodEntries', 'urlString', 'notes'],
  mealTypeRecord: ['mealTypeID', 'name', 'sortIndex', 'disabled'],
  goalRecord: ['goalID', 'goalType', 'sortIndex'],
  goalRuleRecord: ['ruleID', 'goalType', 'startDay', 'dayOfWeek', 'mode', 'lowerBound', 'upperBound', 'isOverride'],
}

export class FoodNomsDatabase {
  readonly sqlite: Database.Database
  readonly kysely: Kysely<FoodNomsSchema>

  constructor(dbPath: string) {
    if (!dbPath) throw new Error('FOODNOMS_DB_PATH is required')
    this.sqlite = new Database(dbPath, {readonly: true, fileMustExist: true})
    this.sqlite.pragma('query_only = ON')
    this.validateSchema()
    this.kysely = new Kysely<FoodNomsSchema>({dialect: new SqliteDialect({database: this.sqlite})})
  }

  private validateSchema(): void {
    for (const [table, columns] of Object.entries(REQUIRED)) {
      const found = this.sqlite.prepare(`PRAGMA table_info("${table}")`).all() as Array<{name: string}>
      if (found.length === 0) throw new Error(`FoodNoms schema is missing required table: ${table}`)
      const names = new Set(found.map((column) => column.name))
      const missing = columns.filter((column) => !names.has(column))
      if (missing.length > 0) throw new Error(`FoodNoms schema ${table} is missing required columns: ${missing.join(', ')}`)
    }
  }

  read<T>(work: () => T): T {
    return this.sqlite.transaction(work)()
  }

  async close(): Promise<void> {
    await this.kysely.destroy()
  }
}
