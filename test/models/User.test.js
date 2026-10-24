
const User = require('../../src/models/User');
const bcrypt = require('bcryptjs');

describe('User model password security', () => {
    it('hashes the password before saving', async () => {
        const user = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'StrongPass123!',
        });

        await user.validate();

        // Run the save hook directly without connecting to MongoDB.
        await User.schema.s.hooks.execPre('save', user, []);

        expect(user.password).not.toBe('StrongPass123!');
        expect(user.password).toMatch(/^\$2[aby]\$/);
        expect(await bcrypt.compare('StrongPass123!', user.password)).toBe(true);
    });

    it('compares a candidate password with the stored hash', async () => {
        const user = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'StrongPass123!',
        });

        user.password = await bcrypt.hash('StrongPass123!', 12);

        await expect(user.comparePassword('StrongPass123!')).resolves.toBe(true);
        await expect(user.comparePassword('WrongPassword123!')).resolves.toBe(false);
    });
});
