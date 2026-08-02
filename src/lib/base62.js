const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = ALPHABET.length;
const CHAR_TO_INDEX = new Map([...ALPHABET].map((char, index) => [char, index]));

function encode(id) {
  if (!Number.isInteger(id) || id < 0) {
    throw new TypeError(`base62.encode expects a non-negative integer, got ${id}`);
  }

  if (id === 0) {
    return ALPHABET[0];
  }

  let value = id;
  let result = '';
  while (value > 0) {
    result = ALPHABET[value % BASE] + result;
    value = Math.floor(value / BASE);
  }

  return result;
}

function decode(code) {
  if (typeof code !== 'string' || code.length === 0) {
    throw new TypeError('base62.decode expects a non-empty string');
  }

  let value = 0;
  for (const char of code) {
    const digit = CHAR_TO_INDEX.get(char);
    if (digit === undefined) {
      throw new Error(`base62.decode received an invalid character: ${char}`);
    }
    value = value * BASE + digit;
  }

  return value;
}

module.exports = { encode, decode };
