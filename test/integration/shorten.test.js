jest.mock('../../src/services/urlService');

const request = require('supertest');
const urlService = require('../../src/services/urlService');
const app = require('../../src/app');

describe('POST /api/shorten', () => {
  beforeEach(() => {
    urlService.createShortUrl.mockReset();
  });

  it('returns 201 with the short code and short url for a valid URL', async () => {
    urlService.createShortUrl.mockResolvedValue({
      id: 62,
      shortCode: '10',
      longUrl: 'https://example.com/very/long/path',
    });

    const res = await request(app)
      .post('/api/shorten')
      .send({ url: 'https://example.com/very/long/path' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      shortCode: '10',
      shortUrl: expect.stringContaining('/10'),
    });
    expect(urlService.createShortUrl).toHaveBeenCalledWith('https://example.com/very/long/path');
  });

  it.each([
    [{ url: 'not-a-url' }, 'malformed URL'],
    [{ url: 'javascript:alert(1)' }, 'disallowed protocol'],
    [{}, 'missing url field'],
  ])('returns 400 for %p (%s)', async (body) => {
    const res = await request(app).post('/api/shorten').send(body);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(urlService.createShortUrl).not.toHaveBeenCalled();
  });

  it('returns 500 via the centralized error handler when the service throws', async () => {
    urlService.createShortUrl.mockRejectedValue(new Error('db unavailable'));

    const res = await request(app).post('/api/shorten').send({ url: 'https://example.com' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { message: 'db unavailable' } });
  });
});
