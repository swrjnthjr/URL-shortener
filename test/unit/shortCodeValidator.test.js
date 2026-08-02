const { isValidShortCode } = require('../../src/lib/shortCodeValidator');

describe('isValidShortCode', () => {
  it.each(['0', '1', 'Z', 'abc123XYZ'])('accepts %p', (code) => {
    expect(isValidShortCode(code)).toBe(true);
  });

  it.each([
    ['abc$', 'invalid character'],
    ['abc def', 'whitespace'],
    ['../etc', 'path traversal-like input'],
    ['', 'empty string'],
    [undefined, 'undefined'],
    [null, 'null'],
    [123, 'non-string'],
  ])('rejects %p (%s)', (value) => {
    expect(isValidShortCode(value)).toBe(false);
  });
});
