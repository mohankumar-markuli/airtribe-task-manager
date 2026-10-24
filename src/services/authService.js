
const jwt = require('jsonwebtoken');
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
        if (error.code === 11000) {
            throw new AuthServiceError(
                'An account with this email already exists',
                409,
            );
        }

        throw error;
    }
}

async function loginUser({ email, password }) {
    const user = await User.findOne({ email }).select('+password');

    // Use the same error for unknown emails and incorrect passwords.
    if (!user || !user.isActive) {
        throw new AuthServiceError('Invalid email or password', 401);
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
        throw new AuthServiceError('Invalid email or password', 401);
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured.');
    }

    const accessToken = jwt.sign(
        {
            sub: user.id,
        },
        jwtSecret,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '15m',
            algorithm: 'HS256',
        },
    );

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
        accessToken,
        tokenType: 'Bearer',
    };
}

async function getCurrentUser(userId) {
    const user = await User.findById(userId).select(
        'name email createdAt updatedAt',
    );

    if (!user || !user.isActive) {
        throw new AuthServiceError('User account not found', 404);
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

module.exports = {
    AuthServiceError,
    registerUser,
    loginUser,
    getCurrentUser,
};
