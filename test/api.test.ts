import {expect} from 'chai'
import Database from 'better-sqlite3'
import {afterEach, describe, it} from 'mocha'
import {execFileSync} from 'node:child_process'

import {buildApp} from '../src/app.js'
import {createFixture} from './fixture.js'

describe('SnackTrace API', () => {
  const apps: Awaited<ReturnType<typeof buildApp>>[] = []
  afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())))

  it('normalizes binary IDs, scales nutrients, resolves a Sunday override, and excludes entries without a day', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    const response = await app.inject('/v1/days/2026-07-12')
    expect(response.statusCode).to.equal(200)
    const body = response.json()
    const entries = body.meals[0].entries
    expect(entries).to.have.length(2)
    expect(entries[0].entryId).to.equal('00112233-4455-6677-8899-aabbccddeeff')
    expect(entries[0].nutrients.carbs).to.equal(23.75)
    expect(entries[0].nutrients).to.include({biotin: 1.9, chlorine: 2.85, sugarsAdded: 4.75})
    expect(body.goals.find((goal: {type: string}) => goal.type === 'calorie')).to.include({actual: 100, status: 'above', ratio: 1.1111})
    expect(body.goals.find((goal: {type: string}) => goal.type === 'carbohydrate')).to.include({status: 'within', ratio: null})
    expect(body.goals.find((goal: {type: string}) => goal.type === 'caffeine')).to.include({status: 'tracking', ratio: null})
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
    expect((await app.inject('/v1/days?from=2026-07-13&to=2026-07-12')).json()).to.include({code: 'VALIDATION_ERROR'})
    expect((await app.inject('/v1/foods?cursor=bad')).json()).to.include({code: 'VALIDATION_ERROR'})
    expect((await app.inject('/v1/foods/nope')).json()).to.include({status: 404, code: 'NOT_FOUND'})
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
      ['/v1/goals?unexpected=1', '/v1/goals'],
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
      ['/v1/goals', '/v1/goals'],
      ['/v1/foods/anything', '/v1/foods/{foodId}'],
    ] as const) {
      const response = await app.inject(url)
      expect(response.statusCode).to.equal(500)
      expect(response.json()).to.deep.equal({status: 500, code: 'INTERNAL_ERROR', message: 'Internal server error'})
      expect(document.paths[path].get.responses).to.have.property('500')
    }
    const foodList = await app.inject('/v1/foods')
    expect(foodList.statusCode).to.equal(400)
    expect(document.paths['/v1/foods'].get.responses).not.to.have.property('500')
  })

  it('returns an inclusive range with zero-entry days and daily goal status summaries', async () => {
    const app = await buildApp({dbPath: createFixture(), logger: false}); apps.push(app)
    const response = await app.inject('/v1/days?from=2026-07-12&to=2026-07-13')
    expect(response.statusCode).to.equal(200)
    const body = response.json()
    expect(body.dayCount).to.equal(2)
    expect(body.items).to.have.length(2)
    expect(body.items[1]).not.to.have.property('meals')
    expect(body.goalSummary.find((goal: {type: string}) => goal.type === 'calorie').statusCounts).to.deep.equal({above: 1, within: 1})
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
    expect(Object.keys(document.paths)).to.have.members(['/health', '/openapi.json', '/v1/days/{date}', '/v1/days/{date}/entries', '/v1/days/{date}/meals', '/v1/days/{date}/goals', '/v1/days', '/v1/goals', '/v1/foods', '/v1/foods/{foodId}'])
    execFileSync(process.execPath, ['--import', 'tsx', 'src/generate-openapi.ts'], {cwd: process.cwd(), env: {...process.env, FOODNOMS_DB_PATH: ''}})
  })
})
