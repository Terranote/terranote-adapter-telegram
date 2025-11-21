import { z } from 'zod'

export const telegramUserSchema = z.object({
  id: z.number().int(),
  is_bot: z.boolean().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional()
})

export const telegramChatSchema = z.object({
  id: z.number().int(),
  type: z.string(),
  title: z.string().optional(),
  username: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional()
})

export const telegramLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  horizontal_accuracy: z.number().positive().optional()
})

export const telegramMessageSchema = z.object({
  message_id: z.number().int(),
  date: z.number().int(),
  from: telegramUserSchema,
  chat: telegramChatSchema,
  text: z.string().optional(),
  location: telegramLocationSchema.optional()
})

export const telegramUpdateSchema = z.object({
  update_id: z.number().int(),
  message: telegramMessageSchema.optional()
})

export type TelegramUser = z.infer<typeof telegramUserSchema>
export type TelegramChat = z.infer<typeof telegramChatSchema>
export type TelegramLocation = z.infer<typeof telegramLocationSchema>
export type TelegramMessage = z.infer<typeof telegramMessageSchema>
export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>



