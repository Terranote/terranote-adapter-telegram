import { z } from 'zod'

export const noteCreatedNotificationSchema = z.object({
  channel: z.string().regex(/^[a-z0-9_-]+$/),
  user_id: z.string().min(1),
  note_url: z.string().url(),
  note_id: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  text: z.string(),
  created_at: z.coerce.date()
})

export type NoteCreatedNotification = z.infer<typeof noteCreatedNotificationSchema>


