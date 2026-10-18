import { z } from 'zod'
import { CATEGORIES } from '../models/Service.js'

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:mm format, e.g. 09:00')

export const createServiceSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(80),
  description: z.string().trim().max(1000).optional(),
  category: z.enum(CATEGORIES, {
    message: `Category must be one of: ${CATEGORIES.join(', ')}`,
  }),
  location: z.string().trim().min(2, 'Location is required').max(100),
  price: z.number().min(0).max(100000).optional(),
  capacity: z.number().int().min(1).max(500).optional(),
  slotMinutes: z
    .number()
    .int()
    .min(15)
    .max(480)
    .refine((n) => n % 15 === 0, 'Slot length must be a multiple of 15 minutes')
    .optional(),
  openTime: time.optional(),
  closeTime: time.optional(),
  openDays: z
    .array(z.number().int().min(0).max(6))
    .min(1)
    .max(7)
    .transform((d) => [...new Set(d)])
    .optional(),
  advanceDays: z.number().int().min(1).max(90).optional(),
  requiresApproval: z.boolean().optional(),
  bookableBy: z.array(z.enum(['student', 'faculty'])).min(1).optional(),
  manager: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid manager id').optional(),
  images: z.array(z.string().url('Each image must be a valid URL')).max(5).optional(),
  isActive: z.boolean().optional(),
})

export const updateServiceSchema = createServiceSchema.partial()