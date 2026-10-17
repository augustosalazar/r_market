// Minimal dependency-injection container: one instance per token (singletons).
export class Container {
  private singletons = new Map<symbol, unknown>();

  register<T>(token: symbol, instance: T) {
    this.singletons.set(token, instance);
    return this;
  }

  resolve<T>(token: symbol): T {
    if (!this.singletons.has(token)) {
      throw new Error(`No provider for ${String(token)}`);
    }
    return this.singletons.get(token) as T;
  }
}
