# Monitoring Strategy for Terranote Telegram Adapter

## Overview

This document describes monitoring options and recommendations for the Terranote Telegram adapter and core services.

## Current State

### Terranote Core
- ✅ `/api/v1/status` - Health check with metrics
- ✅ `/metrics` - Prometheus metrics endpoint
- ✅ Metrics: `note_publication_attempts`, `note_publication_successes`, `note_publication_http_errors`, etc.

### Telegram Adapter
- ✅ `/health` - Basic health check (`{"status":"ok"}`)
- ❌ No metrics endpoint yet
- ❌ No detailed health information

## Monitoring Options

### Option A: Simple Health Checks (Minimal)

**Pros:**
- Easy to implement
- Low overhead
- Good for small deployments

**Cons:**
- Limited visibility
- No historical data
- Manual alerting setup

**Implementation:**
```bash
# Simple monitoring script (cron job)
*/5 * * * * curl -f https://terranote-tg.osm.lat/health || echo "Adapter down" | mail -s "Alert" admin@example.com
```

### Option B: Prometheus + Grafana (Recommended)

**Pros:**
- Rich metrics and dashboards
- Historical data
- Alerting with Alertmanager
- Industry standard

**Cons:**
- Requires additional infrastructure
- More complex setup

**Architecture:**
```
Telegram Adapter → /metrics → Prometheus → Grafana
Terranote Core   → /metrics → Prometheus → Grafana
```

**Metrics to track:**
- Request rate (requests/second)
- Error rate (4xx, 5xx)
- Response time (p50, p95, p99)
- Active connections
- Message processing time
- Core API call latency
- Telegram API call latency

### Option C: External Uptime Monitoring

**Services:**
- UptimeRobot (free tier: 50 monitors)
- Pingdom
- StatusCake
- Better Uptime

**Pros:**
- No infrastructure to maintain
- External perspective
- Email/SMS alerts

**Cons:**
- Limited to HTTP checks
- No detailed metrics
- External dependency

## Recommended Implementation

### Phase 1: Enhanced Health Endpoint

Add detailed health information to the adapter:

```typescript
// GET /health
{
  "status": "ok",
  "uptime": 3600,
  "version": "0.1.0",
  "dependencies": {
    "core": "ok",
    "telegram": "ok"
  }
}
```

### Phase 2: Prometheus Metrics

Add Prometheus client to the adapter:

```typescript
// GET /metrics
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="POST",route="/telegram/webhook",status="200"} 150

# HELP http_request_duration_seconds Request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 100
```

### Phase 3: Grafana Dashboard

Create dashboards for:
- Service health overview
- Request rates and errors
- Response times
- Message processing metrics
- Core API integration health

## Implementation Steps

1. **Add metrics to adapter** (similar to core)
2. **Configure Prometheus** to scrape both services
3. **Create Grafana dashboards**
4. **Set up Alertmanager** for critical alerts
5. **Document runbooks** for common issues

## Alerting Rules

Suggested alerts:
- Service down (health check fails)
- High error rate (>5% for 5 minutes)
- High latency (p95 > 1s for 5 minutes)
- Core API unavailable
- Telegram API unavailable

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Client for Node.js](https://github.com/siimon/prom-client)

