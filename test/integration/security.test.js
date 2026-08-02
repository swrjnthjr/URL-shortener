const request = require('supertest');

describe('security headers (helmet)', () => {
  it('applies baseline headers and hides X-Powered-By', async () => {
    jest.resetModules();
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_MAX_REQUESTS;

    const app = require('../../src/app');
    const res = await request(app).get('/');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('rate limiting on POST /api/shorten', () => {
  afterEach(() => {
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_MAX_REQUESTS;
  });

  it('returns 429 after exceeding the configured limit', async () => {
    jest.resetModules();
    process.env.RATE_LIMIT_WINDOW_MS = '60000';
    process.env.RATE_LIMIT_MAX_REQUESTS = '2';

    const app = require('../../src/app');

    await request(app).post('/api/shorten').send({ url: 'not-a-url' });
    await request(app).post('/api/shorten').send({ url: 'not-a-url' });
    const res = await request(app).post('/api/shorten').send({ url: 'not-a-url' });

    expect(res.status).toBe(429);
    expect(res.body.error.message).toMatch(/too many requests/i);
  });

  it('does not rate-limit the redirect route', async () => {
    jest.resetModules();
    process.env.RATE_LIMIT_WINDOW_MS = '60000';
    process.env.RATE_LIMIT_MAX_REQUESTS = '1';

    jest.mock('../../src/services/urlService');
    const urlService = require('../../src/services/urlService');
    urlService.resolveShortCode.mockResolvedValue(null);

    const app = require('../../src/app');

    await request(app).get('/abc');
    const res = await request(app).get('/abc');

    expect(res.status).not.toBe(429);
  });
});
