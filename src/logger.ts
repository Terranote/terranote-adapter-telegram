import pino from 'pino'

import type { AppConfig } from './config.js'

export type Logger = pino.Logger

export const createLogger = (config: AppConfig): Logger => {
  const isProduction = config.appEnv === 'production'

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

