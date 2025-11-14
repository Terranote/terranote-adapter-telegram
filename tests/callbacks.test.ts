import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import pino from 'pino'

import { createApp } from '@/app.js'
import type { AppConfig } from '@/config.js'
import {
  TelegramBotClient,
  TelegramRequestFailedError,
  TelegramRequestRejectedError
} from '@/clients/telegram-bot-client.js'

class FakeCoreClient {
  readonly sendInteraction = vi.fn()
}

class FakeTelegramBotClient {
  readonly sendTextMessage = vi.fn<[chatId: string, text: string], Promise<void>>()
}

const baseConfig: AppConfig = {
  appEnv: 'test',
  server: {
    port: 0
  },
  core: {
    baseUrl: 'http://core.test',
    timeoutMs: 1000
  },
  telegram: {
    botToken: 'token',
    apiBaseUrl: 'https://api.telegram.org',
    webhookSecret: undefined
  },
  notifier: {
    secretToken: 'secret'
  }
}

const logger = pino({ level: 'silent' })

const buildApp = (overrides?: {
  botClient?: FakeTelegramBotClient
  config?: Partial<AppConfig>
}) => {
  const botClient = overrides?.botClient ?? new FakeTelegramBotClient()
  const configOverride = overrides?.config
  const config: AppConfig = {
    appEnv: configOverride?.appEnv ?? baseConfig.appEnv,
    server: {
      ...baseConfig.server,
      ...(configOverride?.server ?? {})
    },
    core: {
      ...baseConfig.core,
      ...(configOverride?.core ?? {})
    },
    telegram: {
      ...baseConfig.telegram,
      ...(configOverride?.telegram ?? {})
    },
    notifier: {
      ...baseConfig.notifier,
      ...(configOverride?.notifier ?? {})
    }
  }

  const app = createApp({
    config,
    logger,
    botClient: botClient as unknown as TelegramBotClient,
    coreClient: new FakeCoreClient() as any
  })

  return { app, botClient }
}

const headers = {
  'x-terranote-signature': 'secret'
}

const basePayload = {
  channel: 'telegram',
  user_id: '12345',
  note_url: 'https://www.openstreetmap.org/note/1',
  note_id: '1',
  latitude: 4.711,
  longitude: -74.072,
  text: 'Señal caída',
  created_at: new Date().toISOString()
}

describe('POST /callbacks/note-created', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('retorna 401 si la firma no coincide', async () => {
    const { app } = buildApp()

    const response = await request(app).post('/callbacks/note-created').send(basePayload)

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({ status: 'invalid_signature' })
  })

  it('retorna 400 si el payload es inválido', async () => {
    const { app } = buildApp()

    const response = await request(app)
      .post('/callbacks/note-created')
      .set(headers)
      .send({ foo: 'bar' })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({ status: 'invalid_notification' })
  })

  it('ignora notificaciones de otros canales', async () => {
    const { app, botClient } = buildApp()

    const response = await request(app)
      .post('/callbacks/note-created')
      .set(headers)
      .send({
        ...basePayload,
        channel: 'whatsapp'
      })

    expect(response.statusCode).toBe(202)
    expect(response.body).toEqual({ status: 'ignored' })
    expect(botClient.sendTextMessage).not.toHaveBeenCalled()
  })

  it('envía el mensaje cuando la notificación es válida', async () => {
    const { app, botClient } = buildApp()

    botClient.sendTextMessage.mockResolvedValueOnce()

    const response = await request(app)
      .post('/callbacks/note-created')
      .set(headers)
      .send(basePayload)

    expect(response.statusCode).toBe(202)
    expect(response.body).toEqual({ status: 'accepted' })
    expect(botClient.sendTextMessage).toHaveBeenCalledWith(
      '12345',
      expect.stringContaining('Nota creada')
    )
  })

  it('retorna 502 si Telegram rechaza la solicitud', async () => {
    const { app, botClient } = buildApp()

    botClient.sendTextMessage.mockRejectedValueOnce(
      new TelegramRequestRejectedError(400, 'bad request')
    )

    const response = await request(app)
      .post('/callbacks/note-created')
      .set(headers)
      .send(basePayload)

    expect(response.statusCode).toBe(502)
    expect(response.body).toEqual({ status: 'telegram_error' })
  })

  it('retorna 502 si Telegram no es alcanzable', async () => {
    const { app, botClient } = buildApp()

    botClient.sendTextMessage.mockRejectedValueOnce(
      new TelegramRequestFailedError('network error')
    )

    const response = await request(app)
      .post('/callbacks/note-created')
      .set(headers)
      .send(basePayload)

    expect(response.statusCode).toBe(502)
    expect(response.body).toEqual({ status: 'telegram_unreachable' })
  })
})
