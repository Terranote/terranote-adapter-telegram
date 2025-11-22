import { Router, type RequestHandler } from 'express'

import { type AppConfig } from '@/config.js'
import {
  CoreRequestFailedError,
  CoreRequestRejectedError,
  TerranoteCoreClient
} from '@/clients/terranote-core-client.js'
import { MessageProcessor, UnsupportedTelegramMessageError } from '@/services/message-processor.js'
import { telegramUpdateSchema } from '@/types/telegram.js'
import type { Logger } from '@/logger.js'

type WebhookDependencies = {
  config: AppConfig
  coreClient: TerranoteCoreClient
  messageProcessor: MessageProcessor
  logger: Logger
}

const verifySecret =
  (secret?: string): RequestHandler =>
  (req, res, next) => {
    if (!secret) {
      next()
      return
    }

    const headerToken = req.header('x-telegram-bot-api-secret-token')
    if (headerToken !== secret) {
      res.status(403).json({ status: 'forbidden' })
      return
    }

    next()
  }

export const createTelegramWebhookRouter = ({
  config,
  coreClient,
  messageProcessor,
  logger
}: WebhookDependencies): Router => {
  const router = Router()

  router.post(
    '/',
    verifySecret(config.telegram.webhookSecret),
    async (req, res, next) => {
      const parsed = telegramUpdateSchema.safeParse(req.body)

      if (!parsed.success) {
        logger.warn({
          error: parsed.error.flatten()
        }, 'invalid_update_payload')
        res.status(400).json({ status: 'invalid_update' })
        return
      }

      const update = parsed.data

      if (!update.message) {
        logger.info({ reason: 'missing_message' }, 'ignored_update')
        res.status(202).json({ status: 'ignored' })
        return
      }

      let interaction
      try {
        interaction = messageProcessor.toInteraction(update.message)
      } catch (error) {
        if (error instanceof UnsupportedTelegramMessageError) {
          logger.warn({
            message_id: update.message.message_id
          }, 'unsupported_message_type')
          // Unsupported messages are handled gracefully (202)
          res.status(202).json({ status: 'unsupported' })
          return
        }
        // Other errors should be handled by error handler
        next(error)
        return
      }

      try {
        await coreClient.sendInteraction(interaction)
      } catch (error) {
        // Pass error to error handler middleware
        next(error)
        return
      }

      logger.info({
        user_id: interaction.user_id,
        message_id: update.message.message_id
      }, 'interaction_forwarded')

      res.status(202).json({ status: 'accepted' })
    }
  )

  return router
}



