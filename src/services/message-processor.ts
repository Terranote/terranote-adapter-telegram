import { interactionRequestSchema, type InteractionRequest } from '@/types/interaction.js'
import { type TelegramMessage } from '@/types/telegram.js'

export class UnsupportedTelegramMessageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsupportedTelegramMessageError'
  }
}

export class MessageProcessor {
  private readonly channel: InteractionRequest['channel']

  constructor(channel: InteractionRequest['channel'] = 'telegram') {
    this.channel = channel
  }

  toInteraction(message: TelegramMessage): InteractionRequest {
    const sentAt = new Date(message.date * 1000)
    const userId = String(message.from.id)

    if (typeof message.text === 'string' && message.text.trim().length > 0) {
      return interactionRequestSchema.parse({
        channel: this.channel,
        user_id: userId,
        sent_at: sentAt,
        payload: {
          type: 'text',
          text: message.text
        }
      })
    }

    if (message.location) {
      return interactionRequestSchema.parse({
        channel: this.channel,
        user_id: userId,
        sent_at: sentAt,
        payload: {
          type: 'location',
          latitude: message.location.latitude,
          longitude: message.location.longitude,
          accuracy: message.location.horizontal_accuracy
        }
      })
    }

    throw new UnsupportedTelegramMessageError('Unsupported message type')
  }
}



