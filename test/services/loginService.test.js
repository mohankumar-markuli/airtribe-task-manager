
jest.mock('../../src/models/User', () => ({
    exists: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const {
    AuthServiceError,
    loginUser,
} = require('../../src/services/authService');

describe('loginUser', () => {
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

    it('returns a signed access token for valid credentials', async () => {
        const user = mockUser();

        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(user),
        });

        const result = await loginUser({
            email: 'test@example.com',
            password: 'StrongPass123!',
        });

        expect(User.findOne).toHaveBeenCalledWith({
            email: 'test@example.com',
        });
        expect(user.comparePassword).toHaveBeenCalledWith('StrongPass123!');
        expect(result.user).toEqual({
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
        });
        expect(result.tokenType).toBe('Bearer');

        const decoded = jwt.verify(
            result.accessToken,
            process.env.JWT_SECRET,
        );

        expect(decoded.sub).toBe('user-123');
    });

    it('rejects an unknown email', async () => {
        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(null),
        });

        await expect(
            loginUser({
                email: 'unknown@example.com',
                password: 'StrongPass123!',
            }),
        ).rejects.toMatchObject({
            name: 'AuthServiceError',
            statusCode: 401,
            message: 'Invalid email or password',
        });
    });

    it('rejects an incorrect password', async () => {
        const user = mockUser({
            comparePassword: jest.fn().mockResolvedValue(false),
        });

        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(user),
        });

        await expect(
            loginUser({
                email: 'test@example.com',
                password: 'WrongPassword123!',
            }),
        ).rejects.toBeInstanceOf(AuthServiceError);
    });

    it('rejects inactive accounts', async () => {
        const user = mockUser({ isActive: false });

        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(user),
        });

        await expect(
            loginUser({
                email: 'test@example.com',
                password: 'StrongPass123!',
            }),
        ).rejects.toMatchObject({
            statusCode: 401,
            message: 'Invalid email or password',
        });

        expect(user.comparePassword).not.toHaveBeenCalled();
    });

    it('fails safely when the JWT secret is missing', async () => {
        delete process.env.JWT_SECRET;

        const user = mockUser();

        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(user),
        });

        await expect(
            loginUser({
                email: 'test@example.com',
                password: 'StrongPass123!',
            }),
        ).rejects.toThrow('JWT_SECRET is not configured.');
    });
});
