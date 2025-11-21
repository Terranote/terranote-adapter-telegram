import request from 'supertest'
import { describe, expect, it } from 'vitest'
import pino from 'pino'

import { createApp } from '@/app.js'
import type { AppConfig } from '@/config.js'

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

describe('GET /metrics', () => {
  const logger = pino({ level: 'silent' })

  it('retorna métricas en formato Prometheus sin autenticación cuando no está configurada', async () => {
    const app = createApp({
      config: baseConfig,
      logger
    })

    const response = await request(app).get('/metrics')

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/plain')
    expect(response.text.length).toBeGreaterThan(0)
  })

  it('requiere autenticación básica cuando está configurada', async () => {
    const configWithAuth: AppConfig = {
      ...baseConfig,
      metrics: {
        username: 'admin',
        password: 'secret'
      }
    }

    const app = createApp({
      config: configWithAuth,
      logger
    })

    // Sin autenticación debe fallar
    const unauthResponse = await request(app).get('/metrics')
    expect(unauthResponse.statusCode).toBe(401)

    // Con autenticación debe funcionar
    const authResponse = await request(app)
      .get('/metrics')
      .auth('admin', 'secret')

    expect(authResponse.statusCode).toBe(200)
    expect(authResponse.headers['content-type']).toContain('text/plain')
  })

  it('incluye métricas HTTP después de hacer una petición', async () => {
    const app = createApp({
      config: baseConfig,
      logger
    })

    // Make a request to generate metrics
    await request(app).get('/health')

    const response = await request(app).get('/metrics')

    // Check that metrics text contains HTTP-related metrics
    expect(response.text).toMatch(/terranote_adapter_telegram_http/)
  })

  it('incluye métricas de Node.js por defecto', async () => {
    const app = createApp({
      config: baseConfig,
      logger
    })

    const response = await request(app).get('/metrics')

    // Default Node.js metrics should be present
    expect(response.text).toMatch(/process_|nodejs_/)
  })
})

