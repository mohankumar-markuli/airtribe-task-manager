
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authorizationHeader = req.headers.authorization;

    if (
        typeof authorizationHeader !== 'string' ||
        !authorizationHeader.startsWith('Bearer ')
    ) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        return res.status(500).json({
            success: false,
            message: 'Authentication service is not configured',
        });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret, {
            algorithms: ['HS256'],
        });

        if (
            typeof decoded !== 'object' ||
            typeof decoded.sub !== 'string' ||
            decoded.sub.length === 0
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired access token',
            });
        }

        req.user = {
            id: decoded.sub,
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired access token',
        });
    }
}

module.exports = {
    authenticateToken,
};
