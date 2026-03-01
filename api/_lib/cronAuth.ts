function firstHeader(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function getCronSecret(req: { headers?: Record<string, string | string[] | undefined> }) {
  const explicitSecret = firstHeader(req.headers?.['x-cron-secret']);
  if (explicitSecret) return explicitSecret;

  const authorization = firstHeader(req.headers?.authorization);
  if (!authorization?.startsWith('Bearer ')) return undefined;
  return authorization.slice(7);
}

export function isAuthorizedCronRequest(
  req: { headers?: Record<string, string | string[] | undefined> },
  expected: string | undefined
) {
  if (!expected) return false;
  return getCronSecret(req) === expected;
}
