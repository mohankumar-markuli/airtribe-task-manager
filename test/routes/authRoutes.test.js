
jest.mock('../../src/models/User', () => ({
    exists: jest.fn(),
    create: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('POST /api/v1/auth/register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates an account and returns HTTP 201', async () => {
        User.exists.mockResolvedValue(null);
        User.create.mockImplementation(async (userData) => ({
            id: 'user-123',
            name: userData.name,
            email: userData.email,
            password: 'hashed-password',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
        }));

        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Test User',
                email: 'TEST@example.com',
                password: 'StrongPass123!',
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe('test@example.com');
        expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('returns HTTP 400 for invalid registration data', async () => {
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'T',
                email: 'invalid-email',
                password: 'short',
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeInstanceOf(Array);
        expect(User.create).not.toHaveBeenCalled();
    });

    it('returns HTTP 409 when the email already exists', async () => {
        User.exists.mockResolvedValue({ _id: 'existing-user' });

        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'StrongPass123!',
            });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(User.create).not.toHaveBeenCalled();
    });

    it('returns HTTP 500 for unexpected service errors', async () => {
        User.exists.mockRejectedValue(new Error('Database unavailable'));

        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'StrongPass123!',
            });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false,
            message: 'Internal server error',
        });
    });
});
