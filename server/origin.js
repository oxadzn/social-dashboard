export function matchesOrigin(request, allowedOrigins = []) {
  const origin = request.get('origin');
  if (!origin) return false;

  try {
    const url = new URL(origin);
    return url.origin === origin && allowedOrigins.includes(url.origin);
  } catch {
    return false;
  }
}

export function isLoopbackAddress(address) {
  if (!address) return false;
  const normalized = address.toLowerCase().replace(/^::ffff:/, '');
  return normalized === '::1' || normalized.startsWith('127.');
}
