import { z } from 'zod';

export const createDraftSchema = z.object({
  loanType: z.enum(['personal', 'business', 'education', 'home']),
  amount: z.number().positive(),
  tenure: z.number().int().positive(),
  purpose: z.string().min(10),
});

export const updateDraftSchema = createDraftSchema.partial().extend({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  panNumber: z.string().optional(),
  employmentType: z.enum(['salaried', 'self-employed', 'student']).optional(),
  monthlyIncome: z.number().positive().optional(),
  employerName: z.string().optional(),
  fileUrl: z.string().url().optional(),
});

export const loanQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: z.string().optional(),
});
