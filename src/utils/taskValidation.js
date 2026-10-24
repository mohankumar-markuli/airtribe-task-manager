
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
            .iso
            .datetime({ offset: true })
            .optional(),
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
                z.iso.datetime({ offset: true }),
                z.null(),
            ])
            .optional(),

        status: z
            .enum(taskStatuses)
            .optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Provide at least one field to update',
    });

module.exports = {
    createTaskSchema,
    updateTaskSchema,
};
