import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  APP_ENV: z
    .string()
    .trim()
    .default('development'),
  PORT: z
    .string()
    .transform((value) => Number.parseInt(value, 10))
    .pipe(z.number().int().min(1).max(65535))
    .default('3000'),
  CORE_API_BASE_URL: z
    .string()
    .trim()
    .default('http://localhost:8000'),
  CORE_API_TOKEN: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((value) => (value === '' ? undefined : value)),
  CORE_API_TIMEOUT_MS: z
    .string()
    .transform((value) => Number.parseInt(value, 10))
    .pipe(z.number().int().min(100).max(30000))
    .default('5000'),
  TELEGRAM_BOT_TOKEN: z
    .string()
    .trim(),
  TELEGRAM_API_BASE_URL: z
    .string()
    .trim()
    .default('https://api.telegram.org'),
  TELEGRAM_WEBHOOK_SECRET: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((value) => (value === '' ? undefined : value)),
  NOTIFIER_SECRET_TOKEN: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((value) => (value === '' ? undefined : value)),
  METRICS_USERNAME: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((value) => (value === '' ? undefined : value)),
  METRICS_PASSWORD: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((value) => (value === '' ? undefined : value))
})

export type AppConfig = {
  appEnv: string
  server: {
    port: number
  }
  core: {
    baseUrl: string
    token?: string
    timeoutMs: number
  }
  telegram: {
    botToken: string
    apiBaseUrl: string
    webhookSecret?: string
  }
  notifier: {
    secretToken?: string
  }
  metrics: {
    username?: string
    password?: string
  }
}

export const loadConfig = (): AppConfig => {
  const rawEnv = {
    APP_ENV: process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development',
    PORT: process.env.PORT ?? process.env.APP_PORT ?? '3000',
    CORE_API_BASE_URL: process.env.CORE_API_BASE_URL ?? 'http://localhost:8000',
    CORE_API_TOKEN: process.env.CORE_API_TOKEN,
    CORE_API_TIMEOUT_MS: process.env.CORE_API_TIMEOUT_MS ?? '5000',
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_API_BASE_URL: process.env.TELEGRAM_API_BASE_URL ?? 'https://api.telegram.org',
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
    NOTIFIER_SECRET_TOKEN: process.env.NOTIFIER_SECRET_TOKEN,
    METRICS_USERNAME: process.env.METRICS_USERNAME,
    METRICS_PASSWORD: process.env.METRICS_PASSWORD
  }

  const parsed = envSchema.safeParse(rawEnv)

  if (!parsed.success) {
    throw new Error(`Invalid configuration: ${parsed.error.message}`)
  }

  return {
    appEnv: parsed.data.APP_ENV,
    server: {
      port: parsed.data.PORT
    },
    core: {
      baseUrl: parsed.data.CORE_API_BASE_URL,
      token: parsed.data.CORE_API_TOKEN,
      timeoutMs: parsed.data.CORE_API_TIMEOUT_MS
    },
    telegram: {
      botToken: parsed.data.TELEGRAM_BOT_TOKEN,
      apiBaseUrl: parsed.data.TELEGRAM_API_BASE_URL,
      webhookSecret: parsed.data.TELEGRAM_WEBHOOK_SECRET
    },
    notifier: {
      secretToken: parsed.data.NOTIFIER_SECRET_TOKEN
    },
    metrics: {
      username: parsed.data.METRICS_USERNAME,
      password: parsed.data.METRICS_PASSWORD
    }
  }
}



