import express from 'express'

import { type AppConfig } from '@/config.js'
import { TerranoteCoreClient } from '@/clients/terranote-core-client.js'
import { TelegramBotClient } from '@/clients/telegram-bot-client.js'
import type { Logger } from '@/logger.js'
import { metricsMiddleware } from '@/middleware/metrics.js'
import { createErrorHandler } from '@/middleware/error-handler.js'
import { createCallbacksRouter } from '@/routes/callbacks.js'
import { createHealthRouter } from '@/routes/health.js'
import { createMetricsRouter } from '@/routes/metrics.js'
import { createTelegramWebhookRouter } from '@/routes/webhook.js'
import { MessageProcessor } from '@/services/message-processor.js'

type CreateAppOptions = {
  config: AppConfig
  logger: Logger
  coreClient?: TerranoteCoreClient
  botClient?: TelegramBotClient
  messageProcessor?: MessageProcessor
}

export const createApp = ({
  config,
  logger,
  coreClient,
  botClient,
  messageProcessor
}: CreateAppOptions): express.Express => {
  const app = express()

  app.use(express.json())
  app.use(metricsMiddleware)

  const resolvedCoreClient = coreClient ?? new TerranoteCoreClient(config)
  const resolvedBotClient = botClient ?? new TelegramBotClient(config)
  const resolvedMessageProcessor = messageProcessor ?? new MessageProcessor()

  app.use(
    '/health',
    createHealthRouter({
      config,
      coreClient: resolvedCoreClient,
      botClient: resolvedBotClient
    })
  )
  app.use(
    '/metrics',
    createMetricsRouter({
      config
    })
  )
  app.use(
    '/callbacks',
    createCallbacksRouter({
      config,
      botClient: resolvedBotClient,
      logger
    })
  )
  app.use(
    '/telegram/webhook',
    createTelegramWebhookRouter({
      config,
      coreClient: resolvedCoreClient,
      messageProcessor: resolvedMessageProcessor,
      logger
    })
  )

  app.use((_req, res) => {
    res.status(404).json({ status: 'not_found' })
  })

  // Error handler must be last
  app.use(createErrorHandler(logger))

  return app
}



