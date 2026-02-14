export function log(tag: string, data?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  const line = data ? `[${ts}] ${tag} ${JSON.stringify(data)}` : `[${ts}] ${tag}`;
  console.log(line);
}
