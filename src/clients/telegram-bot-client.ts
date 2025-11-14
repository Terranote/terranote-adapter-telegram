import type { AppConfig } from '@/config.js'

export class TelegramBotClientError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'TelegramBotClientError'
  }
}

export class TelegramRequestRejectedError extends TelegramBotClientError {
  readonly statusCode: number
  readonly responseBody: string

  constructor(statusCode: number, responseBody: string) {
    super(`Telegram Bot API rejected request with status ${statusCode}`)
    this.name = 'TelegramRequestRejectedError'
    this.statusCode = statusCode
    this.responseBody = responseBody
  }
}

export class TelegramRequestFailedError extends TelegramBotClientError {}

export class TelegramBotClient {
  private readonly baseUrl: URL
  private readonly botToken: string
  private readonly timeoutMs: number

  constructor(config: AppConfig) {
    this.baseUrl = new URL(config.telegram.apiBaseUrl)
    this.botToken = config.telegram.botToken
    this.timeoutMs = config.core.timeoutMs
  }

  async sendTextMessage(chatId: string, text: string): Promise<void> {
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, this.timeoutMs)

    try {
      const endpoint = new URL(`/bot${this.botToken}/sendMessage`, this.baseUrl)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        const body = await response.text()
        throw new TelegramRequestRejectedError(response.status, body)
      }
    } catch (error) {
      if (error instanceof TelegramBotClientError) {
        throw error
      }

      const message =
        error instanceof Error ? error.message : 'Unknown error while contacting Telegram'

      throw new TelegramRequestFailedError(message, { cause: error })
    } finally {
      clearTimeout(timeout)
    }
  }
}
