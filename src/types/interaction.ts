import { z } from 'zod'

export const interactionPayloadTextSchema = z.object({
  type: z.literal('text'),
  text: z.string().min(1)
})

export const interactionPayloadLocationSchema = z.object({
  type: z.literal('location'),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().positive().optional()
})

export const interactionPayloadSchema = z.union([
  interactionPayloadTextSchema,
  interactionPayloadLocationSchema
])

export const interactionRequestSchema = z.object({
  channel: z.literal('telegram'),
  user_id: z.string().min(1),
  sent_at: z.date(),
  payload: interactionPayloadSchema
})

export type InteractionPayloadText = z.infer<typeof interactionPayloadTextSchema>
export type InteractionPayloadLocation = z.infer<typeof interactionPayloadLocationSchema>
export type InteractionPayload = z.infer<typeof interactionPayloadSchema>
export type InteractionRequest = z.infer<typeof interactionRequestSchema>



