import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics
} from 'prom-client'

export class TelemetryService {
  private readonly registry: Registry

  // HTTP metrics
  readonly httpRequestsTotal: Counter<string>
  readonly httpRequestDuration: Histogram<string>

  // Core API metrics
  readonly coreApiCallsTotal: Counter<string>
  readonly coreApiCallDuration: Histogram<string>

  // Telegram API metrics
  readonly telegramApiCallsTotal: Counter<string>
  readonly telegramApiCallDuration: Histogram<string>

  // Message processing metrics
  readonly messagesProcessedTotal: Counter<string>
  readonly messagesForwardedTotal: Counter<string>
  readonly messagesFailedTotal: Counter<string>

  constructor() {
    this.registry = new Registry()

    // HTTP metrics
    this.httpRequestsTotal = new Counter({
      name: 'terranote_adapter_telegram_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry]
    })

    this.httpRequestDuration = new Histogram({
      name: 'terranote_adapter_telegram_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    })

    // Core API metrics
    this.coreApiCallsTotal = new Counter({
      name: 'terranote_adapter_telegram_core_api_calls_total',
      help: 'Total number of Core API calls',
      labelNames: ['status'],
      registers: [this.registry]
    })

    this.coreApiCallDuration = new Histogram({
      name: 'terranote_adapter_telegram_core_api_call_duration_seconds',
      help: 'Core API call duration in seconds',
      labelNames: ['status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    })

    // Telegram API metrics
    this.telegramApiCallsTotal = new Counter({
      name: 'terranote_adapter_telegram_telegram_api_calls_total',
      help: 'Total number of Telegram API calls',
      labelNames: ['status'],
      registers: [this.registry]
    })

    this.telegramApiCallDuration = new Histogram({
      name: 'terranote_adapter_telegram_telegram_api_call_duration_seconds',
      help: 'Telegram API call duration in seconds',
      labelNames: ['status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    })

    // Message processing metrics
    this.messagesProcessedTotal = new Counter({
      name: 'terranote_adapter_telegram_messages_processed_total',
      help: 'Total number of messages processed',
      labelNames: ['type', 'status'],
      registers: [this.registry]
    })

    this.messagesForwardedTotal = new Counter({
      name: 'terranote_adapter_telegram_messages_forwarded_total',
      help: 'Total number of messages forwarded to Core',
      registers: [this.registry]
    })

    this.messagesFailedTotal = new Counter({
      name: 'terranote_adapter_telegram_messages_failed_total',
      help: 'Total number of messages that failed processing',
      labelNames: ['reason'],
      registers: [this.registry]
    })

    // Collect default Node.js metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register: this.registry })
  }

  exportPrometheus(): string {
    return this.registry.metrics()
  }

  reset(): void {
    this.registry.clear()
  }
}

// Singleton instance
export const telemetry = new TelemetryService()

