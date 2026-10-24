const Task = require('../models/Task');
const Team = require('../models/Team');

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
        description: taskData.description || '',
        dueDate: taskData.dueDate || null,
        status: taskData.status || 'pending',
        owner: ownerId,
        assignee: taskData.assignee || null,
        team: taskData.team || null,
    });

    return Task.findById(task._id)
        .populate('owner', 'name email')
        .populate('assignee', 'name email')
        .populate('team', 'name');
}

async function listTasks(userId, filters = {}) {
    const queryConditions = [];

    // Scope / Assignment filter
    if (filters.assignedToMe === 'true' || filters.assignedToMe === true || filters.scope === 'assigned') {
        queryConditions.push({ assignee: userId });
    } else if (filters.ownerOnly === 'true' || filters.ownerOnly === true || filters.scope === 'created') {
        queryConditions.push({ owner: userId });
    } else {
        // By default show tasks created by user or assigned to user
        queryConditions.push({
            $or: [{ owner: userId }, { assignee: userId }],
        });
    }

    // Status filter (support 'open' as pending & in_progress)
    if (filters.status) {
        if (filters.status === 'open') {
            queryConditions.push({ status: { $in: ['pending', 'in_progress'] } });
        } else {
            queryConditions.push({ status: filters.status });
        }
    }

    // Direct assignee filter
    if (filters.assignee) {
        queryConditions.push({ assignee: filters.assignee });
    }

    // Team filter
    if (filters.team) {
        queryConditions.push({ team: filters.team });
    }

    // Search by title or description
    if (filters.search) {
        const escapedSearch = filters.search.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&',
        );
        const searchRegex = { $regex: escapedSearch, $options: 'i' };
        queryConditions.push({
            $or: [{ title: searchRegex }, { description: searchRegex }],
        });
    }

    const query = queryConditions.length > 0 ? { $and: queryConditions } : {};

    const allowedSortFields = ['createdAt', 'dueDate', 'title', 'updatedAt'];
    const sortBy = allowedSortFields.includes(filters.sortBy)
        ? filters.sortBy
        : 'createdAt';

    const sortOrder = filters.order === 'asc' ? 1 : -1;

    return Task.find(query)
        .populate('owner', 'name email')
        .populate('assignee', 'name email')
        .populate('team', 'name')
        .sort({ [sortBy]: sortOrder });
}

async function getTaskById(userId, taskId) {
    const task = await Task.findById(taskId)
        .populate('owner', 'name email')
        .populate('assignee', 'name email')
        .populate('team', 'name');

    if (!task) {
        throw new TaskServiceError('Task not found', 404);
    }

    // Check access: owner, assignee, or team member
    const isOwner = task.owner && (task.owner._id || task.owner).toString() === userId.toString();
    const isAssignee = task.assignee && (task.assignee._id || task.assignee).toString() === userId.toString();

    let isTeamMember = false;
    if (task.team) {
        const teamObj = await Team.findById(task.team._id || task.team);
        if (teamObj && teamObj.members.some((m) => m.toString() === userId.toString())) {
            isTeamMember = true;
        }
    }

    if (!isOwner && !isAssignee && !isTeamMember) {
        throw new TaskServiceError('Access denied to this task', 403);
    }

    return task;
}

async function updateTask(userId, taskId, updates) {
    const task = await Task.findById(taskId);

    if (!task) {
        throw new TaskServiceError('Task not found', 404);
    }

    const isOwner = task.owner.toString() === userId.toString();
    const isAssignee = task.assignee && task.assignee.toString() === userId.toString();

    if (!isOwner && !isAssignee) {
        throw new TaskServiceError('Access denied to update this task', 403);
    }

    // Assignee can update task status (e.g. mark as completed / in_progress)
    if (!isOwner && isAssignee) {
        if (Object.keys(updates).some((k) => k !== 'status')) {
            throw new TaskServiceError('Assignees can only update task status', 403);
        }
    }

    const allowedUpdates = {};
    for (const field of ['title', 'description', 'dueDate', 'status', 'assignee', 'team']) {
        if (Object.hasOwn(updates, field)) {
            allowedUpdates[field] = updates[field];
        }
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, allowedUpdates, {
        new: true,
        runValidators: true,
    })
        .populate('owner', 'name email')
        .populate('assignee', 'name email')
        .populate('team', 'name');

    return updatedTask;
}

async function deleteTask(ownerId, taskId) {
    const task = await Task.findById(taskId);

    if (!task) {
        throw new TaskServiceError('Task not found', 404);
    }

    if (task.owner.toString() !== ownerId.toString()) {
        throw new TaskServiceError('Only the task owner can delete this task', 403);
    }

    await Task.findByIdAndDelete(taskId);
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
