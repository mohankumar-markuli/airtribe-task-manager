
const { loginSchema } = require('../../src/utils/authValidation');

describe('Login validation', () => {
    it('accepts valid credentials and normalizes the email', () => {
        const result = loginSchema.safeParse({
            email: 'TEST@example.com',
            password: 'StrongPass123!',
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.email).toBe('test@example.com');
        }
    });

    it('rejects an invalid email address', () => {
        const result = loginSchema.safeParse({
            email: 'invalid-email',
            password: 'StrongPass123!',
        });

        expect(result.success).toBe(false);
    });

    it('rejects a missing password', () => {
        const result = loginSchema.safeParse({
            email: 'test@example.com',
            password: '',
        });

        expect(result.success).toBe(false);
    });

    it('rejects unexpected fields', () => {
        const result = loginSchema.safeParse({
            email: 'test@example.com',
            password: 'StrongPass123!',
            isAdmin: true,
        });

        expect(result.success).toBe(false);
    });
});
