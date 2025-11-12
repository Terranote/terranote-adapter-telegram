import request from 'supertest'
import { describe, expect, it } from 'vitest'
import pino from 'pino'

import { createApp } from '@/app.js'
import type { AppConfig } from '@/config.js'

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
  }
}

describe('GET /health', () => {
  const logger = pino({ level: 'silent' })
  const app = createApp({
    config,
    logger
  })

  it('retorna un estado OK', async () => {
    const response = await request(app).get('/health')

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})

