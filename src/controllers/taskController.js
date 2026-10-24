
const {
    createTaskSchema,
    updateTaskSchema,
} = require('../utils/taskValidation');

const {
    TaskServiceError,
    createTask,
    listTasks,
    getTaskById,
    updateTask,
    deleteTask,
} = require('../services/taskService');

const taskListQuerySchema = require('zod').z
    .object({
        status: require('zod').z.enum([
            'pending',
            'in_progress',
            'completed',
        ]).optional(),
        search: require('zod').z.string().trim().max(120).optional(),
        sortBy: require('zod').z.enum([
            'createdAt',
            'dueDate',
            'title',
        ]).optional(),
        order: require('zod').z.enum(['asc', 'desc']).optional(),
    })
    .strict();

function handleError(error, req, res, next) {
    if (error instanceof TaskServiceError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
    }

    return next(error);
}

async function create(req, res, next) {
    const validation = createTaskSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validation.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        });
    }

    try {
        const task = await createTask(req.user.id, validation.data);

        return res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: { task },
        });
    } catch (error) {
        return handleError(error, req, res, next);
    }
}

async function list(req, res, next) {
    const validation = taskListQuerySchema.safeParse(req.query);

    if (!validation.success) {
        return res.status(400).json({
            success: false,
            message: 'Invalid task list filters',
            errors: validation.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        });
    }

    try {
        const tasks = await listTasks(req.user.id, validation.data);

        return res.status(200).json({
            success: true,
            data: { tasks },
        });
    } catch (error) {
        return handleError(error, req, res, next);
    }
}

async function getOne(req, res, next) {
    try {
        const task = await getTaskById(req.user.id, req.params.id);

        return res.status(200).json({
            success: true,
            data: { task },
        });
    } catch (error) {
        return handleError(error, req, res, next);
    }
}

async function update(req, res, next) {
    const validation = updateTaskSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validation.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        });
    }

    try {
        const task = await updateTask(
            req.user.id,
            req.params.id,
            validation.data,
        );

        return res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: { task },
        });
    } catch (error) {
        return handleError(error, req, res, next);
    }
}

async function remove(req, res, next) {
    try {
        await deleteTask(req.user.id, req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Task deleted successfully',
        });
    } catch (error) {
        return handleError(error, req, res, next);
    }
}

module.exports = {
    create,
    list,
    getOne,
    update,
    remove,
};
