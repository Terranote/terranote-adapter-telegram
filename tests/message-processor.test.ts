import { describe, expect, it } from 'vitest'

import { MessageProcessor, UnsupportedTelegramMessageError } from '@/services/message-processor.js'
import { type TelegramMessage } from '@/types/telegram.js'

const baseMessage: TelegramMessage = {
  message_id: 1,
  date: 1_720_000_000,
  from: {
    id: 12345
  },
  chat: {
    id: 12345,
    type: 'private'
  }
}

describe('MessageProcessor', () => {
  const processor = new MessageProcessor()

  it('convierte un mensaje de texto en una interacción', () => {
    const interaction = processor.toInteraction({
      ...baseMessage,
      text: 'Hola Terranote'
    })

    expect(interaction).toMatchObject({
      channel: 'telegram',
      user_id: '12345',
      payload: {
        type: 'text',
        text: 'Hola Terranote'
      }
    })
    expect(interaction.sent_at).toBeInstanceOf(Date)
  })

  it('convierte un mensaje de ubicación en una interacción', () => {
    const interaction = processor.toInteraction({
      ...baseMessage,
      location: {
        latitude: 4.711,
        longitude: -74.072
      }
    })

    expect(interaction).toMatchObject({
      channel: 'telegram',
      user_id: '12345',
      payload: {
        type: 'location',
        latitude: 4.711,
        longitude: -74.072
      }
    })
  })

  it('lanza un error cuando el tipo de mensaje no es soportado', () => {
    expect(() =>
      processor.toInteraction({
        ...baseMessage
      })
    ).toThrow(UnsupportedTelegramMessageError)
  })
})

