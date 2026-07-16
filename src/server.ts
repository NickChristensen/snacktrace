import type {FastifyInstance} from 'fastify'

import {buildApp} from './app.js'

function writeError(code: string, message: string): void {
  process.stderr.write(`${JSON.stringify({status: 500, code, message})}\n`)
}

async function main(): Promise<void> {
  const dbPath = process.env.FOODNOMS_DB_PATH
  if (!dbPath) {
    writeError('CONFIGURATION_ERROR', 'FOODNOMS_DB_PATH is required')
    process.exitCode = 1
    return
  }

  const host = process.env.HOST ?? '127.0.0.1'
  const port = Number(process.env.PORT ?? '3000')
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    writeError('CONFIGURATION_ERROR', 'PORT must be an integer from 1 through 65535')
    process.exitCode = 1
    return
  }

  let app: FastifyInstance | undefined
  try {
    app = await buildApp({dbPath})
    const shutdown = async (): Promise<void> => {
      await app?.close()
    }
    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)
    await app.listen({host, port})
  } catch (error) {
    if (app) {
      app.log.error({err: error}, 'server failed to start')
      await app.close()
    } else {
      writeError('STARTUP_ERROR', error instanceof Error ? error.message : 'Server failed to start')
    }
    process.exitCode = 1
  }
}

await main()
