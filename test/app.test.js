
const request = require('supertest');
const app = require('../src/app');

describe('GET /api/v1/health', () => {
    it('returns the API health status', async () => {
        const response = await request(app).get('/api/v1/health');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('healthy');
        expect(response.body.data.service).toBe('airtribe-task-manager');
    });
});

describe('Unknown routes', () => {
    it('returns a JSON 404 response', async () => {
        const response = await request(app).get('/api/v1/does-not-exist');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});
