import { Router } from 'express'
import basicAuth from 'express-basic-auth'

import type { AppConfig } from '@/config.js'
import { telemetry } from '@/services/telemetry.js'

type MetricsDependencies = {
  config: AppConfig
}

export const createMetricsRouter = ({
  config
}: MetricsDependencies): Router => {
  const router = Router()

  // Add basic auth if credentials are configured
  if (config.metrics.username && config.metrics.password) {
    router.use(
      basicAuth({
        users: {
          [config.metrics.username]: config.metrics.password
        },
        challenge: true,
        realm: 'Terranote Metrics'
      })
    )
  }

  router.get('/', async (_req, res) => {
    try {
      const metrics = await telemetry.exportPrometheus()
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
      res.send(metrics)
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to export metrics'
      })
    }
  })

  return router
}

