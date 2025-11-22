# TODO - Terranote Telegram Adapter

Lista de tareas pendientes y mejoras futuras para el adaptador de Telegram.

## Prioridad Alta

### Rate Limiting
- [ ] Implementar rate limiting para endpoints públicos
  - [ ] Rate limiting para `/health` endpoint
  - [ ] Rate limiting para `/metrics` endpoint (más estricto)
  - [ ] Rate limiting para `/telegram/webhook` (protección contra spam)
  - [ ] Configurar límites por IP y por usuario
  - [ ] Agregar headers de rate limit en respuestas
  - [ ] Documentar límites y comportamiento

## Prioridad Media

### Documentación
- [ ] Guía de desarrollo para nuevos contribuidores
  - [ ] Setup del entorno de desarrollo
  - [ ] Estructura del proyecto
  - [ ] Convenciones de código
  - [ ] Proceso de contribución
- [ ] Diagrama de arquitectura
  - [ ] Flujo de mensajes
  - [ ] Interacción con Core API
  - [ ] Interacción con Telegram API
- [ ] Ejemplos de uso avanzado
  - [ ] Integración con otros servicios
  - [ ] Personalización de mensajes
  - [ ] Manejo de errores personalizado

### CI/CD
- [ ] GitHub Actions para tests automáticos
  - [ ] Ejecutar tests en cada PR
  - [ ] Ejecutar linting automático
  - [ ] Verificar tipos TypeScript
- [ ] Build y release automático
  - [ ] Crear tags de versión
  - [ ] Publicar releases en GitHub
  - [ ] (Opcional) Publicar en npm registry

## Prioridad Baja

### Seguridad
- [ ] Validación adicional de webhooks
  - [ ] Verificación de origen de Telegram
  - [ ] Validación de timestamps
  - [ ] Protección contra replay attacks
- [ ] Rotación de tokens
  - [ ] Script para rotar tokens de forma segura
  - [ ] Documentación del proceso
- [ ] Headers de seguridad HTTP
  - [ ] CSP headers
  - [ ] HSTS headers
  - [ ] X-Frame-Options

### Funcionalidades Futuras
- [ ] Soporte para fotos y multimedia
  - [ ] Procesamiento de imágenes
  - [ ] Extracción de metadatos EXIF
  - [ ] Integración con Core para notas con imágenes
- [ ] Soporte para otros tipos de mensajes de Telegram
  - [ ] Videos
  - [ ] Documentos
  - [ ] Stickers
  - [ ] Voice messages

## Notas

- Las tareas están organizadas por prioridad
- Las tareas de alta prioridad deberían implementarse primero
- Las tareas de baja prioridad son mejoras opcionales
- Las funcionalidades futuras (fotos, multimedia) se implementarán más adelante

