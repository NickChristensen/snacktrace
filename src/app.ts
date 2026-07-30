import swagger from '@fastify/swagger'
import {Type} from '@sinclair/typebox'
import Fastify, {type FastifyInstance, type FastifyReply} from 'fastify'

import {FoodNomsDatabase} from './db.js'
import {daySummary, foodSnapshot, inclusiveDayCount, InvalidFoodCursorError, isIsoDate, listFoods, listLibrary, rangeSummary} from './domain.js'

const DateString = Type.String({pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'Calendar date in strict ISO 8601 YYYY-MM-DD form.'})
const amount = (unit: string) => Type.Number({description: `Amount in ${unit}.`})
const Nutrients = Type.Partial(Type.Object({
  alcohol: amount('grams'),
  biotin: amount('micrograms'),
  caffeine: amount('milligrams'),
  calcium: amount('milligrams'),
  carbs: amount('grams'),
  chlorine: amount('milligrams'),
  cholesterol: amount('milligrams'),
  chromium: amount('micrograms'),
  copper: amount('milligrams'),
  fat: amount('grams'),
  fatMonounsaturated: amount('grams'),
  fatPolyunsaturated: amount('grams'),
  fatSaturated: amount('grams'),
  fatTrans: amount('grams'),
  fiber: amount('grams'),
  folate: amount('micrograms'),
  iodine: amount('micrograms'),
  iron: amount('milligrams'),
  magnesium: amount('milligrams'),
  manganese: amount('milligrams'),
  molybdenum: amount('micrograms'),
  niacin: amount('milligrams'),
  pantothenicAcid: amount('milligrams'),
  phosphorus: amount('milligrams'),
  potassium: amount('milligrams'),
  protein: amount('grams'),
  riboflavin: amount('milligrams'),
  selenium: amount('micrograms'),
  sodium: amount('milligrams'),
  sugarAlcohols: amount('grams'),
  sugars: amount('grams'),
  sugarsAdded: amount('grams'),
  thiamin: amount('milligrams'),
  vitaminA: amount('micrograms RAE'),
  vitaminB12: amount('micrograms'),
  vitaminB6: amount('milligrams'),
  vitaminC: amount('milligrams'),
  vitaminD: amount('micrograms'),
  vitaminE: amount('milligrams'),
  vitaminK: amount('micrograms'),
  water: amount('grams'),
  zinc: amount('milligrams'),
}), {additionalProperties: false})
const ErrorResponse = Type.Object({status: Type.Integer(), code: Type.String(), message: Type.String(), issues: Type.Optional(Type.Array(Type.Object({path: Type.String(), message: Type.String()})))}, {additionalProperties: false})
const EntryResponse = Type.Object({entryId: Type.Union([Type.String(), Type.Null()]), foodId: Type.Union([Type.String(), Type.Null()]), name: Type.String(), timestamp: Type.Union([Type.String(), Type.Null()]), tzId: Type.String(), mealTypeId: Type.Union([Type.String(), Type.Null()]), calories: Type.Number(), quantity: Type.Optional(Type.Number()), baseAmount: Type.Optional(Type.Number()), baseUnit: Type.Union([Type.String(), Type.Null()]), brandOwner: Type.Union([Type.String(), Type.Null()]), barcode: Type.Union([Type.String(), Type.Null()]), source: Type.Union([Type.String(), Type.Null()]), nutrients: Nutrients}, {additionalProperties: false})
const Totals = Type.Object({calories: Type.Number(), nutrients: Nutrients}, {additionalProperties: false})
const GoalResponse = Type.Object({
  goalId: Type.Union([Type.String(), Type.Null()]),
  type: Type.String(),
  target: Type.Union([Type.Number({description: 'Date-specific target amount, rounded to four decimal places.'}), Type.Null({description: 'No target is configured for this goal on this date.'})]),
  lowerBound: Type.Union([Type.Number({description: 'Inclusive lower bound, rounded to four decimal places.'}), Type.Null({description: 'No inclusive lower bound is configured for this goal on this date.'})]),
  upperBound: Type.Union([Type.Number({description: 'Inclusive upper bound, rounded to four decimal places.'}), Type.Null({description: 'No inclusive upper bound is configured for this goal on this date.'})]),
  actual: Type.Number({description: 'Actual amount for the requested date, rounded to four decimal places.'}),
}, {additionalProperties: false, description: 'A date-scoped baked goal. Bounds are inclusive: only upper means stay at or below it, only lower means stay at or above it, both form an acceptable range, and neither is informational.'})
const MealResponse = Type.Object({mealTypeId: Type.Union([Type.String(), Type.Null()]), name: Type.String(), sortIndex: Type.Integer(), totals: Totals, entries: Type.Array(EntryResponse)}, {additionalProperties: false})
const DayResponse = Type.Object({date: DateString, totals: Totals, goals: Type.Array(GoalResponse), meals: Type.Array(MealResponse)}, {additionalProperties: false})
const RangeDayResponse = Type.Object({date: DateString, totals: Totals, goals: Type.Array(GoalResponse)}, {additionalProperties: false})
const FoodResponse = Type.Object({foodId: Type.Union([Type.String(), Type.Null()]), name: Type.String(), brandOwner: Type.Union([Type.String(), Type.Null()]), baseAmount: Type.Optional(Type.Number()), baseUnit: Type.Union([Type.String(), Type.Null()]), source: Type.Union([Type.String(), Type.Null()]), barcode: Type.Union([Type.String(), Type.Null()]), lastLoggedAt: Type.Union([Type.String(), Type.Null()]), calories: Type.Optional(Type.Number()), nutrients: Nutrients}, {additionalProperties: false})
const Measure = Type.Partial(Type.Object({descriptionQuantity: Type.Number(), descriptionText: Type.String(), unit: Type.String(), value: Type.Number(), traits: Type.Number()}, {additionalProperties: false}), {description: 'Whitelisted public fields parsed from FoodNoms measure JSON.'})
const CollectionMetadata = Type.Partial(Type.Object({color: Type.String(), icon: Type.String(), url: Type.String(), notes: Type.String()}, {additionalProperties: false}))
const RecipeServing = Type.Partial(Type.Object({servings: Type.Number(), servingSizeUnit: Type.String(), totalServingSize: Type.Number()}, {additionalProperties: false}))
const LibraryComponent = Type.Object({name: Type.String(), collectionSortIndex: Type.Union([Type.Integer(), Type.Null()]), quantity: Type.Optional(Type.Number()), baseAmount: Type.Optional(Type.Number()), baseUnit: Type.Union([Type.String(), Type.Null()]), measure: Type.Optional(Measure), calories: Type.Number(), nutrients: Nutrients}, {additionalProperties: false})
const LibraryItem = Type.Object({collectionId: Type.Union([Type.String(), Type.Null()]), kind: Type.Union([Type.Literal('recipe'), Type.Literal('meal')]), type: Type.Integer(), name: Type.String(), createdAt: Type.Union([Type.String(), Type.Null()]), updatedAt: Type.Union([Type.String(), Type.Null()]), metadata: Type.Optional(CollectionMetadata), recipe: Type.Optional(RecipeServing), totals: Totals, servingTotals: Type.Optional(Totals), components: Type.Array(LibraryComponent)}, {additionalProperties: false})
const FreshnessResponse = Type.Object({lastUpdate: Type.Union([Type.String({format: 'date-time', description: 'Latest FoodNoms data update recorded locally, expressed as an ISO 8601 UTC timestamp.'}), Type.Null({description: 'No local FoodNoms data update has been recorded.'})])}, {additionalProperties: false})
const EmptyQuery = Type.Object({}, {additionalProperties: false})
const MAX_RANGE_DAYS = 366
const RangeTooLargeError = Type.Object({status: Type.Literal(400), code: Type.Literal('RANGE_TOO_LARGE'), message: Type.Literal('Date ranges may contain at most 366 days')}, {additionalProperties: false})
const DateRangeQuery = Type.Object({
  from: Type.String({pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'First calendar date in strict ISO 8601 YYYY-MM-DD form.'}),
  to: Type.String({pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'Last calendar date in strict ISO 8601 YYYY-MM-DD form. The inclusive range from `from` through `to` may contain at most 366 days.'}),
}, {additionalProperties: false})
const HEALTH_TABLES = ['foodEntryRecord', 'foodCollectionRecord', 'mealTypeRecord', 'goalRecord', 'goalRuleRecord'] as const

