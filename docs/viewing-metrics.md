# Guía: Cómo Ver los Datos de Monitoreo

Esta guía práctica explica cómo acceder y visualizar las métricas del adaptador de Telegram.

## Métodos Disponibles

### 1. Ver Métricas Directamente (curl)

La forma más simple de ver las métricas es acceder directamente al endpoint:

```bash
# Ver todas las métricas
curl http://localhost:3000/metrics

# Filtrar métricas específicas
curl -s http://localhost:3000/metrics | grep terranote_adapter_telegram_http_requests_total

# Ver métricas del Core
curl http://localhost:8002/metrics
```

**Ejemplo de salida:**
```
# HELP terranote_adapter_telegram_http_requests_total Total number of HTTP requests
# TYPE terranote_adapter_telegram_http_requests_total counter
terranote_adapter_telegram_http_requests_total{method="GET",route="/health",status="200"} 10
terranote_adapter_telegram_http_requests_total{method="POST",route="/telegram/webhook",status="202"} 5

# HELP terranote_adapter_telegram_http_request_duration_seconds HTTP request duration in seconds
# TYPE terranote_adapter_telegram_http_request_duration_seconds histogram
terranote_adapter_telegram_http_request_duration_seconds_bucket{method="GET",route="/health",status="200",le="0.01"} 9
```

### 2. Ver Health Check Detallado

El endpoint `/health` proporciona información resumida:

```bash
curl http://localhost:3000/health | jq
```

**Salida:**
```json
{
  "status": "ok",
  "uptime": 86400,
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

### 3. Usar Prometheus UI (Recomendado para Producción)

Si tienes Prometheus configurado:

1. **Acceder a la UI**: `http://localhost:9090`

2. **Consultar métricas** usando PromQL:

   ```promql
   # Tasa de requests por segundo
   rate(terranote_adapter_telegram_http_requests_total[5m])
   
   # Tasa de errores
   rate(terranote_adapter_telegram_http_requests_total{status=~"4..|5.."}[5m])
   
   # Tiempo de respuesta (p95)
   histogram_quantile(0.95, 
     rate(terranote_adapter_telegram_http_request_duration_seconds_bucket[5m])
   )
   
   # Latencia del Core API
   histogram_quantile(0.95,
     rate(terranote_adapter_telegram_core_api_call_duration_seconds_bucket[5m])
   )
   
   # Mensajes procesados por minuto
   rate(terranote_adapter_telegram_messages_processed_total[1m]) * 60
   ```

3. **Gráficos**: Prometheus puede generar gráficos básicos de las consultas

### 4. Usar Grafana (Recomendado para Dashboards)

Si tienes Grafana configurado:

1. **Acceder a Grafana**: `http://localhost:3001` (puerto por defecto)

2. **Crear un dashboard** con paneles para:
   - Request rate (gráfico de líneas)
   - Error rate (gráfico de líneas)
   - Response time percentiles (gráfico de líneas)
   - API call latency (gráfico de líneas)
   - Mensajes procesados (contador)

3. **Consultas de ejemplo para Grafana**:
   ```promql
   # Request rate
   sum(rate(terranote_adapter_telegram_http_requests_total[5m])) by (route)
   
   # Error percentage
   sum(rate(terranote_adapter_telegram_http_requests_total{status=~"4..|5.."}[5m])) 
   / 
   sum(rate(terranote_adapter_telegram_http_requests_total[5m])) * 100
   
   # P95 response time
   histogram_quantile(0.95,
     sum(rate(terranote_adapter_telegram_http_request_duration_seconds_bucket[5m])) by (le, route)
   )
   ```

## Métricas Disponibles

### Métricas HTTP

```bash
# Total de requests
curl -s http://localhost:3000/metrics | grep http_requests_total

# Duración de requests
curl -s http://localhost:3000/metrics | grep http_request_duration_seconds
```

**Labels disponibles:**
- `method`: GET, POST, etc.
- `route`: /health, /telegram/webhook, /callbacks/note-created
- `status`: 200, 202, 400, 502, etc.

### Métricas del Core API

```bash
# Llamadas al Core
curl -s http://localhost:3000/metrics | grep core_api_calls_total

# Latencia del Core
curl -s http://localhost:3000/metrics | grep core_api_call_duration_seconds
```

**Labels disponibles:**
- `status`: success, error

### Métricas de Telegram API

```bash
# Llamadas a Telegram
curl -s http://localhost:3000/metrics | grep telegram_api_calls_total

# Latencia de Telegram
curl -s http://localhost:3000/metrics | grep telegram_api_call_duration_seconds
```

**Labels disponibles:**
- `status`: success, error

### Métricas de Procesamiento de Mensajes

```bash
# Mensajes procesados
curl -s http://localhost:3000/metrics | grep messages_processed_total

# Mensajes enviados al Core
curl -s http://localhost:3000/metrics | grep messages_forwarded_total

# Mensajes fallidos
curl -s http://localhost:3000/metrics | grep messages_failed_total
```

## Ejemplos Prácticos

### Verificar que el servicio está funcionando

```bash
# Health check rápido
curl -s http://localhost:3000/health | jq '.status'
# Debe retornar: "ok"
```

### Ver cuántos requests se han procesado

```bash
curl -s http://localhost:3000/metrics | \
  grep 'terranote_adapter_telegram_http_requests_total' | \
  grep 'status="200"'
```

### Ver latencia promedio

```bash
# En Prometheus UI, usar:
histogram_quantile(0.50,
  rate(terranote_adapter_telegram_http_request_duration_seconds_bucket[5m])
)
```

### Monitorear errores

```bash
# Ver requests con errores
curl -s http://localhost:3000/metrics | \
  grep 'http_requests_total' | \
  grep -E 'status="(4|5)[0-9]{2}"'
```

## En Producción

### Servidor de Producción (192.168.0.7)

```bash
# Ver métricas del adaptador
curl https://terranote-tg.osm.lat/metrics

# Ver health check
curl https://terranote-tg.osm.lat/health | jq

# Ver métricas del core (si está expuesto)
curl http://192.168.0.7:8002/metrics
```

### Con Prometheus Configurado

Si Prometheus está scrapeando los servicios, puedes:

1. **Verificar targets en Prometheus**:
   - Ir a `http://localhost:9090/targets`
   - Verificar que `terranote-adapter-telegram` y `terranote-core` estén "UP"

2. **Explorar métricas**:
   - Ir a `http://localhost:9090/graph`
   - Escribir el nombre de una métrica en el campo de búsqueda
   - Ejecutar la consulta

3. **Crear alertas** (ver `terranote-infra/docs/next-steps.md`)

## Troubleshooting

### No se ven métricas

1. Verificar que el servicio esté corriendo:
   ```bash
   curl http://localhost:3000/health
   ```

2. Verificar que el endpoint de métricas responda:
   ```bash
   curl -I http://localhost:3000/metrics
   # Debe retornar: HTTP/1.1 200 OK
   ```

3. Verificar logs:
   ```bash
   sudo journalctl -u terranote-adapter-telegram -n 50
   ```

### Métricas están vacías

Las métricas solo aparecen después de que se hayan procesado requests. Haz algunas peticiones:

```bash
# Generar algunas métricas
curl http://localhost:3000/health
curl http://localhost:3000/metrics

# Ahora deberías ver métricas
curl -s http://localhost:3000/metrics | grep http_requests_total
```

## Referencias

- [Documentación de Prometheus](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [Grafana Dashboard Examples](https://grafana.com/grafana/dashboards/)

