const { isValidUrl } = require('../../src/lib/urlValidator');

describe('isValidUrl', () => {
  it.each([
    'http://example.com',
    'https://example.com/path?query=1',
    'https://sub.example.com:8080/path',
  ])('accepts %s', (url) => {
    expect(isValidUrl(url)).toBe(true);
  });

  it.each([
    ['javascript:alert(1)', 'disallowed protocol'],
    ['data:text/html,<script>alert(1)</script>', 'disallowed protocol'],
    ['file:///etc/passwd', 'disallowed protocol'],
    ['not-a-url', 'unparseable'],
    ['', 'empty string'],
    [' ', 'whitespace only'],
    [undefined, 'undefined'],
    [null, 'null'],
    [123, 'non-string'],
  ])('rejects %p (%s)', (value) => {
    expect(isValidUrl(value)).toBe(false);
  });
});
