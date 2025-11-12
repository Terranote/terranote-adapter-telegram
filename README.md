# Terranote Telegram Adapter

Adaptador HTTP que integra la Bot API de Telegram con Terranote Core.

## Requisitos previos

- Node.js 20 o superior.
- Bot de Telegram creado mediante `@BotFather` y su `bot_token`.
- Endpoint público (p. ej. `ngrok`) para recibir el webhook desde Telegram.
- Terranote Core accesible vía HTTP.

## Configuración

1. Copia el archivo `env.example` a `.env` y ajusta los valores:

   - `CORE_API_BASE_URL`: URL base del servicio Terranote Core.
   - `CORE_API_TOKEN`: token opcional para autenticar peticiones salientes.
   - `TELEGRAM_BOT_TOKEN`: token generado por `@BotFather`.
   - `TELEGRAM_WEBHOOK_SECRET`: token secreto opcional para validar peticiones entrantes (`X-Telegram-Bot-Api-Secret-Token`).

2. Instala dependencias:

   ```bash
   npm install
   ```

3. Ejecuta la aplicación en modo desarrollo:

   ```bash
   npm run dev
   ```

## Endpoints principales

- `GET /health`: verificación básica del servicio.
- `POST /telegram/webhook`: recepción de actualizaciones de Telegram, normalización y reenvío hacia Terranote Core.

## Pruebas

```bash
npm test
```

## Estructura del proyecto

- `src/app.ts`: construcción de la aplicación Express y registro de rutas.
- `src/routes/webhook.ts`: lógica del webhook de Telegram.
- `src/services/message-processor.ts`: normaliza los mensajes entrantes.
- `src/clients/terranote-core-client.ts`: cliente HTTP para Terranote Core.
- `tests/`: pruebas unitarias con Vitest y Supertest.

## Configuración del webhook en Telegram

Ejemplo de configuración usando `curl`:

```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://mi-dominio.com/telegram/webhook",
    "secret_token": "token-secreto"
  }'
```

## Licencia

MIT
