
const { registerSchema } = require('../../src/utils/authValidation');

describe('Registration validation', () => {
    it('accepts valid registration data and normalizes email', () => {
        const result = registerSchema.safeParse({
            name: ' Test User ',
            email: 'TEST@example.com',
            password: 'StrongPass123!',
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.name).toBe('Test User');
            expect(result.data.email).toBe('test@example.com');
        }
    });

    it('rejects an invalid email address', () => {
        const result = registerSchema.safeParse({
            name: 'Test User',
            email: 'not-an-email',
            password: 'StrongPass123!',
        });

        expect(result.success).toBe(false);
    });

    it('rejects a password shorter than 8 characters', () => {
        const result = registerSchema.safeParse({
            name: 'Test User',
            email: 'test@example.com',
            password: 'short',
        });

        expect(result.success).toBe(false);
    });

    it('rejects unexpected fields', () => {
        const result = registerSchema.safeParse({
            name: 'Test User',
            email: 'test@example.com',
            password: 'StrongPass123!',
            isAdmin: true,
        });

        expect(result.success).toBe(false);
    });
});
