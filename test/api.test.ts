import {expect} from 'chai'
import Database from 'better-sqlite3'
import {afterEach, describe, it} from 'mocha'
import {execFileSync} from 'node:child_process'

import {buildApp} from '../src/app.js'
import {createCalibratedFixture, createFixture} from './fixture.js'

describe('SnackTrace API', () => {
  const apps: Awaited<ReturnType<typeof buildApp>>[] = []
  afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())))

  it('normalizes binary IDs, scales nutrients, bakes date-scoped goals, and excludes entries without a day', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    const response = await app.inject('/v1/days/2026-07-12')
    expect(response.statusCode).to.equal(200)
    const body = response.json()
    const entries = body.meals[0].entries
    expect(entries).to.have.length(2)
    expect(entries[0].entryId).to.equal('00112233-4455-6677-8899-aabbccddeeff')
    expect(entries[0]).to.include({calories: 95})
    expect(entries[0].nutrients.carbs).to.equal(23.75)
    expect(entries[0].nutrients).not.to.have.property('calories')
    expect(entries[0].nutrients).to.include({biotin: 1.9, chlorine: 2.85, sugarsAdded: 4.75})
    const goalKeys = ['goalId', 'type', 'target', 'lowerBound', 'upperBound', 'actual']
    for (const goal of body.goals) expect(goal).to.have.all.keys(goalKeys)
    const calorie = body.goals.find((goal: {type: string}) => goal.type === 'calorie')
    expect(calorie).to.include({actual: 100})
    const carbohydrate = body.goals.find((goal: {type: string}) => goal.type === 'carbohydrate')
    expect(carbohydrate).to.have.all.keys(goalKeys)
    const caffeine = body.goals.find((goal: {type: string}) => goal.type === 'caffeine')
    expect(caffeine).to.have.all.keys(goalKeys)
    const dateScopedGoals = (await app.inject('/v1/days/2026-07-12/goals')).json()
    expect(dateScopedGoals.date).to.equal('2026-07-12')
    for (const goal of dateScopedGoals.items) expect(goal).to.have.all.keys(goalKeys)
    expect(dateScopedGoals.items.find((goal: {type: string}) => goal.type === 'calorie')).to.include({actual: 100})
  })

  it('returns calibrated advanced goals through the HTTP API', async () => {
    const path = createCalibratedFixture()
    const writable = new Database(path)
    writable.exec('ALTER TABLE goalRuleRecord ADD COLUMN minimum REAL')
    writable.prepare("UPDATE energyStrategyRecord SET startDay = julianday('2026-07-12'), manualTotalEnergy = ?").run(2465.888555697443)
    writable.prepare("UPDATE weightGoalRecord SET desiredWeightChangePerWeek = ?").run(-0.226796)
    writable.prepare("UPDATE bodyMetricEntryRecord SET day = julianday('2026-07-12'), value = ?").run(83.3830032348633)
    writable.prepare("UPDATE macroGoalStrategyRecord SET startDay = julianday('2026-07-12'), mode = 3, proteinUnit = 'gramsPerBodyWeight', proteinValue = ?, fatUnit = 'grams', fatValue = 65, carbsUnit = 'remainder', toleranceValue = .1, toleranceUnit = 1").run(2.20462)
    writable.prepare("DELETE FROM goalRuleRecord WHERE goalType = 'calorie' AND isOverride = 1").run()
    writable.prepare('INSERT INTO goalRecord VALUES (?, ?, ?)').run(Buffer.from('abababababababababababababababab', 'hex'), 'fat', 4)
    writable.prepare("INSERT INTO goalRuleRecord (ruleID, goalType, startDay, mode, isOverride, dateCreated, minimum) VALUES (?, 'calorie', julianday('2026-07-12'), 4, 0, '2026-07-12', 1950)").run(Buffer.from('cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd', 'hex'))
    writable.close()

    const app = await buildApp({dbPath: path, logger: false}); apps.push(app)
    const response = await app.inject('/v1/days/2026-07-12')
    expect(response.statusCode).to.equal(200)
    const body = response.json()
    const goalKeys = ['goalId', 'type', 'target', 'lowerBound', 'upperBound', 'actual']
    for (const goal of body.goals) {
      expect(goal).to.have.all.keys(goalKeys)
      expect(goal.actual).to.be.a('number')
    }
    const expected = {
      calorie: {target: 2216.413, lowerBound: null, upperBound: 2216.413},
      protein: {target: 183.8278, lowerBound: 165.4451, upperBound: 202.2106},
      fat: {target: 65, lowerBound: 58.5, upperBound: 71.5},
      carbohydrate: {target: 224.0254, lowerBound: 201.6229, upperBound: 246.4279},
    } as const
    for (const [type, values] of Object.entries(expected)) {
      expect(body.goals.find((goal: {type: string}) => goal.type === type)).to.include(values)
    }
  })

  it('distinguishes unknown meal type IDs while preserving custom and null labels', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    const meals = (await app.inject('/v1/days/2026-07-14')).json().meals
    expect(meals.find((meal: {mealTypeId: string | null}) => meal.mealTypeId === '8')).to.include({name: 'Brunch'})
    expect(meals.find((meal: {mealTypeId: string | null}) => meal.mealTypeId === '7')).to.include({name: 'Meal 7'})
    expect(meals.find((meal: {mealTypeId: string | null}) => meal.mealTypeId === null)).to.include({name: 'Meal'})
  })

  it('validates strict dates and produces JSON errors', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    const response = await app.inject('/v1/days/2026-02-30')
    expect(response.statusCode).to.equal(400)
    expect(response.json()).to.deep.include({status: 400, code: 'VALIDATION_ERROR', message: 'date must be a real ISO date'})
  })

  it('reports unhealthy when a required FoodNoms table cannot be queried', async () => {
    const path = createFixture()
    const app = await buildApp({dbPath: path, logger: false}); apps.push(app)
    expect((await app.inject('/health')).json()).to.deep.equal({status: 'ok'})
    const writer = new Database(path)
    writer.exec('DROP TABLE goalRuleRecord')
    writer.close()
    const response = await app.inject('/health')
    expect(response.statusCode).to.equal(503)
    expect(response.json()).to.deep.equal({status: 503, code: 'DATABASE_UNAVAILABLE', message: 'FoodNoms database is unavailable'})
  })

  it('rejects unknown query parameters, invalid ranges, bad cursors, and missing foods', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    expect((await app.inject('/v1/foods?unknown=1')).statusCode).to.equal(400)
    expect((await app.inject('/v1/days?from=2026-07-13&to=2026-07-12')).json()).to.deep.equal({status: 400, code: 'VALIDATION_ERROR', message: 'from and to must be real ISO dates with from less than or equal to to'})
    expect((await app.inject('/v1/foods?cursor=bad')).json()).to.include({code: 'VALIDATION_ERROR'})
    expect((await app.inject('/v1/foods/nope')).json()).to.include({status: 404, code: 'NOT_FOUND'})
  })

  it('retires the undated goals route', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    const response = await app.inject('/v1/goals')
    expect(response.statusCode).to.equal(404)
    expect(response.json()).to.deep.equal({status: 404, code: 'NOT_FOUND', message: 'Route GET /v1/goals not found'})
  })

  it('normalizes malformed and oversized URL paths as API errors', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    for (const [url, status, issue] of [
      ['/v1/foods/%ZZ', 400, 'URL must be validly percent-encoded'],
      [`/v1/foods/${'a'.repeat(201)}`, 414, 'Path parameter exceeds the maximum length'],
    ] as const) {
      const response = await app.inject(url)
      expect(response.statusCode).to.equal(status)
      expect(response.headers['content-type']).to.match(/^application\/json/)
      expect(response.json()).to.deep.equal({status, code: 'VALIDATION_ERROR', message: 'Request validation failed', issues: [{path: 'url', message: issue}]})
    }
  })

  it('documents validation errors for every EmptyQuery route', async () => {
    const app = await buildApp({logger: false}); apps.push(app)
    await app.ready()
    const document = app.swagger() as {paths: Record<string, {get: {responses: Record<string, unknown>}}>}
    for (const [url, path] of [
      ['/health?unexpected=1', '/health'],
      ['/openapi.json?unexpected=1', '/openapi.json'],
      ['/v1/library/recipes?unexpected=1', '/v1/library/recipes'],
      ['/v1/library/meals?unexpected=1', '/v1/library/meals'],
      ['/v1/foods/anything?unexpected=1', '/v1/foods/{foodId}'],
    ] as const) {
      const response = await app.inject(url)
      expect(response.statusCode).to.equal(400)
      expect(response.json()).to.include({status: 400, code: 'VALIDATION_ERROR', message: 'Request validation failed'})
      expect(document.paths[path].get.responses).to.have.property('400')
    }
  })

  it('documents operational failures for every data route that reaches the 500 handler', async () => {
    const app = await buildApp({logger: false}); apps.push(app)
    await app.ready()
    const document = app.swagger() as {paths: Record<string, {get: {responses: Record<string, unknown>}}>}
    for (const [url, path] of [
      ['/v1/days/2026-07-12', '/v1/days/{date}'],
      ['/v1/days/2026-07-12/entries', '/v1/days/{date}/entries'],
      ['/v1/days/2026-07-12/meals', '/v1/days/{date}/meals'],
      ['/v1/days/2026-07-12/goals', '/v1/days/{date}/goals'],
      ['/v1/days?from=2026-07-12&to=2026-07-12', '/v1/days'],
      ['/v1/library/recipes', '/v1/library/recipes'],
      ['/v1/library/meals', '/v1/library/meals'],
      ['/v1/foods', '/v1/foods'],
      ['/v1/foods/anything', '/v1/foods/{foodId}'],
    ] as const) {
      const response = await app.inject(url)
      expect(response.statusCode).to.equal(500)
      expect(response.json()).to.deep.equal({status: 500, code: 'INTERNAL_ERROR', message: 'Internal server error'})
      expect(document.paths[path].get.responses).to.have.property('500')
    }
  })

  it('keeps invalid food cursors as validation errors while hiding operational failures', async () => {
    const path = createFixture()
    const app = await buildApp({dbPath: path, logger: false}); apps.push(app)
    const invalidCursor = await app.inject('/v1/foods?cursor=bad')
    expect(invalidCursor.statusCode).to.equal(400)
    expect(invalidCursor.json()).to.deep.equal({status: 400, code: 'VALIDATION_ERROR', message: 'Invalid cursor'})
    const writer = new Database(path)
    writer.exec('DROP TABLE foodEntryRecord')
    writer.close()
    const databaseFailure = await app.inject('/v1/foods')
    expect(databaseFailure.statusCode).to.equal(500)
    expect(databaseFailure.json()).to.deep.equal({status: 500, code: 'INTERNAL_ERROR', message: 'Internal server error'})
  })

  it('returns an inclusive range with zero-entry days and baked daily goals', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    const response = await app.inject('/v1/days?from=2026-07-12&to=2026-07-13')
    expect(response.statusCode).to.equal(200)
    const body = response.json()
    expect(body.dayCount).to.equal(2)
    expect(body.items).to.have.length(2)
    expect(body.items[1]).not.to.have.property('meals')
    expect(body).not.to.have.property('goalSummary')
    for (const item of body.items) for (const goal of item.goals) expect(goal).to.have.all.keys(['goalId', 'type', 'target', 'lowerBound', 'upperBound', 'actual'])
  })

  it('standardizes public calories as sibling fields', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    const day = (await app.inject('/v1/days/2026-07-12')).json()
    const entries = (await app.inject('/v1/days/2026-07-12/entries')).json()
    const meals = (await app.inject('/v1/days/2026-07-12/meals')).json()
    const range = (await app.inject('/v1/days?from=2026-07-12&to=2026-07-13')).json()
    const foods = (await app.inject('/v1/foods')).json()
    const food = (await app.inject('/v1/foods/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')).json()
    const expectTotals = (totals: {calories: number; nutrients: Record<string, number>}) => {
      expect(totals.calories).to.be.a('number')
      expect(totals.nutrients).not.to.have.property('calories')
    }
    expectTotals(day.totals)
    for (const meal of day.meals) { expectTotals(meal.totals); for (const item of meal.entries) { expect(item.calories).to.be.a('number'); expect(item.nutrients).not.to.have.property('calories') } }
    for (const item of entries.items) { expect(item.calories).to.be.a('number'); expect(item.nutrients).not.to.have.property('calories') }
    for (const meal of meals.items) { expectTotals(meal.totals); for (const item of meal.entries) expect(item.nutrients).not.to.have.property('calories') }
    expectTotals(range.totals)
    expectTotals(range.averages)
    for (const item of range.items) expectTotals(item.totals)
    for (const item of foods.items) expect(item.nutrients).not.to.have.property('calories')
    expect(food).to.include({calories: 100})
    expect(food.nutrients).not.to.have.property('calories')
    const rawCalorieAbsent = foods.items.find((item: {foodId: string}) => item.foodId === 'dddddddd-dddd-dddd-dddd-dddddddddddd')
    expect(rawCalorieAbsent).not.to.have.property('calories')
  })

  it('lists saved recipes and meals from normalized collection edits without exposing raw identifiers', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    const recipes = (await app.inject('/v1/library/recipes')).json()
    const meals = (await app.inject('/v1/library/meals')).json()
    expect(recipes.items.map((item: {name: string}) => item.name)).to.deep.equal(['alpha recipe', 'Bravo Recipe'])
    const recipe = recipes.items[0]
    expect(recipe).to.include({collectionId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', kind: 'recipe', type: 3, name: 'alpha recipe', createdAt: '2026-07-01T10:00:00.000Z', updatedAt: '2026-07-02T11:30:00.000Z'})
    expect(recipe.recipe).to.deep.equal({servings: 4, servingSizeUnit: 'portion', totalServingSize: 800})
    expect(recipe.metadata).to.deep.equal({color: '#fff', icon: 'fork.knife', url: 'https://example.test/alpha', notes: 'Fixture recipe'})
    expect(recipe.totals).to.deep.equal({calories: 155, nutrients: {protein: 8.25}})
    expect(recipe.servingTotals).to.deep.equal({calories: 38.75, nutrients: {protein: 2.0625}})
    expect(recipe.components.map((item: {name: string; collectionSortIndex: number | null}) => [item.name, item.collectionSortIndex])).to.deep.equal([['Oats', 1], ['Milk', null]])
    expect(recipe.components[0]).to.include({calories: 105})
    expect(recipe.components[0].measure).to.deep.equal({descriptionQuantity: 0.666, descriptionText: 'cup', traits: 0, unit: 'gram', value: 80})
    expect(recipe.components[0].nutrients).to.deep.equal({protein: 5.25})
    expect(recipe.components[0]).not.to.have.any.keys('entryId', 'foodId', 'collectionEditId')
    expect(meals.items).to.have.length(1)
    expect(meals.items[0]).to.include({kind: 'meal', type: 2, name: 'Breakfast Box'})
    expect(meals.items[0]).not.to.have.property('recipe')
    expect(meals.items[0]).not.to.have.property('servingTotals')
    expect(recipes.items[1]).to.include({name: 'Bravo Recipe'})
    expect(recipes.items[1]).not.to.have.property('servingTotals')
  })

  it('accepts inclusive ranges through 366 days and rejects longer ranges', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    const maximum = await app.inject('/v1/days?from=2024-01-01&to=2024-12-31')
    expect(maximum.statusCode).to.equal(200)
    expect(maximum.json()).to.include({from: '2024-01-01', to: '2024-12-31', dayCount: 366})
    const tooLarge = await app.inject('/v1/days?from=2024-01-01&to=2025-01-01')
    expect(tooLarge.statusCode).to.equal(400)
    expect(tooLarge.json()).to.deep.equal({status: 400, code: 'RANGE_TOO_LARGE', message: 'Date ranges may contain at most 366 days'})
  })

  it('paginates foods with an opaque cursor and retains undated latest snapshots', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    const first = (await app.inject('/v1/foods?limit=1')).json()
    expect(first.items).to.have.length(1)
    expect(first.nextCursor).to.be.a('string')
    const second = (await app.inject(`/v1/foods?limit=1&cursor=${encodeURIComponent(first.nextCursor)}`)).json()
    expect(second.items[0].foodId).not.to.equal(first.items[0].foodId)
    expect((await app.inject(`/v1/foods?q=apple&cursor=${encodeURIComponent(first.nextCursor)}`)).json()).to.include({code: 'VALIDATION_ERROR'})
    const undated = (await app.inject('/v1/foods/cccccccc-cccc-cccc-cccc-cccccccccccc')).json()
    expect(undated.name).to.equal('Undated')
  })

  it('completely and deterministically paginates snapshots without timestamps', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    for (const [sort, expected] of [
      ['name', ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc']],
      ['-lastLoggedAt', ['cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd']],
    ] as const) {
      const ids: string[] = []
      let cursor: string | undefined
      do {
        const query = new URLSearchParams({limit: '1', sort})
        if (cursor) query.set('cursor', cursor)
        const response = await app.inject(`/v1/foods?${query}`)
        expect(response.statusCode).to.equal(200)
        const page = response.json()
        ids.push(page.items[0].foodId)
        cursor = page.nextCursor
      } while (cursor)
      expect(ids).to.deep.equal(expected)
    }
  })

  it('searches only latest snapshots, breaking matching timestamps by record ID', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    const latest = await app.inject('/v1/foods?q=final')
    expect(latest.statusCode).to.equal(200)
    expect(latest.json().items[0]).to.include({foodId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Apple Final'})
    const historical = await app.inject('/v1/foods?q=historical')
    expect(historical.statusCode).to.equal(200)
    expect(historical.json().items).to.deep.equal([])
    const noTimestamp = await app.inject('/v1/foods?q=no%20timestamp%20latest')
    expect(noTimestamp.statusCode).to.equal(200)
    expect(noTimestamp.json().items[0]).to.include({foodId: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'No Timestamp Latest', lastLoggedAt: null})
  })

  it('builds the OpenAPI document without a database and exposes every documented path', async () => {
    const app = await buildApp({logger: false}); apps.push(app)
    await app.ready()
    const document = app.swagger() as {paths: Record<string, unknown>}
    expect(Object.keys(document.paths)).to.have.members(['/health', '/openapi.json', '/v1/days/{date}', '/v1/days/{date}/entries', '/v1/days/{date}/meals', '/v1/days/{date}/goals', '/v1/days', '/v1/library/recipes', '/v1/library/meals', '/v1/foods', '/v1/foods/{foodId}'])
    expect(document.paths).not.to.have.property('/v1/goals')
    const daysRange = document.paths['/v1/days'] as {get: {summary: string; parameters: Array<{name: string; description: string}>}}
    expect(daysRange.get.summary).to.equal('Get an inclusive day range of at most 366 days')
    expect(daysRange.get.parameters.find((parameter) => parameter.name === 'to')?.description).to.include('at most 366 days')
    type Schema = {properties?: Record<string, unknown>; required?: string[]; type?: string | string[]; anyOf?: Schema[]; oneOf?: Schema[]}
    const schemaTypes = (value: unknown): string[] => {
      const schema = value as Schema
      if (Array.isArray(schema.type)) return schema.type
      if (typeof schema.type === 'string') return [schema.type]
      return [...(schema.anyOf ?? []), ...(schema.oneOf ?? [])].flatMap(schemaTypes)
    }
    const visit = (value: unknown): void => {
      if (!value || typeof value !== 'object') return
      const schema = value as Schema
      const nutrients = schema.properties?.nutrients as {properties?: Record<string, unknown>} | undefined
      if (nutrients) expect(nutrients.properties).not.to.have.property('calories')
      if (Array.isArray(schema.required) && schema.required.includes('goalId')) {
        expect(schema.required).to.deep.equal(['goalId', 'type', 'target', 'lowerBound', 'upperBound', 'actual'])
        expect(Object.keys(schema.properties ?? {})).to.deep.equal(['goalId', 'type', 'target', 'lowerBound', 'upperBound', 'actual'])
        const properties = schema.properties ?? {}
        for (const key of ['target', 'lowerBound', 'upperBound']) expect(schemaTypes(properties[key]).sort()).to.deep.equal(['null', 'number'])
        expect(schemaTypes(properties.actual)).to.deep.equal(['number'])
      }
      for (const child of Object.values(value as Record<string, unknown>)) visit(child)
    }
    visit(document)
    execFileSync(process.execPath, ['--import', 'tsx', 'src/generate-openapi.ts'], {cwd: process.cwd(), env: {...process.env, FOODNOMS_DB_PATH: ''}})
  })
})
