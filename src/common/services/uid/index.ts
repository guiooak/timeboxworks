/** Generate a unique id (RFC 4122 v4). */
export function uid(): string {
  return crypto.randomUUID();
}
