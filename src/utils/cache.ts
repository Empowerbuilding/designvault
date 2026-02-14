// ── Client-side AI result cache ─────────────────────────────
// Prevents re-calling the API when users swap back and forth
// between styles on the same plan. 1-hour TTL.

interface CacheEntry {
  url: string;
  timestamp: number;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

export class ClientCache {
  private store = new Map<string, CacheEntry>();
  private ttl: number;

  constructor(ttlMs: number = ONE_HOUR_MS) {
    this.ttl = ttlMs;
  }

  /** Build a cache key from plan + action */
  static key(planId: string, actionType: string, params: string): string {
    return `${planId}-${actionType}-${params}`;
  }

  /** Returns cached URL if present and less than TTL old, else null */
  get(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.url;
  }

  /** Store an AI result URL */
  set(key: string, url: string): void {
    this.store.set(key, { url, timestamp: Date.now() });
  }

  /** Remove a specific entry */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Clear all entries */
  clear(): void {
    this.store.clear();
  }

  /** Number of entries currently stored */
  get size(): number {
    return this.store.size;
  }
}
