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
    notification.note_url ? `Nota creada: ${notification.note_url}` : 'Nota creada',
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
  const validateSignature = verifySignature(config.notifier?.secretToken)

  router.post('/note-created', async (req, res, next) => {
    if (!validateSignature(req.header('x-terranote-signature') ?? undefined)) {
      res.status(401).json({ status: 'invalid_signature' })
      return
    }

    const parsed = noteCreatedNotificationSchema.safeParse(req.body)

    if (!parsed.success) {
      logger.warn({
        error: parsed.error.flatten()
      }, 'invalid_notification_payload')
      res.status(400).json({ status: 'invalid_notification' })
      return
    }

    const notification = parsed.data

    if (notification.channel !== 'telegram') {
      logger.info({ reason: 'different_channel', channel: notification.channel }, 'ignored_notification')
      res.status(202).json({ status: 'ignored' })
      return
    }

    try {
      await botClient.sendTextMessage(notification.user_id, formatNotification(notification))
    } catch (error) {
      // Pass error to error handler middleware
      next(error)
      return
    }

    logger.info({
      user_id: notification.user_id,
      note_id: notification.note_id
    }, 'notification_sent')

    res.status(202).json({ status: 'accepted' })
  })

  return router
}
