
jest.mock('../../src/models/User', () => ({
    exists: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('POST /api/v1/auth/login', () => {
    const originalJwtSecret = process.env.JWT_SECRET;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-only-secret-for-unit-tests';
        process.env.JWT_EXPIRES_IN = '15m';
    });

    afterAll(() => {
        if (originalJwtSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalJwtSecret;
        }
    });

    function mockUser(overrides = {}) {
        return {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            isActive: true,
            comparePassword: jest.fn().mockResolvedValue(true),
            ...overrides,
        };
    }

    it('returns an access token for valid credentials', async () => {
        const user = mockUser();

        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(user),
        });

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'TEST@example.com',
                password: 'StrongPass123!',
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.tokenType).toBe('Bearer');
        expect(response.body.data.user).toEqual({
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
        });
        expect(response.body.data.user).not.toHaveProperty('password');

        const decoded = jwt.verify(
            response.body.data.accessToken,
            process.env.JWT_SECRET,
        );

        expect(decoded.sub).toBe('user-123');
    });

    it('returns HTTP 400 for invalid login input', async () => {
        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'invalid-email',
                password: '',
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(User.findOne).not.toHaveBeenCalled();
    });

    it('returns HTTP 401 for invalid credentials', async () => {
        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(null),
        });

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'unknown@example.com',
                password: 'WrongPassword123!',
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            success: false,
            message: 'Invalid email or password',
        });
    });

    it('returns HTTP 500 when an unexpected error occurs', async () => {
        User.findOne.mockReturnValue({
            select: jest.fn().mockRejectedValue(
                new Error('Database unavailable'),
            ),
        });

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
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
