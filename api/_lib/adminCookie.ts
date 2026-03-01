function readHeader(req: any, name: string) {
  const value = req?.headers?.[name];
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : undefined;
}

function getRequestHost(req: any) {
  return readHeader(req, 'x-forwarded-host') || readHeader(req, 'host') || '';
}

function getHostname(host: string) {
  const trimmed = host.split(',')[0].trim();

  if (trimmed.startsWith('[')) {
    const end = trimmed.indexOf(']');
    return end >= 0 ? trimmed.slice(1, end).toLowerCase() : trimmed.toLowerCase();
  }

  return trimmed.split(':')[0].toLowerCase();
}

function isLocalHostname(host: string) {
  const hostname = getHostname(host);
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function isHttpsRequest(req: any) {
  const forwardedProto = readHeader(req, 'x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0].trim().toLowerCase() === 'https';
  }

  return Boolean(req?.socket?.encrypted);
}

export function buildAdminCookie(token: string, req: any, maxAgeSec = 60 * 60 * 2) {
  const parts = [
    `admin_token=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSec}`
  ];

  const allowInsecureLocalhost = !isHttpsRequest(req) && isLocalHostname(getRequestHost(req));
  if (!allowInsecureLocalhost) {
    parts.push('Secure');
  }

  return parts.join('; ');
}
