import type { ISyncProvider, SyncProviderId } from "./sync-provider-types.ts";
import { GithubGistProvider } from "./github-gist-provider.ts";

const registry = new Map<SyncProviderId, ISyncProvider>();

// Register default providers
const defaultGistProvider = new GithubGistProvider();
registry.set(defaultGistProvider.id, defaultGistProvider);

export function registerSyncProvider(provider: ISyncProvider): void {
  registry.set(provider.id, provider);
}

export function getSyncProvider(
  providerId: SyncProviderId = "github_gist",
): ISyncProvider {
  const provider = registry.get(providerId);
  if (!provider) {
    // Fallback to GitHub Gist provider if specified provider is not found
    return defaultGistProvider;
  }
  return provider;
}
