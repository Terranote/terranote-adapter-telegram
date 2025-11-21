import { loadConfig } from '@/config.js'
import { createApp } from '@/app.js'
import { createLogger } from '@/logger.js'

const config = loadConfig()
const logger = createLogger(config)

const app = createApp({
  config,
  logger
})

const server = app.listen(config.server.port, () => {
  logger.info(
    {
      port: config.server.port,
      environment: config.appEnv
    },
    'telegram adapter listening'
  )
})

const shutdown = (signal: NodeJS.Signals) => {
  logger.info({ signal }, 'received shutdown signal')
  server.close((error) => {
    if (error) {
      logger.error({ error }, 'error while closing server')
      process.exitCode = 1
    }
    process.exit()
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)



