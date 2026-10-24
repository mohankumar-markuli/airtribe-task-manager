
jest.mock('../../src/models/User', () => ({
    findById: jest.fn(),
}));

const User = require('../../src/models/User');
const {
    getCurrentUser,
    AuthServiceError,
} = require('../../src/services/authService');

describe('getCurrentUser', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    function mockUserQuery(user) {
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(user),
        });
    }

    it('returns the current user profile without a password', async () => {
        const user = {
            id: 'user-123',
            name: 'Alex Smith',
            email: 'alex@example.com',
            isActive: true,
            password: 'this-should-not-be-returned',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        };

        mockUserQuery(user);

        const result = await getCurrentUser('user-123');

        expect(User.findById).toHaveBeenCalledWith('user-123');
        expect(result).toEqual({
            id: 'user-123',
            name: 'Alex Smith',
            email: 'alex@example.com',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
        expect(result).not.toHaveProperty('password');
    });

    it('throws a 404 error when the user does not exist', async () => {
        mockUserQuery(null);

        await expect(getCurrentUser('missing-user')).rejects.toMatchObject({
            name: 'AuthServiceError',
            statusCode: 404,
            message: 'User account not found',
        });
    });

    it('throws a 404 error when the user account is inactive', async () => {
        mockUserQuery({
            id: 'user-123',
            isActive: false,
        });

        await expect(getCurrentUser('user-123')).rejects.toBeInstanceOf(
            AuthServiceError,
        );
    });
});
