import { z } from 'zod'

export const recipientZ = z
  .string()
  .min(1, 'Enter a payer wallet')
  .refine(
    (v) => /^0x[a-fA-F0-9]{40}$/u.test(v) || /^\+[1-9]\d{7,14}$/u.test(v.trim()),
    { message: 'Use a 0x wallet address or an E.164 phone number (e.g. +62...)' },
  )

export const amountZ = z.string().regex(/^\d+(\.\d{1,18})?$/u, 'Enter a positive amount')

export const dueZ = z
  .string()
  .min(1, 'Pick a due date')
  .refine((v) => Date.parse(v) > Date.now(), { message: 'Due date must be in the future' })
