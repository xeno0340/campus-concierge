import { z } from 'zod'

export const createBookingSchema = z.object({
  serviceId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid service id'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be HH:mm'),
  notes: z.string().trim().max(300).optional(),
})

export const cancelSchema = z.object({
  reason: z.string().trim().max(200).optional(),
})

export const rejectSchema = z.object({
  reason: z.string().trim().min(3, 'Please give a reason').max(200),
})