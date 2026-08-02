const errorHandler = require('../../src/middleware/errorHandler');

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('errorHandler', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('responds with the error status and message when set', () => {
    const res = mockRes();
    const err = Object.assign(new Error('bad request'), { status: 400 });

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'bad request' } });
  });

  it('defaults to 500 with a generic message when the error has neither', () => {
    const res = mockRes();
    const err = new Error();

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Internal Server Error' } });
  });

  it('logs the error', () => {
    const res = mockRes();
    const err = new Error('boom');

    errorHandler(err, {}, res, jest.fn());

    expect(consoleErrorSpy).toHaveBeenCalledWith(err);
  });
});
