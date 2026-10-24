
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../src/middlewares/authMiddleware');

describe('authenticateToken', () => {
    const originalJwtSecret = process.env.JWT_SECRET;
    const testSecret = 'middleware-test-secret';

    beforeEach(() => {
        process.env.JWT_SECRET = testSecret;
    });

    afterAll(() => {
        if (originalJwtSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalJwtSecret;
        }
    });

    function mockResponse() {
        return {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    }

    function mockRequest(token) {
        return {
            headers: token === undefined
                ? {}
                : { authorization: token },
        };
    }

    it('accepts a valid token and attaches the user ID', () => {
        const token = jwt.sign(
            { sub: 'user-123' },
            testSecret,
            { expiresIn: '15m', algorithm: 'HS256' },
        );

        const req = mockRequest(`Bearer ${token}`);
        const res = mockResponse();
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(req.user).toEqual({ id: 'user-123' });
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects a missing authorization header', () => {
        const req = mockRequest();
        const res = mockResponse();
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects an invalid token', () => {
        const req = mockRequest('Bearer invalid-token');
        const res = mockResponse();
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Invalid or expired access token',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects an expired token', () => {
        const token = jwt.sign(
            { sub: 'user-123' },
            testSecret,
            { expiresIn: -1, algorithm: 'HS256' },
        );

        const req = mockRequest(`Bearer ${token}`);
        const res = mockResponse();
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a token signed with another secret', () => {
        const token = jwt.sign(
            { sub: 'user-123' },
            'a-different-test-secret',
            { expiresIn: '15m', algorithm: 'HS256' },
        );

        const req = mockRequest(`Bearer ${token}`);
        const res = mockResponse();
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns HTTP 500 if the JWT secret is missing', () => {
        delete process.env.JWT_SECRET;

        const req = mockRequest('Bearer some-token');
        const res = mockResponse();
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Authentication service is not configured',
        });
        expect(next).not.toHaveBeenCalled();
    });
});
