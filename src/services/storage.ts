/**
 * Thin wrapper around localStorage. Kept as its own service so the
 * prototype's persistence layer can later be swapped for a real backend
 * without touching callers (see repository.ts).
 */
export class LocalStorageService {
  private readonly namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  private key(name: string): string {
    return `${this.namespace}:${name}`;
  }

  get<T>(name: string): T | null {
    try {
      const raw = window.localStorage.getItem(this.key(name));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(name: string, value: T): void {
    try {
      window.localStorage.setItem(this.key(name), JSON.stringify(value));
    } catch {
      // localStorage can throw in private-browsing/quota-exceeded cases;
      // the prototype degrades to in-memory-only state for that session.
    }
  }

  remove(name: string): void {
    window.localStorage.removeItem(this.key(name));
  }

  clearAll(names: string[]): void {
    names.forEach((n) => this.remove(n));
  }
}
