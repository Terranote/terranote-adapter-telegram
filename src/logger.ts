import pino from 'pino'

import type { AppConfig } from './config.js'

export type Logger = pino.Logger

export const createLogger = (config: AppConfig): Logger => {
  const isProduction = config.appEnv === 'production'

  // In production, logs go to stdout/stderr (captured by systemd/journald)
  // In development, use pino-pretty for readable console output
  // File logging should be configured via systemd/journald or logrotate
  // See: https://github.com/pinojs/pino/blob/master/docs/ecosystem.md#log-rotation
  return pino({
    level: isProduction ? 'info' : 'debug',
    transport: isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            singleLine: true
          }
        }
  })
}



