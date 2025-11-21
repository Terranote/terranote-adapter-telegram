# Monitoring Strategy for Terranote Telegram Adapter

## Overview

This document describes monitoring options and recommendations for the Terranote Telegram adapter and core services.

## Current State

### Terranote Core
- ✅ `/api/v1/status` - Health check with metrics
- ✅ `/metrics` - Prometheus metrics endpoint
- ✅ Metrics: `note_publication_attempts`, `note_publication_successes`, `note_publication_http_errors`, etc.

### Telegram Adapter
- ✅ `/health` - Health check with detailed information (uptime, version, dependencies)
- ✅ `/metrics` - Prometheus metrics endpoint
- ✅ Metrics: HTTP requests, Core API calls, Telegram API calls, message processing

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

## Viewing Metrics

### Option 1: Direct Access to Metrics Endpoint

You can view raw Prometheus metrics directly:

```bash
# View adapter metrics
curl http://localhost:3000/metrics

# View core metrics
curl http://localhost:8002/metrics
```

**Example output:**
```
# HELP terranote_adapter_telegram_http_requests_total Total number of HTTP requests
# TYPE terranote_adapter_telegram_http_requests_total counter
terranote_adapter_telegram_http_requests_total{method="GET",route="/health",status="200"} 5

# HELP terranote_adapter_telegram_http_request_duration_seconds HTTP request duration in seconds
# TYPE terranote_adapter_telegram_http_request_duration_seconds histogram
terranote_adapter_telegram_http_request_duration_seconds_bucket{method="GET",route="/health",status="200",le="0.01"} 4
```

### Option 2: Prometheus UI

If Prometheus is configured (see `terranote-infra`), you can:

1. **Access Prometheus UI**: `http://localhost:9090`
2. **Query metrics** using PromQL:
   ```promql
   # Request rate
   rate(terranote_adapter_telegram_http_requests_total[5m])
   
   # Error rate
   rate(terranote_adapter_telegram_http_requests_total{status=~"5.."}[5m])
   
   # Response time (p95)
   histogram_quantile(0.95, 
     rate(terranote_adapter_telegram_http_request_duration_seconds_bucket[5m])
   )
   
   # Core API call success rate
   rate(terranote_adapter_telegram_core_api_calls_total{status="success"}[5m]) / 
   rate(terranote_adapter_telegram_core_api_calls_total[5m])
   ```

### Option 3: Grafana Dashboards

If Grafana is configured, you can create dashboards to visualize:

- **Service Overview**: Request rates, error rates, uptime
- **API Performance**: Core API and Telegram API latency
- **Message Processing**: Messages processed, forwarded, failed
- **System Metrics**: CPU, memory, Node.js metrics

### Option 4: Health Endpoint

Quick health check with dependency status:

```bash
curl http://localhost:3000/health | jq
```

**Example output:**
```json
{
  "status": "ok",
  "uptime": 3600,
  "version": "0.1.0",
  "environment": "production",
  "dependencies": {
    "core": {
      "status": "ok"
    },
    "telegram": {
      "status": "ok"
    }
  }
}
```

## Available Metrics

### HTTP Metrics
- `terranote_adapter_telegram_http_requests_total` - Total HTTP requests (labels: method, route, status)
- `terranote_adapter_telegram_http_request_duration_seconds` - Request duration histogram

### Core API Metrics
- `terranote_adapter_telegram_core_api_calls_total` - Total Core API calls (label: status)
- `terranote_adapter_telegram_core_api_call_duration_seconds` - Core API call duration

### Telegram API Metrics
- `terranote_adapter_telegram_telegram_api_calls_total` - Total Telegram API calls (label: status)
- `terranote_adapter_telegram_telegram_api_call_duration_seconds` - Telegram API call duration

### Message Processing Metrics
- `terranote_adapter_telegram_messages_processed_total` - Messages processed (labels: type, status)
- `terranote_adapter_telegram_messages_forwarded_total` - Messages forwarded to Core
- `terranote_adapter_telegram_messages_failed_total` - Messages that failed (label: reason)

### Node.js Default Metrics
- `process_cpu_user_seconds_total` - CPU usage
- `process_resident_memory_bytes` - Memory usage
- `nodejs_heap_size_total_bytes` - Heap size
- And more (see [prom-client default metrics](https://github.com/siimon/prom-client#default-metrics))

## Quick Start: Viewing Metrics Locally

1. **Start the adapter**:
   ```bash
   npm start
   ```

2. **Make some requests** to generate metrics:
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/metrics
   ```

3. **View metrics**:
   ```bash
   curl http://localhost:3000/metrics | grep terranote_adapter_telegram
   ```

4. **Filter specific metrics**:
   ```bash
   # HTTP requests
   curl -s http://localhost:3000/metrics | grep http_requests_total
   
   # Core API calls
   curl -s http://localhost:3000/metrics | grep core_api_calls_total
   ```

## Production: Using Prometheus

For production monitoring, configure Prometheus to scrape the metrics endpoint:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'terranote-adapter-telegram'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
        labels:
          service: 'telegram-adapter'
  
  - job_name: 'terranote-core'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:8002']
        labels:
          service: 'core'
```

Then access Prometheus UI at `http://localhost:9090` to query and visualize metrics.

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Prometheus Querying](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Client for Node.js](https://github.com/siimon/prom-client)

