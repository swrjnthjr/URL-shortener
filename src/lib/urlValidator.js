const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

function isValidUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  try {
    const parsed = new URL(value);
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

module.exports = { isValidUrl };
