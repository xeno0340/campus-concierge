import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('Enter a valid email address')

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/\d/, 'Password must include a number')

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email,
  password,
  department: z.string().trim().max(80).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{7,15}$/, 'Enter a valid phone number')
    .optional(),
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
})