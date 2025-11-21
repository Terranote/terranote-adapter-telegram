import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { AppConfig } from '@/config.js'
import { TerranoteCoreClient } from '@/clients/terranote-core-client.js'
import { TelegramBotClient } from '@/clients/telegram-bot-client.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PACKAGE_JSON_PATH = join(__dirname, '../../package.json')

function getVersion(): string {
  try {
    const packageJson = JSON.parse(
      readFileSync(PACKAGE_JSON_PATH, 'utf-8')
    ) as { version?: string }
    return packageJson.version ?? '0.1.0'
  } catch {
    return '0.1.0'
  }
}

export type HealthStatus = 'ok' | 'degraded' | 'down'

export type DependencyHealth = {
  status: HealthStatus
  message?: string
}

export type HealthResponse = {
  status: HealthStatus
  uptime: number
  version: string
  environment: string
  dependencies: {
    core: DependencyHealth
    telegram: DependencyHealth
  }
}

const START_TIME = Date.now()

export class HealthCheckService {
  private readonly coreClient: TerranoteCoreClient
  private readonly botClient: TelegramBotClient
  private readonly config: AppConfig
  private readonly version: string

  constructor(
    config: AppConfig,
    coreClient: TerranoteCoreClient,
    botClient: TelegramBotClient
  ) {
    this.config = config
    this.coreClient = coreClient
    this.botClient = botClient
    this.version = getVersion()
  }

  async checkCore(): Promise<DependencyHealth> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => {
        controller.abort()
      }, 2000) // 2 second timeout for health check

      try {
        const response = await fetch(
          new URL('/api/v1/status', this.config.core.baseUrl),
          {
            method: 'GET',
            headers: {
              ...(this.config.core.token
                ? { Authorization: `Bearer ${this.config.core.token}` }
                : {})
            },
            signal: controller.signal
          }
        )

        clearTimeout(timeout)

        if (response.ok) {
          return { status: 'ok' }
        }

        return {
          status: 'degraded',
          message: `Core returned status ${response.status}`
        }
      } catch (error) {
        clearTimeout(timeout)
        throw error
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error'
      return {
        status: 'down',
        message: `Core unreachable: ${message}`
      }
    }
  }

  async checkTelegram(): Promise<DependencyHealth> {
    try {
      // Simple check: verify we can reach Telegram API
      // We use getMe endpoint which is lightweight
      const controller = new AbortController()
      const timeout = setTimeout(() => {
        controller.abort()
      }, 2000) // 2 second timeout for health check

      try {
        const endpoint = new URL(
          `/bot${this.config.telegram.botToken}/getMe`,
          this.config.telegram.apiBaseUrl
        )
        const response = await fetch(endpoint, {
          method: 'GET',
          signal: controller.signal
        })

        clearTimeout(timeout)

        if (response.ok) {
          return { status: 'ok' }
        }

        return {
          status: 'degraded',
          message: `Telegram API returned status ${response.status}`
        }
      } catch (error) {
        clearTimeout(timeout)
        throw error
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error'
      return {
        status: 'down',
        message: `Telegram API unreachable: ${message}`
      }
    }
  }

  async checkHealth(): Promise<HealthResponse> {
    const [coreHealth, telegramHealth] = await Promise.all([
      this.checkCore(),
      this.checkTelegram()
    ])

    // Determine overall status
    // 'down' only if both dependencies are down
    // 'degraded' if at least one is down or degraded
    let overallStatus: HealthStatus = 'ok'
    if (coreHealth.status === 'down' && telegramHealth.status === 'down') {
      overallStatus = 'down'
    } else if (
      coreHealth.status === 'down' ||
      telegramHealth.status === 'down' ||
      coreHealth.status === 'degraded' ||
      telegramHealth.status === 'degraded'
    ) {
      overallStatus = 'degraded'
    }

    const uptime = Math.floor((Date.now() - START_TIME) / 1000)

    return {
      status: overallStatus,
      uptime,
      version: this.version,
      environment: this.config.appEnv,
      dependencies: {
        core: coreHealth,
        telegram: telegramHealth
      }
    }
  }
}

