jest.mock('../../src/services/urlService');

const request = require('supertest');
const urlService = require('../../src/services/urlService');
const app = require('../../src/app');

describe('GET /:code', () => {
  beforeEach(() => {
    urlService.resolveShortCode.mockReset();
  });

  it('301-redirects to the long url for a known code', async () => {
    urlService.resolveShortCode.mockResolvedValue('https://example.com/very/long/path');

    const res = await request(app).get('/10');

    expect(res.status).toBe(301);
    expect(res.headers.location).toBe('https://example.com/very/long/path');
    expect(urlService.resolveShortCode).toHaveBeenCalledWith('10');
  });

  it('returns 404 when the service finds no matching url', async () => {
    urlService.resolveShortCode.mockResolvedValue(null);

    const res = await request(app).get('/zzzzzz');

    expect(res.status).toBe(404);
  });

  it('returns 404 without calling the service for an invalid short code', async () => {
    const res = await request(app).get('/abc$def');

    expect(res.status).toBe(404);
    expect(urlService.resolveShortCode).not.toHaveBeenCalled();
  });

  it('returns 500 via the centralized error handler when the service throws', async () => {
    urlService.resolveShortCode.mockRejectedValue(new Error('db unavailable'));

    const res = await request(app).get('/10');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { message: 'db unavailable' } });
  });
});
