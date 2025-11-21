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
  },
  notifier: {
    secretToken: undefined
  }
}

describe('GET /metrics', () => {
  const logger = pino({ level: 'silent' })
  const app = createApp({
    config,
    logger
  })

  it('retorna métricas en formato Prometheus', async () => {
    const response = await request(app).get('/metrics')

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/plain')
    expect(response.text).toContain('# HELP')
    expect(response.text).toContain('# TYPE')
  })

  it('incluye métricas HTTP', async () => {
    // Make a request to generate metrics
    await request(app).get('/health')

    const response = await request(app).get('/metrics')

    expect(response.text).toContain('terranote_adapter_telegram_http_requests_total')
    expect(response.text).toContain('terranote_adapter_telegram_http_request_duration_seconds')
  })

  it('incluye métricas de Node.js por defecto', async () => {
    const response = await request(app).get('/metrics')

    expect(response.text).toContain('process_cpu_user_seconds_total')
    expect(response.text).toContain('process_resident_memory_bytes')
  })
})

