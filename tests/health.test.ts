import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import pino from 'pino'

import { createApp } from '@/app.js'
import type { AppConfig } from '@/config.js'
import { TerranoteCoreClient } from '@/clients/terranote-core-client.js'
import { TelegramBotClient } from '@/clients/telegram-bot-client.js'

const config: AppConfig = {
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
    apiBaseUrl: 'https://api.telegram.org'
  },
  notifier: {
    secretToken: undefined
  },
  metrics: {
    username: undefined,
    password: undefined
  }
}

class FakeCoreClient {
  readonly sendInteraction = vi.fn()
}

class FakeTelegramBotClient {
  readonly sendTextMessage = vi.fn()
}

describe('GET /health', () => {
  const logger = pino({ level: 'silent' })

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('retorna información de salud detallada cuando todo está OK', async () => {
    // Mock successful responses
    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.includes('/api/v1/status')) {
        return Promise.resolve({
          ok: true,
          status: 200
        } as Response)
      }
      if (urlStr.includes('/getMe')) {
        return Promise.resolve({
          ok: true,
          status: 200
        } as Response)
      }
      return Promise.reject(new Error(`Unexpected URL: ${urlStr}`))
    })

    const app = createApp({
      config,
      logger,
      coreClient: new FakeCoreClient() as any,
      botClient: new FakeTelegramBotClient() as any
    })

    const response = await request(app).get('/health')

    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({
      status: 'ok',
      version: '0.1.0',
      environment: 'test',
      dependencies: {
        core: { status: 'ok' },
        telegram: { status: 'ok' }
      }
    })
    expect(response.body.uptime).toBeGreaterThanOrEqual(0)
  })

  it('retorna estado degraded cuando una dependencia falla', async () => {
    // Mock core failure
    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.includes('/api/v1/status')) {
        return Promise.reject(new Error('Connection refused'))
      }
      if (urlStr.includes('/getMe')) {
        return Promise.resolve({
          ok: true,
          status: 200
        } as Response)
      }
      return Promise.reject(new Error(`Unexpected URL: ${urlStr}`))
    })

    const app = createApp({
      config,
      logger,
      coreClient: new FakeCoreClient() as any,
      botClient: new FakeTelegramBotClient() as any
    })

    const response = await request(app).get('/health')

    expect(response.statusCode).toBe(200)
    expect(response.body.status).toBe('degraded') // Overall status is degraded when one dependency is down
    expect(response.body.dependencies.core.status).toBe('down')
    expect(response.body.dependencies.telegram.status).toBe('ok')
  })

  it('retorna 503 cuando el servicio está completamente caído', async () => {
    // Mock all failures
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

    const app = createApp({
      config,
      logger,
      coreClient: new FakeCoreClient() as any,
      botClient: new FakeTelegramBotClient() as any
    })

    const response = await request(app).get('/health')

    expect(response.statusCode).toBe(503)
    expect(response.body.status).toBe('down')
  })
})



