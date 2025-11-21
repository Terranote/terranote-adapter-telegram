# Comandos Rápidos para Ver Métricas

Comandos útiles para consultar métricas de forma práctica.

## Ver Métricas Específicas

### Solo métricas de Terranote (excluir Node.js)
```bash
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep terranote_adapter_telegram
```

### Métricas HTTP
```bash
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep http_requests_total
```

### Métricas del Core API
```bash
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep core_api
```

### Métricas de Telegram API
```bash
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep telegram_api
```

### Métricas de Procesamiento de Mensajes
```bash
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep messages_
```

## Guardar Métricas en Archivo

```bash
# Guardar todas las métricas
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics > metrics.txt

# Guardar solo métricas de Terranote
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep terranote_adapter_telegram > terranote-metrics.txt
```

## Ver Métricas en el Navegador

1. Abre: `https://terranote-tg-metrics.osm.lat/metrics`
2. Ingresa credenciales:
   - Usuario: `admin`
   - Contraseña: (ver `.env` en el servidor)

## Ver Solo los Nombres de Métricas

```bash
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep '^# HELP' | \
  awk '{print $3}'
```

## Ver Valores Actuales de Contadores

```bash
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep -E '^terranote_adapter_telegram.*_total' | \
  grep -v '{' | head -10
```

## Ver Solo Histogramas

```bash
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep 'histogram'
```

## Contar Líneas de Métricas

```bash
curl -s -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | wc -l
```

## Filtrar por Métrica Específica

```bash
# Ver todas las líneas de una métrica específica
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep 'http_requests_total'
```

## Usar con jq (si fuera JSON)

Las métricas están en formato Prometheus (texto plano), no JSON. Para procesarlas:

```bash
# Ver solo las líneas con valores (no comentarios)
curl -u admin:TU_CONTRASEÑA \
  https://terranote-tg-metrics.osm.lat/metrics | \
  grep -v '^#' | \
  grep -v '^$' | \
  head -20
```

## Ejemplo Completo: Dashboard de Métricas

```bash
#!/bin/bash
# Script para mostrar resumen de métricas

METRICS_URL="https://terranote-tg-metrics.osm.lat/metrics"
USER="admin"
PASS="TU_CONTRASEÑA"

echo "=== Métricas HTTP ==="
curl -s -u $USER:$PASS $METRICS_URL | grep http_requests_total | grep -v '{'

echo ""
echo "=== Métricas Core API ==="
curl -s -u $USER:$PASS $METRICS_URL | grep core_api_calls_total

echo ""
echo "=== Métricas Telegram API ==="
curl -s -u $USER:$PASS $METRICS_URL | grep telegram_api_calls_total

echo ""
echo "=== Métricas de Mensajes ==="
curl -s -u $USER:$PASS $METRICS_URL | grep messages_
```

