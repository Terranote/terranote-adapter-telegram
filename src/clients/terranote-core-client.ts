import { type AppConfig } from '@/config.js'
import { telemetry } from '@/services/telemetry.js'
import { interactionRequestSchema, type InteractionRequest } from '@/types/interaction.js'

export class CoreClientError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'CoreClientError'
  }
}

export class CoreRequestRejectedError extends CoreClientError {
  readonly statusCode: number
  readonly responseBody: string

  constructor(statusCode: number, responseBody: string) {
    super(`Core API rejected request with status ${statusCode}`)
    this.name = 'CoreRequestRejectedError'
    this.statusCode = statusCode
    this.responseBody = responseBody
  }
}

export class CoreRequestFailedError extends CoreClientError {}

export class TerranoteCoreClient {
  private readonly baseUrl: URL
  private readonly token?: string
  private readonly timeoutMs: number

  constructor(config: AppConfig) {
    this.baseUrl = new URL(config.core.baseUrl)
    this.token = config.core.token
    this.timeoutMs = config.core.timeoutMs
  }

  async sendInteraction(interaction: InteractionRequest): Promise<void> {
    const payload = interactionRequestSchema.parse(interaction)
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, this.timeoutMs)

    const startTime = Date.now()
    let status = 'success'

    try {
      const response = await fetch(new URL('/api/v1/interactions', this.baseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      if (!response.ok) {
        status = 'error'
        const body = await response.text()
        throw new CoreRequestRejectedError(response.status, body)
      }
    } catch (error) {
      if (error instanceof CoreClientError) {
        status = 'error'
        throw error
      }

      status = 'error'
      const message =
        error instanceof Error ? error.message : 'Unknown error while contacting core API'

      throw new CoreRequestFailedError(message, { cause: error })
    } finally {
      clearTimeout(timeout)
      const duration = (Date.now() - startTime) / 1000
      telemetry.coreApiCallsTotal.inc({ status })
      telemetry.coreApiCallDuration.observe({ status }, duration)
    }
  }
}



