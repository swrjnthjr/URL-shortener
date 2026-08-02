jest.mock('../../src/services/urlService');
jest.mock('../../src/services/analyticsService');

const request = require('supertest');
const urlService = require('../../src/services/urlService');
const analyticsService = require('../../src/services/analyticsService');
const app = require('../../src/app');

describe('GET /:code', () => {
  beforeEach(() => {
    urlService.resolveShortCode.mockReset();
    analyticsService.recordClick.mockReset().mockResolvedValue(undefined);
  });

  it('301-redirects to the long url for a known code', async () => {
    urlService.resolveShortCode.mockResolvedValue('https://example.com/very/long/path');

    const res = await request(app).get('/10');

    expect(res.status).toBe(301);
    expect(res.headers.location).toBe('https://example.com/very/long/path');
    expect(urlService.resolveShortCode).toHaveBeenCalledWith('10');
  });

  it('records a click with referrer/user-agent for a resolved redirect', async () => {
    urlService.resolveShortCode.mockResolvedValue('https://example.com');

    await request(app)
      .get('/10')
      .set('Referer', 'https://google.com')
      .set('User-Agent', 'jest-agent');

    expect(analyticsService.recordClick).toHaveBeenCalledWith('10', {
      referrer: 'https://google.com',
      userAgent: 'jest-agent',
    });
  });

  it('still redirects even if click recording fails', async () => {
    urlService.resolveShortCode.mockResolvedValue('https://example.com');
    analyticsService.recordClick.mockRejectedValue(new Error('insert failed'));

    const res = await request(app).get('/10');

    expect(res.status).toBe(301);
    expect(res.headers.location).toBe('https://example.com');
  });

  it('returns 404 when the service finds no matching url', async () => {
    urlService.resolveShortCode.mockResolvedValue(null);

    const res = await request(app).get('/zzzzzz');

    expect(res.status).toBe(404);
    expect(analyticsService.recordClick).not.toHaveBeenCalled();
  });

  it('returns 404 without calling the service for an invalid short code', async () => {
    const res = await request(app).get('/abc$def');

    expect(res.status).toBe(404);
    expect(urlService.resolveShortCode).not.toHaveBeenCalled();
    expect(analyticsService.recordClick).not.toHaveBeenCalled();
  });

  it('returns 500 via the centralized error handler when the service throws', async () => {
    urlService.resolveShortCode.mockRejectedValue(new Error('db unavailable'));

    const res = await request(app).get('/10');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { message: 'db unavailable' } });
  });
});
