
const { z } = require('zod');

const taskStatuses = ['pending', 'in_progress', 'completed'];

const createTaskSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(2, 'Task title must contain at least 2 characters')
            .max(120, 'Task title cannot exceed 120 characters'),

        description: z
            .string()
            .trim()
            .max(2000, 'Description cannot exceed 2000 characters')
            .optional(),

        dueDate: z
            .union([
                z.string().datetime(),
                z.coerce.date(),
                z.null(),
            ])
            .optional(),

        status: z
            .enum(taskStatuses)
            .optional(),

        assignee: z
            .string()
            .trim()
            .regex(/^[0-9a-fA-F]{24}$/, 'Invalid assignee ID')
            .optional()
            .nullable(),

        team: z
            .string()
            .trim()
            .regex(/^[0-9a-fA-F]{24}$/, 'Invalid team ID')
            .optional()
            .nullable(),
    })
    .strict();

const updateTaskSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(2, 'Task title must contain at least 2 characters')
            .max(120, 'Task title cannot exceed 120 characters')
            .optional(),

        description: z
            .string()
            .trim()
            .max(2000, 'Description cannot exceed 2000 characters')
            .optional(),

        dueDate: z
            .union([
                z.string().datetime(),
                z.coerce.date(),
                z.null(),
            ])
            .optional(),

        status: z
            .enum(taskStatuses)
            .optional(),

        assignee: z
            .string()
            .trim()
            .regex(/^[0-9a-fA-F]{24}$/, 'Invalid assignee ID')
            .optional()
            .nullable(),

        team: z
            .string()
            .trim()
            .regex(/^[0-9a-fA-F]{24}$/, 'Invalid team ID')
            .optional()
            .nullable(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Provide at least one field to update',
    });

module.exports = {
    createTaskSchema,
    updateTaskSchema,
};
