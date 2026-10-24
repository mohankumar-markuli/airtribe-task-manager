
const { registerSchema } = require('../utils/authValidation');
const {
    registerUser,
    AuthServiceError,
} = require('../services/authService');

async function register(req, res, next) {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validation.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        });
    }

    try {
        const user = await registerUser(validation.data);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                user,
            },
        });
    } catch (error) {
        if (error instanceof AuthServiceError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        return next(error);
    }
}

module.exports = {
    register,
};
