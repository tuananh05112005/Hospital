const { z } = require('zod');

const createPatientSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().min(10, 'Phone must be at least 10 characters').max(20).optional().or(z.literal('')),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format').optional().or(z.literal('')),
    gender: z.enum(['Male', 'Female', 'Other']).optional().or(z.literal('')),
    address: z.string().max(1000).optional().or(z.literal(''))
  })
});

const updatePatientSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number')
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255).optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().min(10, 'Phone must be at least 10 characters').max(20).optional().or(z.literal('')),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format').optional().or(z.literal('')),
    gender: z.enum(['Male', 'Female', 'Other']).optional().or(z.literal('')),
    address: z.string().max(1000).optional().or(z.literal(''))
  })
});

module.exports = {
  createPatientSchema,
  updatePatientSchema
};