export interface AppOptions {dbPath?: string; logger?: boolean}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? true,
    routerOptions: {maxParamLength: 200},
    ajv: {customOptions: {allErrors: true, coerceTypes: true, removeAdditional: false}},
    frameworkErrors: (error, _request, reply) => {
      const status = error.code === 'FST_ERR_MAX_PARAM_LENGTH' ? 414 : 400
      const message = status === 414 ? 'Path parameter exceeds the maximum length' : 'URL must be validly percent-encoded'
      void (reply as FastifyReply).code(status).send({status, code: 'VALIDATION_ERROR', message: 'Request validation failed', issues: [{path: 'url', message}]})
    },
  })
  const database = options.dbPath ? new FoodNomsDatabase(options.dbPath) : undefined
  if (database) app.decorate('foodnoms', database)
  const getDatabase = (): FoodNomsDatabase => {
    if (!database) throw new Error('FoodNoms database is not configured')
    return database
  }
  await app.register(swagger, {openapi: {openapi: '3.1.2', info: {title: 'SnackTrace API', version: '2.0.0', description: 'Read-only JSON API for a FoodNoms SQLite database.', license: {name: 'ISC', identifier: 'ISC'}}, servers: [{url: '/'}], security: []}})

  app.setErrorHandler((error, request, reply) => {
    const applicationError = error as Error & {statusCode?: number; validation?: unknown}
    const validation = applicationError.validation
    const statusCode = validation ? 400 : applicationError.statusCode && applicationError.statusCode < 500 ? applicationError.statusCode : 500
    const code = validation ? 'VALIDATION_ERROR' : statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR'
    request.log.error({err: error, code}, 'request failed')
    void reply.code(statusCode).send({status: statusCode, code, message: validation ? 'Request validation failed' : statusCode === 500 ? 'Internal server error' : applicationError.message, ...(validation ? {issues: (validation as Array<{instancePath?: string; message?: string}>).map((item) => ({path: item.instancePath ?? '', message: item.message ?? 'invalid'}))} : {})})
  })
  app.setNotFoundHandler((request, reply) => reply.code(404).send({status: 404, code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found`}))
  app.addHook('onClose', async () => database?.close())

  app.get('/health', {schema: {tags: ['system'], summary: 'Check service health', operationId: 'health', querystring: EmptyQuery, response: {200: Type.Object({status: Type.Literal('ok')}, {additionalProperties: false}), 400: ErrorResponse, 404: ErrorResponse, 503: ErrorResponse}}}, async (_request, reply) => {
    try {
      const db = getDatabase()
      db.read(() => { for (const table of HEALTH_TABLES) db.sqlite.prepare(`SELECT 1 FROM ${table} LIMIT 1`).get() })
      return {status: 'ok'}
    } catch { return reply.code(503).send({status: 503, code: 'DATABASE_UNAVAILABLE', message: 'FoodNoms database is unavailable'}) }
  })
  app.get('/openapi.json', {schema: {tags: ['system'], summary: 'Get the OpenAPI document', operationId: 'getOpenApi', querystring: EmptyQuery, response: {200: Type.Object({openapi: Type.Literal('3.1.2')}, {additionalProperties: true}), 400: ErrorResponse, 404: ErrorResponse}}}, async () => app.swagger())
  app.get('/v1/freshness', {schema: {tags: ['system'], summary: 'Get FoodNoms data freshness', description: 'Returns when FoodNoms data was most recently updated locally.', operationId: 'getFreshness', querystring: EmptyQuery, response: {200: FreshnessResponse, 400: ErrorResponse, 503: ErrorResponse}}}, async (_request, reply) => {
    try {
      return {lastUpdate: getDatabase().freshness()}
    } catch {
      return reply.code(503).send({status: 503, code: 'DATABASE_UNAVAILABLE', message: 'FoodNoms logistics database is unavailable'})
    }
  })

  app.get<{Params: {date: string}}>('/v1/days/:date', {schema: {tags: ['days'], summary: 'Get a complete day summary', operationId: 'getDay', params: Type.Object({date: DateString}, {additionalProperties: false}), querystring: EmptyQuery, response: {200: DayResponse, 400: ErrorResponse, 500: ErrorResponse}}}, async (request, reply) => {
    if (!isIsoDate(request.params.date)) return reply.code(400).send({status: 400, code: 'VALIDATION_ERROR', message: 'date must be a real ISO date'})
    const db = getDatabase()
    return db.read(() => { const summary = daySummary(db, request.params.date); return {date: summary.date, totals: summary.totals, goals: summary.goals, meals: summary.meals} })
  })
  for (const suffix of ['entries', 'meals', 'goals'] as const) {
    const itemSchema = suffix === 'entries' ? EntryResponse : suffix === 'meals' ? MealResponse : GoalResponse
    app.get<{Params: {date: string} }>(`/v1/days/:date/${suffix}`, {schema: {tags: ['days'], summary: `Get a day's ${suffix}`, operationId: `getDay${suffix[0]!.toUpperCase()}${suffix.slice(1)}`, params: Type.Object({date: DateString}, {additionalProperties: false}), querystring: EmptyQuery, response: {200: Type.Object({date: DateString, items: Type.Array(itemSchema)}, {additionalProperties: false}), 400: ErrorResponse, 500: ErrorResponse}}}, async (request, reply) => {
      if (!isIsoDate(request.params.date)) return reply.code(400).send({status: 400, code: 'VALIDATION_ERROR', message: 'date must be a real ISO date'})
      const db = getDatabase()
      const summary = db.read(() => daySummary(db, request.params.date))
      return suffix === 'entries' ? {date: summary.date, items: summary.entries} : suffix === 'meals' ? {date: summary.date, items: summary.meals} : {date: summary.date, items: summary.goals}
    })
  }

  app.get<{Querystring: {from: string; to: string}}>('/v1/days', {schema: {tags: ['days'], summary: 'Get an inclusive day range of at most 366 days', operationId: 'getDays', querystring: DateRangeQuery, response: {200: Type.Object({from: DateString, to: DateString, dayCount: Type.Integer(), totals: Totals, averages: Totals, items: Type.Array(RangeDayResponse)}, {additionalProperties: false}), 400: Type.Union([ErrorResponse, RangeTooLargeError]), 500: ErrorResponse}}}, async (request, reply) => {
    const {from, to} = request.query
    if (!isIsoDate(from) || !isIsoDate(to) || from > to) return reply.code(400).send({status: 400, code: 'VALIDATION_ERROR', message: 'from and to must be real ISO dates with from less than or equal to to'})
    if (inclusiveDayCount(from, to) > MAX_RANGE_DAYS) return reply.code(400).send({status: 400, code: 'RANGE_TOO_LARGE', message: 'Date ranges may contain at most 366 days'})
    const db = getDatabase()
    return db.read(() => rangeSummary(db, from, to))
  })

  for (const [path, collectionType, kind] of [['/v1/library/recipes', 3, 'recipes'], ['/v1/library/meals', 2, 'meals']] as const) {
    app.get(path, {schema: {tags: ['library'], summary: `List saved ${kind}`, operationId: collectionType === 3 ? 'listLibraryRecipes' : 'listLibraryMeals', querystring: EmptyQuery, response: {200: Type.Object({items: Type.Array(LibraryItem)}, {additionalProperties: false}), 400: ErrorResponse, 500: ErrorResponse}}}, async () => {
      const db = getDatabase()
      return db.read(() => listLibrary(db, collectionType))
    })
  }

  app.get<{Querystring: {q?: string; limit?: number; cursor?: string; sort?: 'name' | '-lastLoggedAt'}}>('/v1/foods', {schema: {tags: ['foods'], summary: 'List latest food snapshots', operationId: 'listFoods', querystring: Type.Object({q: Type.Optional(Type.String({minLength: 1, maxLength: 200})), limit: Type.Optional(Type.Integer({minimum: 1, maximum: 200, default: 50})), cursor: Type.Optional(Type.String({minLength: 1, maxLength: 1000})), sort: Type.Optional(Type.Union([Type.Literal('name'), Type.Literal('-lastLoggedAt')], {default: 'name'}))}, {additionalProperties: false}), response: {200: Type.Object({items: Type.Array(FoodResponse), nextCursor: Type.Optional(Type.String())}, {additionalProperties: false}), 400: ErrorResponse, 500: ErrorResponse}}}, async (request, reply) => {
    try { const db = getDatabase(); return db.read(() => listFoods(db, {q: request.query.q, limit: request.query.limit ?? 50, cursor: request.query.cursor, sort: request.query.sort ?? 'name'})) } catch (error) {
      if (error instanceof InvalidFoodCursorError) return reply.code(400).send({status: 400, code: 'VALIDATION_ERROR', message: error.message})
      throw error
    }
  })

  app.get<{Params: {foodId: string}}>('/v1/foods/:foodId', {schema: {tags: ['foods'], summary: 'Get the latest snapshot for one food', operationId: 'getFood', params: Type.Object({foodId: Type.String({minLength: 1, maxLength: 200})}, {additionalProperties: false}), querystring: EmptyQuery, response: {200: FoodResponse, 400: ErrorResponse, 404: ErrorResponse, 500: ErrorResponse}}}, async (request, reply) => {
    const db = getDatabase()
    const food = db.read(() => foodSnapshot(db, request.params.foodId))
    return food ?? reply.code(404).send({status: 404, code: 'NOT_FOUND', message: 'Food not found'})
  })
  return app
}

declare module 'fastify' {
  interface FastifyInstance {foodnoms: FoodNomsDatabase}
}
