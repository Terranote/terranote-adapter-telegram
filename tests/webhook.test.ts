import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import pino from 'pino'

import { createApp } from '@/app.js'
import type { AppConfig } from '@/config.js'
import { CoreRequestFailedError, CoreRequestRejectedError } from '@/clients/terranote-core-client.js'
import { MessageProcessor, UnsupportedTelegramMessageError } from '@/services/message-processor.js'
import type { InteractionRequest } from '@/types/interaction.js'

class FakeCoreClient {
  readonly sendInteraction = vi.fn<[InteractionRequest], Promise<void>>()
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
    webhookSecret: 'secret'
  },
  notifier: {
    secretToken: undefined
  },
  metrics: {
    username: undefined,
    password: undefined
  }
}

const logger = pino({ level: 'silent' })

const buildApp = (overrides?: {
  coreClient?: FakeCoreClient
  config?: Partial<AppConfig>
  messageProcessor?: MessageProcessor
}) => {
  const coreClient = overrides?.coreClient ?? new FakeCoreClient()
  const messageProcessor =
    overrides?.messageProcessor ??
    new MessageProcessor()

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
    },
    metrics: {
      ...baseConfig.metrics,
      ...(configOverride?.metrics ?? {})
    }
  }

  const app = createApp({
    config,
    logger,
    coreClient: coreClient as any,
    messageProcessor
  })

  return { app, coreClient }
}

const headers = {
  'x-telegram-bot-api-secret-token': 'secret'
}

const baseUpdate = {
  update_id: 1,
  message: {
    message_id: 10,
    date: 1_720_000_000,
    from: {
      id: 12345
    },
    chat: {
      id: 12345,
      type: 'private'
    },
    text: 'Hola'
  }
}

describe('POST /telegram/webhook', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('retorna 403 si el token secreto no coincide', async () => {
    const { app } = buildApp()

    const response = await request(app)
      .post('/telegram/webhook')
      .set('x-telegram-bot-api-secret-token', 'otro')
      .send(baseUpdate)

    expect(response.statusCode).toBe(403)
    expect(response.body).toEqual({ status: 'forbidden' })
  })

  it('retorna 400 si el payload no es válido', async () => {
    const { app } = buildApp()

    const response = await request(app)
      .post('/telegram/webhook')
      .set(headers)
      .send({ foo: 'bar' })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({ status: 'invalid_update' })
  })

  it('ignora actualizaciones sin mensaje', async () => {
    const { app, coreClient } = buildApp()

    const response = await request(app)
      .post('/telegram/webhook')
      .set(headers)
      .send({
        update_id: 1
      })

    expect(response.statusCode).toBe(202)
    expect(response.body).toEqual({ status: 'ignored' })
    expect(coreClient.sendInteraction).not.toHaveBeenCalled()
  })

  it('procesa un mensaje de texto exitosamente', async () => {
    const { app, coreClient } = buildApp()

    coreClient.sendInteraction.mockResolvedValueOnce()

    const response = await request(app)
      .post('/telegram/webhook')
      .set(headers)
      .send(baseUpdate)

    expect(response.statusCode).toBe(202)
    expect(response.body).toEqual({ status: 'accepted' })
    expect(coreClient.sendInteraction).toHaveBeenCalledTimes(1)
    const interaction = coreClient.sendInteraction.mock.calls[0][0] as InteractionRequest
    expect(interaction.payload).toMatchObject({ type: 'text', text: 'Hola' })
  })

  it('responde 202 cuando el mensaje no está soportado', async () => {
    const messageProcessor = new MessageProcessor()
    vi.spyOn(messageProcessor, 'toInteraction').mockImplementation(() => {
      throw new UnsupportedTelegramMessageError('Unsupported')
    })

    const { app, coreClient } = buildApp({ messageProcessor })

    const response = await request(app)
      .post('/telegram/webhook')
      .set(headers)
      .send(baseUpdate)

    expect(response.statusCode).toBe(202)
    expect(response.body).toEqual({ status: 'unsupported' })
    expect(coreClient.sendInteraction).not.toHaveBeenCalled()
  })

  it('responde 502 cuando el core rechaza la interacción', async () => {
    const { app, coreClient } = buildApp()

    coreClient.sendInteraction.mockRejectedValueOnce(
      new CoreRequestRejectedError(400, 'bad request')
    )

    const response = await request(app)
      .post('/telegram/webhook')
      .set(headers)
      .send(baseUpdate)

    expect(response.statusCode).toBe(502)
    expect(response.body).toEqual({ status: 'core_error' })
  })

  it('responde 502 cuando el core es inaccesible', async () => {
    const { app, coreClient } = buildApp()

    coreClient.sendInteraction.mockRejectedValueOnce(
      new CoreRequestFailedError('network error')
    )

    const response = await request(app)
      .post('/telegram/webhook')
      .set(headers)
      .send(baseUpdate)

    expect(response.statusCode).toBe(502)
    expect(response.body).toEqual({ status: 'core_unreachable' })
  })
})

