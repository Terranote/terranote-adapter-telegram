import { Router } from 'express'

import type { AppConfig } from '@/config.js'
import {
  TelegramBotClient,
  TelegramRequestFailedError,
  TelegramRequestRejectedError
} from '@/clients/telegram-bot-client.js'
import type { Logger } from '@/logger.js'
import {
  noteCreatedNotificationSchema,
  type NoteCreatedNotification
} from '@/types/notifications.js'

type CallbacksDependencies = {
  config: AppConfig
  botClient: TelegramBotClient
  logger: Logger
}

const verifySignature =
  (secret?: string) =>
  (headerToken?: string): boolean =>
    secret ? headerToken === secret : true

const formatNotification = (notification: NoteCreatedNotification): string =>
  [
    `Nota creada: ${notification.note_url}`,
    `Lat: ${notification.latitude}, Lon: ${notification.longitude}`,
    '',
    notification.text
  ].join('\n')

export const createCallbacksRouter = ({
  config,
  botClient,
  logger
}: CallbacksDependencies): Router => {
  const router = Router()
  const validateSignature = verifySignature(config.notifier.secretToken)

  router.post('/note-created', async (req, res) => {
    if (!validateSignature(req.header('x-terranote-signature') ?? undefined)) {
      res.status(401).json({ status: 'invalid_signature' })
      return
    }

    const parsed = noteCreatedNotificationSchema.safeParse(req.body)

    if (!parsed.success) {
      logger.warn('invalid_notification_payload', {
        error: parsed.error.flatten()
      })
      res.status(400).json({ status: 'invalid_notification' })
      return
    }

    const notification = parsed.data

    if (notification.channel !== 'telegram') {
      logger.info('ignored_notification', { reason: 'different_channel', channel: notification.channel })
      res.status(202).json({ status: 'ignored' })
      return
    }

    try {
      await botClient.sendTextMessage(notification.user_id, formatNotification(notification))
    } catch (error) {
      if (error instanceof TelegramRequestRejectedError) {
        logger.error('telegram_rejected_notification', {
          status_code: error.statusCode,
          response: error.responseBody,
          user_id: notification.user_id
        })
        res.status(502).json({ status: 'telegram_error' })
        return
      }

      if (error instanceof TelegramRequestFailedError) {
        logger.error('telegram_unreachable', {
          error: error.message,
          user_id: notification.user_id
        })
        res.status(502).json({ status: 'telegram_unreachable' })
        return
      }

      throw error
    }

    logger.info('notification_sent', {
      user_id: notification.user_id,
      note_id: notification.note_id
    })

    res.status(202).json({ status: 'accepted' })
  })

  return router
}


