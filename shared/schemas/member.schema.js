const { z } = require('zod');

const memberSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  age: z.number().min(10).max(100).optional(),
  joiningDate: z.string().or(z.date()),
  membershipPlan: z.string().min(1, 'Plan is required'),
  membershipStartDate: z.string().or(z.date()).optional(),
  paymentStatus: z.enum(['Paid', 'Pending', 'Overdue']).optional(),
  notes: z.string().optional(),
  whatsappOptIn: z.boolean().optional(),
  trainerNeeded: z.boolean().optional(),
  dietNeeded: z.boolean().optional(),
  trainer: z.string().optional().or(z.literal('')),
});

module.exports = { memberSchema };
