import express from 'express'

import { type AppConfig } from '@/config.js'
import { TerranoteCoreClient } from '@/clients/terranote-core-client.js'
import type { Logger } from '@/logger.js'
import { createHealthRouter } from '@/routes/health.js'
import { createTelegramWebhookRouter } from '@/routes/webhook.js'
import { MessageProcessor } from '@/services/message-processor.js'

type CreateAppOptions = {
  config: AppConfig
  logger: Logger
  coreClient?: TerranoteCoreClient
  messageProcessor?: MessageProcessor
}

export const createApp = ({
  config,
  logger,
  coreClient,
  messageProcessor
}: CreateAppOptions): express.Express => {
  const app = express()

  app.use(express.json())

  const resolvedCoreClient = coreClient ?? new TerranoteCoreClient(config)
  const resolvedMessageProcessor = messageProcessor ?? new MessageProcessor()

  app.use('/health', createHealthRouter())
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

  return app
}

