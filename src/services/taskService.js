
const Task = require('../models/Task');

class TaskServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'TaskServiceError';
        this.statusCode = statusCode;
    }
}

async function createTask(ownerId, taskData) {
    const task = await Task.create({
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        owner: ownerId,
    });

    return task;
}

async function listTasks(ownerId, filters = {}) {
    const query = { owner: ownerId };

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.search) {
        const escapedSearch = filters.search.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&',
        );

        query.title = {
            $regex: escapedSearch,
            $options: 'i',
        };
    }

    const allowedSortFields = ['createdAt', 'dueDate', 'title'];
    const sortBy = allowedSortFields.includes(filters.sortBy)
        ? filters.sortBy
        : 'createdAt';

    const sortOrder = filters.order === 'asc' ? 1 : -1;

    return Task.find(query).sort({
        [sortBy]: sortOrder,
    });
}

async function getTaskById(ownerId, taskId) {
    const task = await Task.findOne({
        _id: taskId,
        owner: ownerId,
    });

    if (!task) {
        throw new TaskServiceError('Task not found', 404);
    }

    return task;
}

async function updateTask(ownerId, taskId, updates) {
    const allowedUpdates = {};

    for (const field of ['title', 'description', 'dueDate', 'status']) {
        if (Object.hasOwn(updates, field)) {
            allowedUpdates[field] = updates[field];
        }
    }

    const task = await Task.findOneAndUpdate(
        {
            _id: taskId,
            owner: ownerId,
        },
        allowedUpdates,
        {
            new: true,
            runValidators: true,
        },
    );

    if (!task) {
        throw new TaskServiceError('Task not found', 404);
    }

    return task;
}

async function deleteTask(ownerId, taskId) {
    const task = await Task.findOneAndDelete({
        _id: taskId,
        owner: ownerId,
    });

    if (!task) {
        throw new TaskServiceError('Task not found', 404);
    }

    return task;
}

module.exports = {
    TaskServiceError,
    createTask,
    listTasks,
    getTaskById,
    updateTask,
    deleteTask,
};
