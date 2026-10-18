import { z } from 'zod'

const ROLES = ['student', 'faculty', 'manager', 'admin']

const email = z.string().trim().toLowerCase().email('Enter a valid email address')

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/\d/, 'Password must include a number')

const phone = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s]{7,15}$/, 'Enter a valid phone number')

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email,
  password,
  role: z.enum(ROLES, { message: 'Role must be student, faculty, manager or admin' }),
  department: z.string().trim().max(80).optional(),
  phone: phone.optional(),
})

export const updateRoleSchema = z.object({
  role: z.enum(ROLES, { message: 'Role must be student, faculty, manager or admin' }),
})

export const updateStatusSchema = z.object({
  isActive: z.boolean({ message: 'isActive must be true or false' }),
})

export const updateMeSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    department: z.string().trim().max(80).optional(),
    phone: phone.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Provide at least one field to update',
  })