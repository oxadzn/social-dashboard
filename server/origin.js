export function matchesOrigin(request, allowedOrigins = []) {
  const origin = request.get('origin');
  if (!origin) return false;

  try {
    const url = new URL(origin);
    if (url.origin === origin && allowedOrigins.includes(url.origin)) return true;

    const forwardedProtocol = request.get('x-forwarded-proto')?.split(',')[0].trim();
    const protocol = forwardedProtocol || (request.secure ? 'https' : 'http');
    return url.host === request.get('host') && url.protocol === `${protocol}:`;
  } catch {
    return false;
  }
}
