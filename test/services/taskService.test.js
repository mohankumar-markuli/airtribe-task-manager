
jest.mock('../../src/models/Task', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
}));

const Task = require('../../src/models/Task');
const {
    TaskServiceError,
    createTask,
    listTasks,
    getTaskById,
    updateTask,
    deleteTask,
} = require('../../src/services/taskService');

describe('Task service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates a task for the authenticated owner', async () => {
        const taskData = {
            title: 'Finish assignment',
            description: 'Complete the backend',
        };

        const createdTask = {
            id: 'task-123',
            ...taskData,
            owner: 'user-123',
        };

        Task.create.mockResolvedValue(createdTask);

        const result = await createTask('user-123', taskData);

        expect(Task.create).toHaveBeenCalledWith({
            ...taskData,
            dueDate: undefined,
            owner: 'user-123',
        });
        expect(result).toEqual(createdTask);
    });

    it('lists only tasks belonging to the owner', async () => {
        const tasks = [{ id: 'task-123' }];
        const sort = jest.fn().mockResolvedValue(tasks);
        Task.find.mockReturnValue({ sort });

        const result = await listTasks('user-123');

        expect(Task.find).toHaveBeenCalledWith({ owner: 'user-123' });
        expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
        expect(result).toEqual(tasks);
    });

    it('filters tasks by status and searches titles', async () => {
        const sort = jest.fn().mockResolvedValue([]);
        Task.find.mockReturnValue({ sort });

        await listTasks('user-123', {
            status: 'pending',
            search: 'assignment',
        });

        expect(Task.find).toHaveBeenCalledWith({
            owner: 'user-123',
            status: 'pending',
            title: {
                $regex: 'assignment',
                $options: 'i',
            },
        });
    });

    it('escapes special regular-expression characters in searches', async () => {
        const sort = jest.fn().mockResolvedValue([]);
        Task.find.mockReturnValue({ sort });

        await listTasks('user-123', { search: 'task.*' });

        expect(Task.find).toHaveBeenCalledWith({
            owner: 'user-123',
            title: {
                $regex: 'task\\.\\*',
                $options: 'i',
            },
        });
    });

    it('sorts tasks by due date in ascending order', async () => {
        const sort = jest.fn().mockResolvedValue([]);
        Task.find.mockReturnValue({ sort });

        await listTasks('user-123', {
            sortBy: 'dueDate',
            order: 'asc',
        });

        expect(sort).toHaveBeenCalledWith({ dueDate: 1 });
    });

    it('uses safe default sorting for an unsupported sort field', async () => {
        const sort = jest.fn().mockResolvedValue([]);
        Task.find.mockReturnValue({ sort });

        await listTasks('user-123', {
            sortBy: 'owner',
            order: 'asc',
        });

        expect(sort).toHaveBeenCalledWith({ createdAt: 1 });
    });

    it('retrieves a task belonging to the owner', async () => {
        const task = { id: 'task-123', owner: 'user-123' };
        Task.findOne.mockResolvedValue(task);

        const result = await getTaskById('user-123', 'task-123');

        expect(Task.findOne).toHaveBeenCalledWith({
            _id: 'task-123',
            owner: 'user-123',
        });
        expect(result).toEqual(task);
    });

    it('does not retrieve another user task', async () => {
        Task.findOne.mockResolvedValue(null);

        await expect(
            getTaskById('user-123', 'task-456'),
        ).rejects.toMatchObject({
            name: 'TaskServiceError',
            statusCode: 404,
            message: 'Task not found',
        });
    });

    it('updates only allowed fields on an owned task', async () => {
        const task = { id: 'task-123', status: 'completed' };
        Task.findOneAndUpdate.mockResolvedValue(task);

        const result = await updateTask('user-123', 'task-123', {
            status: 'completed',
            owner: 'attacker-id',
        });

        expect(Task.findOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: 'task-123',
                owner: 'user-123',
            },
            { status: 'completed' },
            {
                new: true,
                runValidators: true,
            },
        );
        expect(result).toEqual(task);
    });

    it('returns 404 when updating a task that does not belong to the owner', async () => {
        Task.findOneAndUpdate.mockResolvedValue(null);

        await expect(
            updateTask('user-123', 'task-456', { title: 'Changed title' }),
        ).rejects.toBeInstanceOf(TaskServiceError);
    });

    it('deletes only a task belonging to the owner', async () => {
        const task = { id: 'task-123', owner: 'user-123' };
        Task.findOneAndDelete.mockResolvedValue(task);

        const result = await deleteTask('user-123', 'task-123');

        expect(Task.findOneAndDelete).toHaveBeenCalledWith({
            _id: 'task-123',
            owner: 'user-123',
        });
        expect(result).toEqual(task);
    });

    it('returns 404 when the task to delete does not exist for the owner', async () => {
        Task.findOneAndDelete.mockResolvedValue(null);

        await expect(
            deleteTask('user-123', 'task-456'),
        ).rejects.toBeInstanceOf(TaskServiceError);
    });
});
