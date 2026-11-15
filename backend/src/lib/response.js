// Consistent response envelope: { data, error, meta } (spec §12).
// Errors never include secrets or stack traces.

export function ok(c, data, meta = null, status = 200) {
  return c.json({ data, error: null, meta }, status)
}

export function fail(c, code, message, status = 400) {
  const requestId = c.get('requestId') || crypto.randomUUID()
  return c.json({ data: null, error: { code, message, requestId }, meta: null }, status)
}
