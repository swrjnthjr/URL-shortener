const base62 = require('../../src/lib/base62');

describe('base62.encode', () => {
  it('encodes 0 to the first alphabet character', () => {
    expect(base62.encode(0)).toBe('0');
  });

  it('encodes small ids to short codes', () => {
    expect(base62.encode(1)).toBe('1');
    expect(base62.encode(61)).toBe('Z');
    expect(base62.encode(62)).toBe('10');
  });

  it('throws on negative numbers', () => {
    expect(() => base62.encode(-1)).toThrow(TypeError);
  });

  it('throws on non-integer input', () => {
    expect(() => base62.encode(1.5)).toThrow(TypeError);
    expect(() => base62.encode('5')).toThrow(TypeError);
  });
});

describe('base62.decode', () => {
  it('decodes the first alphabet character to 0', () => {
    expect(base62.decode('0')).toBe(0);
  });

  it('decodes short codes back to their ids', () => {
    expect(base62.decode('1')).toBe(1);
    expect(base62.decode('Z')).toBe(61);
    expect(base62.decode('10')).toBe(62);
  });

  it('throws on an invalid character', () => {
    expect(() => base62.decode('abc$')).toThrow(/invalid character/);
  });

  it('throws on empty input', () => {
    expect(() => base62.decode('')).toThrow(TypeError);
  });
});

describe('base62 round-trip', () => {
  const ids = [0, 1, 61, 62, 1000, 999999, Number.MAX_SAFE_INTEGER];

  it.each(ids)('encode/decode are inverses for id=%p', (id) => {
    expect(base62.decode(base62.encode(id))).toBe(id);
  });
});
