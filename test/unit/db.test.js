const mockQuery = jest.fn();
const mockPool = jest.fn().mockImplementation(() => ({ query: mockQuery }));

jest.mock('pg', () => ({ Pool: mockPool }));

describe('db', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    mockQuery.mockReset();
    mockPool.mockClear();
    process.env = { ...ORIGINAL_ENV, DATABASE_URL: 'postgres://test/db' };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('constructs the pool without ssl by default', () => {
    require('../../src/lib/db');
    expect(mockPool).toHaveBeenCalledWith({
      connectionString: 'postgres://test/db',
    });
  });

  it('constructs the pool with ssl when DB_SSL=true', () => {
    process.env.DB_SSL = 'true';
    require('../../src/lib/db');
    expect(mockPool).toHaveBeenCalledWith({
      connectionString: 'postgres://test/db',
      ssl: { rejectUnauthorized: false },
    });
  });

  it('delegates query() to the underlying pool and returns its result', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1 }] });
    const db = require('../../src/lib/db');

    const result = await db.query('SELECT * FROM urls WHERE id = $1', [1]);

    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM urls WHERE id = $1', [1]);
    expect(result).toEqual({ rows: [{ id: 1 }] });
  });

  it('propagates errors from the underlying pool', async () => {
    mockQuery.mockRejectedValue(new Error('connection lost'));
    const db = require('../../src/lib/db');

    await expect(db.query('SELECT 1')).rejects.toThrow('connection lost');
  });
});
