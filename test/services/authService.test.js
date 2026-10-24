
jest.mock('../../src/models/User', () => ({
    exists: jest.fn(),
    create: jest.fn(),
}));

const User = require('../../src/models/User');
const {
    AuthServiceError,
    registerUser,
} = require('../../src/services/authService');

describe('registerUser', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates a user and returns only safe user fields', async () => {
        User.exists.mockResolvedValue(null);
        User.create.mockResolvedValue({
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            password: 'StrongPass123!',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
        });

        const result = await registerUser({
            name: 'Test User',
            email: 'test@example.com',
            password: 'StrongPass123!',
        });

        expect(User.exists).toHaveBeenCalledWith({
            email: 'test@example.com',
        });

        expect(User.create).toHaveBeenCalledWith({
            name: 'Test User',
            email: 'test@example.com',
            password: 'StrongPass123!',
        });

        expect(result).toEqual({
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
        });

        expect(result).not.toHaveProperty('password');
    });

    it('rejects an email that already exists', async () => {
        User.exists.mockResolvedValue({ _id: 'existing-user' });

        await expect(
            registerUser({
                name: 'Test User',
                email: 'test@example.com',
                password: 'StrongPass123!',
            }),
        ).rejects.toMatchObject({
            name: 'AuthServiceError',
            statusCode: 409,
            message: 'An account with this email already exists',
        });

        expect(User.create).not.toHaveBeenCalled();
    });

    it('handles duplicate emails caused by concurrent requests', async () => {
        User.exists.mockResolvedValue(null);
        User.create.mockRejectedValue({ code: 11000 });

        await expect(
            registerUser({
                name: 'Test User',
                email: 'test@example.com',
                password: 'StrongPass123!',
            }),
        ).rejects.toBeInstanceOf(AuthServiceError);

        await expect(
            registerUser({
                name: 'Test User',
                email: 'test@example.com',
                password: 'StrongPass123!',
            }),
        ).rejects.toMatchObject({
            statusCode: 409,
        });
    });

    it('propagates unexpected database errors', async () => {
        const databaseError = new Error('Database unavailable');

        User.exists.mockResolvedValue(null);
        User.create.mockRejectedValue(databaseError);

        await expect(
            registerUser({
                name: 'Test User',
                email: 'test@example.com',
                password: 'StrongPass123!',
            }),
        ).rejects.toBe(databaseError);
    });
});
