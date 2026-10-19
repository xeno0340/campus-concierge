import { z } from 'zod'

export const createReviewSchema = z.object({
  bookingId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid booking id'),
  rating: z.number().int('Rating must be a whole number').min(1, 'Pick a rating from 1 to 5').max(5, 'Pick a rating from 1 to 5'),
  comment: z.string().trim().max(500, 'Keep the comment under 500 characters').optional(),
})