import type { Request, Response, NextFunction } from 'express'

import { telemetry } from '@/services/telemetry.js'

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now()
  const route = req.route?.path ?? req.path

  // Track response when finished
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000
    const method = req.method
    const status = res.statusCode.toString()

    telemetry.httpRequestsTotal.inc({ method, route, status })
    telemetry.httpRequestDuration.observe({ method, route, status }, duration)
  })

  next()
}

