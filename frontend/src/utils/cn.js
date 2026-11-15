// Tiny className joiner — truthy strings only. Avoids a clsx dependency.
export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}
