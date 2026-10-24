
const { z } = require('zod');

const registerSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, 'Name must contain at least 2 characters')
            .max(80, 'Name cannot exceed 80 characters'),

        email: z
            .string()
            .trim()
            .email('Enter a valid email address')
            .max(254, 'Email cannot exceed 254 characters')
            .transform((email) => email.toLowerCase()),

        password: z
            .string()
            .min(8, 'Password must contain at least 8 characters')
            .max(72, 'Password cannot exceed 72 characters'),
    })
    .strict();

const loginSchema = z
    .object({
        email: z
            .string()
            .trim()
            .email('Enter a valid email address')
            .max(254, 'Email cannot exceed 254 characters')
            .transform((email) => email.toLowerCase()),

        password: z
            .string()
            .min(1, 'Password is required')
            .max(72, 'Password is too long'),
    })
const updateProfileSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, 'Name must contain at least 2 characters')
            .max(80, 'Name cannot exceed 80 characters')
            .optional(),

        password: z
            .string()
            .min(8, 'Password must contain at least 8 characters')
            .max(72, 'Password cannot exceed 72 characters')
            .optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Provide at least one field to update',
    });

module.exports = {
    registerSchema,
    loginSchema,
    updateProfileSchema,
};

