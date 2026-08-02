const BASE62_PATTERN = /^[0-9a-zA-Z]+$/;

function isValidShortCode(code) {
  return typeof code === 'string' && BASE62_PATTERN.test(code);
}

module.exports = { isValidShortCode };
