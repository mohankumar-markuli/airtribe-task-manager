
jest.mock('../../src/models/User', () => ({
    exists: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
}));

const jwt = require('jsonwebtoken');
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

describe('GET /api/v1/auth/me', () => {
    const originalJwtSecret = process.env.JWT_SECRET;
    const testSecret = 'profile-route-test-secret';

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

    function createAccessToken(userId = 'user-123') {
        return jwt.sign(
            { sub: userId },
            testSecret,
            {
                expiresIn: '15m',
                algorithm: 'HS256',
            },
        );
    }

    function mockUserQuery(user) {
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(user),
        });
    }

    it('returns the profile for an authenticated user', async () => {
        mockUserQuery({
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            isActive: true,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        });

        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${createAccessToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toMatchObject({
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
        });
        expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('returns HTTP 401 when the access token is missing', async () => {
        const response = await request(app).get('/api/v1/auth/me');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            success: false,
            message: 'Authentication required',
        });
        expect(User.findById).not.toHaveBeenCalled();
    });

    it('returns HTTP 401 when the access token is invalid', async () => {
        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(User.findById).not.toHaveBeenCalled();
    });

    it('returns HTTP 404 when the authenticated user no longer exists', async () => {
        mockUserQuery(null);

        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${createAccessToken()}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            message: 'User account not found',
        });
    });

    it('returns HTTP 404 when the authenticated account is inactive', async () => {
        mockUserQuery({
            id: 'user-123',
            isActive: false,
        });

        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${createAccessToken()}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});
