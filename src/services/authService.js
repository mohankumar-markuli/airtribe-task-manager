
const User = require('../models/User');

class AuthServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'AuthServiceError';
        this.statusCode = statusCode;
    }
}

async function registerUser({ name, email, password }) {
    const existingUser = await User.exists({ email });

    if (existingUser) {
        throw new AuthServiceError(
            'An account with this email already exists',
            409,
        );
    }

    try {
        const user = await User.create({
            name,
            email,
            password,
        });

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        };
    } catch (error) {
        // The unique database index is the final protection against
        // two simultaneous registrations using the same email.
        if (error.code === 11000) {
            throw new AuthServiceError(
                'An account with this email already exists',
                409,
            );
        }

        throw error;
    }
}

module.exports = {
    AuthServiceError,
    registerUser,
};
