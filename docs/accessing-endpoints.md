# Cómo Acceder a los Endpoints

Esta guía explica cómo acceder a los diferentes endpoints del adaptador de Telegram.

## Endpoints Disponibles

### 1. `/health` - Health Check

**Descripción**: Verifica el estado del servicio y sus dependencias.

**Autenticación**: No requiere autenticación

**Acceso local:**
```bash
curl http://localhost:3000/health
```

**Acceso público:**
```bash
curl https://terranote-tg.osm.lat/health
```

**Respuesta ejemplo:**
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

### 2. `/metrics` - Métricas Prometheus

**Descripción**: Expone métricas en formato Prometheus para monitoreo.

**Autenticación**: Requiere autenticación básica (usuario/contraseña)

**Credenciales** (configuradas en `.env`):
- Usuario: `admin`
- Contraseña: (ver archivo `.env` en el servidor)

**Acceso local:**
```bash
# Con autenticación
curl -u admin:TU_CONTRASEÑA http://localhost:3000/metrics

# O especificando usuario:contraseña en la URL (menos seguro)
curl http://admin:TU_CONTRASEÑA@localhost:3000/metrics
```

**Acceso público:**
```bash
# Con autenticación
curl -u admin:TU_CONTRASEÑA https://terranote-tg-metrics.osm.lat/metrics

# En el navegador (te pedirá usuario/contraseña)
# https://terranote-tg-metrics.osm.lat/metrics
```

**Respuesta ejemplo:**
```
# HELP terranote_adapter_telegram_http_requests_total Total number of HTTP requests
# TYPE terranote_adapter_telegram_http_requests_total counter
terranote_adapter_telegram_http_requests_total{method="GET",route="/health",status="200"} 10

# HELP terranote_adapter_telegram_http_request_duration_seconds HTTP request duration in seconds
# TYPE terranote_adapter_telegram_http_request_duration_seconds histogram
terranote_adapter_telegram_http_request_duration_seconds_bucket{method="GET",route="/health",status="200",le="0.01"} 9
...
```

### 3. `/telegram/webhook` - Webhook de Telegram

**Descripción**: Recibe actualizaciones de Telegram.

**Autenticación**: Requiere `X-Telegram-Bot-Api-Secret-Token` header (si está configurado)

**Acceso**: Solo Telegram puede enviar a este endpoint

**URL pública**: `https://terranote-tg.osm.lat/telegram/webhook`

### 4. `/callbacks/note-created` - Callbacks del Core

**Descripción**: Recibe notificaciones cuando se crea una nota.

**Autenticación**: Requiere `X-Terranote-Signature` header

**Acceso**: Solo el Core puede enviar a este endpoint

## Métodos de Acceso

### Opción 1: Desde el Navegador

**Health Check** (sin autenticación):
```
https://terranote-tg.osm.lat/health
```

**Métricas** (con autenticación):
```
https://terranote-tg-metrics.osm.lat/metrics
```
El navegador te pedirá usuario y contraseña.

### Opción 2: Con curl

**Health Check:**
```bash
curl https://terranote-tg.osm.lat/health | jq
```

**Métricas:**
```bash
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics
```

### Opción 3: Con httpie

**Health Check:**
```bash
http GET https://terranote-tg.osm.lat/health
```

**Métricas:**
```bash
http -a admin:TU_CONTRASEÑA \
  GET https://terranote-tg-metrics.osm.lat/metrics
```

### Opción 4: En Prometheus

Si tienes Prometheus configurado, puedes scrapear las métricas:

```yaml
scrape_configs:
  - job_name: 'terranote-adapter-telegram'
    scrape_interval: 15s
    basic_auth:
      username: 'admin'
      password: 'TU_CONTRASEÑA'
    static_configs:
      - targets: ['terranote-tg-metrics.osm.lat']
```

### Opción 5: Desde el Servidor (Local)

**Health Check:**
```bash
curl http://localhost:3000/health | jq
```

**Métricas:**
```bash
curl -u admin:TU_CONTRASEÑA http://localhost:3000/metrics
```

## Obtener las Credenciales

Si necesitas ver las credenciales configuradas:

```bash
# En el servidor
cat /home/terranote/terranote-adapter-telegram/.env | grep METRICS
```

## Ejemplos Prácticos

### Verificar que el servicio está funcionando

```bash
curl https://terranote-tg.osm.lat/health | jq '.status'
# Debe retornar: "ok"
```

### Ver métricas de requests HTTP

```bash
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep http_requests_total
```

### Ver métricas del Core API

```bash
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep core_api_calls_total
```

### Ver métricas de Telegram API

```bash
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep telegram_api_calls_total
```

### Filtrar métricas específicas

```bash
# Solo métricas de Terranote (excluir métricas de Node.js)
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep terranote_adapter_telegram
```

## Troubleshooting

### Error 401 Unauthorized

- Verificar que las credenciales sean correctas
- Verificar que `METRICS_USERNAME` y `METRICS_PASSWORD` estén en el `.env`
- Verificar que el adaptador se haya reiniciado después de cambiar el `.env`

### Error 404 Not Found

- Verificar que el código esté actualizado: `git pull` en el servidor
- Verificar que el adaptador esté corriendo: `sudo systemctl status terranote-adapter-telegram`
- Reiniciar el adaptador: `sudo systemctl restart terranote-adapter-telegram`

### Error 530 en Cloudflare

- Verificar que cloudflared esté corriendo: `sudo systemctl status cloudflared`
- Verificar la configuración DNS en Cloudflare
- Verificar logs: `sudo journalctl -u cloudflared -n 50`

### No se ven métricas

- Las métricas solo aparecen después de que haya tráfico
- Hacer algunas peticiones primero: `curl https://terranote-tg.osm.lat/health`
- Luego consultar métricas: `curl -u admin:TU_CONTRASEÑA https://terranote-tg-metrics.osm.lat/metrics`

## URLs Resumen

| Endpoint | URL Local | URL Pública | Autenticación |
|----------|-----------|-------------|----------------|
| Health | `http://localhost:3000/health` | `https://terranote-tg.osm.lat/health` | No |
| Metrics | `http://localhost:3000/metrics` | `https://terranote-tg-metrics.osm.lat/metrics` | Sí (Basic Auth) |
| Webhook | `http://localhost:3000/telegram/webhook` | `https://terranote-tg.osm.lat/telegram/webhook` | Header token |
| Callbacks | `http://localhost:3000/callbacks/note-created` | `https://terranote-tg.osm.lat/callbacks/note-created` | Header signature |

