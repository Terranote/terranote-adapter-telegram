import { Router } from 'express'

import { telemetry } from '@/services/telemetry.js'

export const createMetricsRouter = (): Router => {
  const router = Router()

  router.get('/', (_req, res) => {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
    res.send(telemetry.exportPrometheus())
  })

  return router
}

