import { Router } from 'express'

import type { AppConfig } from '@/config.js'
import { TerranoteCoreClient } from '@/clients/terranote-core-client.js'
import { TelegramBotClient } from '@/clients/telegram-bot-client.js'
import { HealthCheckService } from '@/services/health-check.js'

type HealthDependencies = {
  config: AppConfig
  coreClient?: TerranoteCoreClient
  botClient?: TelegramBotClient
}

export const createHealthRouter = ({
  config,
  coreClient,
  botClient
}: HealthDependencies): Router => {
  const router = Router()

  const resolvedCoreClient = coreClient ?? new TerranoteCoreClient(config)
  const resolvedBotClient = botClient ?? new TelegramBotClient(config)
  const healthCheck = new HealthCheckService(
    config,
    resolvedCoreClient,
    resolvedBotClient
  )

  router.get('/', async (_req, res) => {
    try {
      const health = await healthCheck.checkHealth()
      // Return 200 for 'ok' and 'degraded', 503 only for 'down'
      const statusCode = health.status === 'down' ? 503 : 200
      res.status(statusCode).json(health)
    } catch (error) {
      res.status(503).json({
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  return router
}



