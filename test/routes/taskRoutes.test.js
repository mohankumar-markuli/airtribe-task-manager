
jest.mock('../../src/models/Task', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');
const Task = require('../../src/models/Task');

describe('/api/v1/tasks routes', () => {
    const originalJwtSecret = process.env.JWT_SECRET;
    const testSecret = 'task-route-test-secret';

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = testSecret;
    });

    afterAll(() => {
        if (originalJwtSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalJwtSecret;
        }
    });

    function token(userId = 'user-123') {
        return jwt.sign(
            { sub: userId },
            testSecret,
            { expiresIn: '15m', algorithm: 'HS256' },
        );
    }

    function authenticatedRequest(method, path, userId = 'user-123') {
        return request(app)[method](path)
            .set('Authorization', `Bearer ${token(userId)}`);
    }

    function mockTaskQuery(task) {
        Task.findOne.mockResolvedValue(task);
    }

    it('rejects requests without an access token', async () => {
        const response = await request(app).get('/api/v1/tasks');

        expect(response.status).toBe(401);
    });

    it('creates a task for the authenticated user', async () => {
        Task.create.mockImplementation(async (data) => ({
            id: 'task-123',
            ...data,
        }));

        const response = await authenticatedRequest('post', '/api/v1/tasks')
            .send({ title: 'Finish assignment' });

        expect(response.status).toBe(201);
        expect(response.body.data.task.owner).toBe('user-123');
        expect(Task.create).toHaveBeenCalledWith({
            title: 'Finish assignment',
            description: undefined,
            dueDate: undefined,
            owner: 'user-123',
        });
    });

    it('rejects invalid task input', async () => {
        const response = await authenticatedRequest('post', '/api/v1/tasks')
            .send({ title: 'A' });

        expect(response.status).toBe(400);
        expect(Task.create).not.toHaveBeenCalled();
    });

    it('lists only the authenticated user tasks', async () => {
        const tasks = [{ id: 'task-123', owner: 'user-123' }];
        const sort = jest.fn().mockResolvedValue(tasks);
        Task.find.mockReturnValue({ sort });

        const response = await authenticatedRequest('get', '/api/v1/tasks');

        expect(response.status).toBe(200);
        expect(response.body.data.tasks).toEqual(tasks);
        expect(Task.find).toHaveBeenCalledWith({ owner: 'user-123' });
    });

    it('returns a task belonging to the authenticated user', async () => {
        mockTaskQuery({ id: 'task-123', owner: 'user-123' });

        const response = await authenticatedRequest(
            'get',
            '/api/v1/tasks/task-123',
        );

        expect(response.status).toBe(200);
        expect(Task.findOne).toHaveBeenCalledWith({
            _id: 'task-123',
            owner: 'user-123',
        });
    });

    it('returns 404 when a task is not owned by the user', async () => {
        mockTaskQuery(null);

        const response = await authenticatedRequest(
            'get',
            '/api/v1/tasks/task-456',
        );

        expect(response.status).toBe(404);
    });

    it('marks an owned task as completed', async () => {
        Task.findOneAndUpdate.mockResolvedValue({
            id: 'task-123',
            status: 'completed',
        });

        const response = await authenticatedRequest(
            'patch',
            '/api/v1/tasks/task-123',
        ).send({ status: 'completed' });

        expect(response.status).toBe(200);
        expect(response.body.data.task.status).toBe('completed');
        expect(Task.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: 'task-123', owner: 'user-123' },
            { status: 'completed' },
            { new: true, runValidators: true },
        );
    });

    it('deletes an owned task', async () => {
        Task.findOneAndDelete.mockResolvedValue({
            id: 'task-123',
            owner: 'user-123',
        });

        const response = await authenticatedRequest(
            'delete',
            '/api/v1/tasks/task-123',
        );

        expect(response.status).toBe(200);
        expect(Task.findOneAndDelete).toHaveBeenCalledWith({
            _id: 'task-123',
            owner: 'user-123',
        });
    });
});
