const { z } = require('zod');

const paymentSchema = z.object({
  member: z.string().min(1, 'Member is required'),
  amount: z.number().min(1, 'Amount must be at least 1'),
  paymentDate: z.string().or(z.date()),
  paymentMethod: z.enum(['Cash', 'UPI']),
  plan: z.string().min(1, 'Plan is required'),
  planCost: z.number().optional(),
  trainerCost: z.number().optional(),
  dietCost: z.number().optional(),
  notes: z.string().optional(),
});

module.exports = { paymentSchema };
