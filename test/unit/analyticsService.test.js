jest.mock('../../src/lib/db');

const db = require('../../src/lib/db');
const analyticsService = require('../../src/services/analyticsService');

describe('analyticsService.recordClick', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('inserts a click event with referrer and user agent', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await analyticsService.recordClick('10', {
      referrer: 'https://google.com',
      userAgent: 'jest-agent',
    });

    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO clicks (short_code, referrer, user_agent) VALUES ($1, $2, $3)',
      ['10', 'https://google.com', 'jest-agent']
    );
  });

  it('defaults missing referrer/userAgent to null', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await analyticsService.recordClick('10', {});

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['10', null, null]);
  });

  it('defaults to null when no metadata object is passed at all', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await analyticsService.recordClick('10');

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['10', null, null]);
  });

  it('propagates errors from the insert', async () => {
    db.query.mockRejectedValue(new Error('insert failed'));

    await expect(analyticsService.recordClick('10', {})).rejects.toThrow('insert failed');
  });
});
