jest.mock('../../src/lib/db');

const db = require('../../src/lib/db');
const urlService = require('../../src/services/urlService');

describe('urlService.createShortUrl', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('inserts the long url, encodes the returned id, and updates short_code', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 62 }] }) // INSERT ... RETURNING id
      .mockResolvedValueOnce({ rows: [] }); // UPDATE

    const result = await urlService.createShortUrl('https://example.com/very/long/path');

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      'INSERT INTO urls (long_url) VALUES ($1) RETURNING id',
      ['https://example.com/very/long/path']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      'UPDATE urls SET short_code = $1 WHERE id = $2',
      ['10', 62]
    );
    expect(result).toEqual({ id: 62, shortCode: '10', longUrl: 'https://example.com/very/long/path' });
  });

  it('propagates errors from the insert query', async () => {
    db.query.mockRejectedValueOnce(new Error('insert failed'));

    await expect(urlService.createShortUrl('https://example.com')).rejects.toThrow('insert failed');
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('propagates errors from the update query', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockRejectedValueOnce(new Error('update failed'));

    await expect(urlService.createShortUrl('https://example.com')).rejects.toThrow('update failed');
  });
});

describe('urlService.resolveShortCode', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('decodes the short code and returns the matching long url', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ long_url: 'https://example.com' }] });

    const result = await urlService.resolveShortCode('10');

    expect(db.query).toHaveBeenCalledWith('SELECT long_url FROM urls WHERE id = $1', [62]);
    expect(result).toBe('https://example.com');
  });

  it('returns null when no matching row exists', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await urlService.resolveShortCode('999999');

    expect(result).toBeNull();
  });

  it('propagates errors from the select query', async () => {
    db.query.mockRejectedValueOnce(new Error('select failed'));

    await expect(urlService.resolveShortCode('1')).rejects.toThrow('select failed');
  });

  it('throws when the short code contains invalid characters', async () => {
    await expect(urlService.resolveShortCode('abc$')).rejects.toThrow(/invalid character/);
    expect(db.query).not.toHaveBeenCalled();
  });
});
