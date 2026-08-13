import { z } from 'zod';

const optionalNumeric = z.preprocess(
  (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
  z.number().positive().optional()
);

export const createDraftSchema = z.object({
  loanType: z.enum(['personal', 'business', 'education', 'home']).optional().or(z.literal('')),
  amount: optionalNumeric,
  tenure: optionalNumeric,
  purpose: z.string().optional(),
});

export const updateDraftSchema = createDraftSchema.partial().extend({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  panNumber: z.string().optional(),
  employmentType: z.enum(['salaried', 'self-employed', 'student']).optional().or(z.literal('')),
  monthlyIncome: optionalNumeric,
  employerName: z.string().optional(),
  documents: z.array(z.object({
    type: z.string(),
    s3Key: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    size: z.number()
  })).optional(),
});

export const loanQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: z.string().optional(),
});
