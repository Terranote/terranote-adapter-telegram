import type { ErrorRequestHandler, Request, Response } from 'express'
import type { Logger } from '@/logger.js'
import {
  CoreRequestFailedError,
  CoreRequestRejectedError
} from '@/clients/terranote-core-client.js'
import {
  TelegramRequestFailedError,
  TelegramRequestRejectedError
} from '@/clients/telegram-bot-client.js'
import { UnsupportedTelegramMessageError } from '@/services/message-processor.js'

export interface ErrorResponse {
  status: string
  error?: string
  details?: Record<string, unknown>
  timestamp?: string
}

/**
 * Determines the appropriate HTTP status code for different error types
 */
function getErrorStatusCode(error: unknown): number {
  if (error instanceof CoreRequestRejectedError) {
    // Map Core API errors to appropriate status codes
    if (error.statusCode >= 400 && error.statusCode < 500) {
      // Client errors from Core (4xx) -> 400 Bad Request
      return 400
    }
    if (error.statusCode >= 500) {
      // Server errors from Core (5xx) -> 502 Bad Gateway
      return 502
    }
    // Other Core errors -> 502 Bad Gateway
    return 502
  }

  if (error instanceof TelegramRequestRejectedError) {
    // Telegram API errors -> 502 Bad Gateway
    return 502
  }

  if (error instanceof CoreRequestFailedError) {
    // Network/timeout errors -> 503 Service Unavailable
    return 503
  }

  if (error instanceof TelegramRequestFailedError) {
    // Network/timeout errors -> 503 Service Unavailable
    return 503
  }

  if (error instanceof UnsupportedTelegramMessageError) {
    // Unsupported message types -> 202 Accepted (but ignored)
    return 202
  }

  // Unknown errors -> 500 Internal Server Error
  return 500
}

/**
 * Extracts error details for logging and response
 */
function getErrorDetails(error: unknown): {
  message: string
  details: Record<string, unknown>
  isRetryable: boolean
} {
  const baseDetails: Record<string, unknown> = {}
  let message = 'Unknown error'
  let isRetryable = false

  if (error instanceof CoreRequestRejectedError) {
    message = `Core API rejected request: ${error.statusCode}`
    baseDetails.status_code = error.statusCode
    baseDetails.response_body = error.responseBody
    baseDetails.error_type = 'core_rejected'
    // 5xx errors might be retryable, 4xx are not
    isRetryable = error.statusCode >= 500
  } else if (error instanceof CoreRequestFailedError) {
    message = `Core API request failed: ${error.message}`
    baseDetails.error_type = 'core_failed'
    baseDetails.cause = error.cause instanceof Error ? error.cause.message : String(error.cause)
    // Network errors are usually retryable
    isRetryable = true
    // Check if it's a timeout
    if (error.message.includes('timeout') || error.message.includes('aborted')) {
      baseDetails.error_subtype = 'timeout'
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      baseDetails.error_subtype = 'connection_failed'
    }
  } else if (error instanceof TelegramRequestRejectedError) {
    message = `Telegram API rejected request: ${error.statusCode}`
    baseDetails.status_code = error.statusCode
    baseDetails.response_body = error.responseBody
    baseDetails.error_type = 'telegram_rejected'
    // Telegram API errors are usually not retryable (except rate limits)
    isRetryable = error.statusCode === 429 // Rate limit
    if (error.statusCode === 429) {
      baseDetails.error_subtype = 'rate_limit'
    } else if (error.statusCode === 400) {
      baseDetails.error_subtype = 'bad_request'
    } else if (error.statusCode === 403) {
      baseDetails.error_subtype = 'forbidden'
    }
  } else if (error instanceof TelegramRequestFailedError) {
    message = `Telegram API request failed: ${error.message}`
    baseDetails.error_type = 'telegram_failed'
    baseDetails.cause = error.cause instanceof Error ? error.cause.message : String(error.cause)
    // Network errors are usually retryable
    isRetryable = true
    // Check if it's a timeout
    if (error.message.includes('timeout') || error.message.includes('aborted')) {
      baseDetails.error_subtype = 'timeout'
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      baseDetails.error_subtype = 'connection_failed'
    }
  } else if (error instanceof UnsupportedTelegramMessageError) {
    message = `Unsupported message type: ${error.message}`
    baseDetails.error_type = 'unsupported_message'
    isRetryable = false
  } else if (error instanceof Error) {
    message = error.message
    baseDetails.error_type = 'unknown_error'
    baseDetails.error_name = error.name
    baseDetails.stack = error.stack
    isRetryable = false
  } else {
    message = String(error)
    baseDetails.error_type = 'unknown'
    isRetryable = false
  }

  return { message, details: baseDetails, isRetryable }
}

/**
 * Creates an Express error handler middleware with granular error handling
 */
export const createErrorHandler = (logger: Logger): ErrorRequestHandler => {
  return (error: unknown, req: Request, res: Response, _next: unknown): void => {
    const statusCode = getErrorStatusCode(error)
    const { message, details, isRetryable } = getErrorDetails(error)

    // Add request context to error details
    const errorContext = {
      method: req.method,
      path: req.path,
      user_id: req.body?.user_id || req.body?.from?.id || 'unknown',
      ...details
    }

    // Determine log level based on error type
    const isClientError = statusCode >= 400 && statusCode < 500
    const isServerError = statusCode >= 500

    if (isServerError) {
      logger.error(errorContext, `error_handled: ${message}`)
    } else if (isClientError) {
      logger.warn(errorContext, `client_error: ${message}`)
    } else {
      logger.info(errorContext, `error_handled: ${message}`)
    }

    // Build error response
    const errorResponse: ErrorResponse = {
      status: statusCode >= 500 ? 'error' : statusCode >= 400 ? 'invalid_request' : 'ignored',
      error: message,
      timestamp: new Date().toISOString()
    }

    // Include details in development, but not in production for security
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.details = {
        ...details,
        retryable: isRetryable
      }
    } else if (isRetryable) {
      // In production, only include retryable hint
      errorResponse.details = { retryable: true }
    }

    res.status(statusCode).json(errorResponse)
  }
}

