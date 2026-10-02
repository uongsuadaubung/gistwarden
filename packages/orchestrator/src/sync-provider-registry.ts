import type { ISyncProvider, SyncProviderId } from "@gistwarden/domain";
import { GithubGistProvider, SelfHostedProvider } from "@gistwarden/network";
import { LocalStorageProvider } from "@gistwarden/repository";

const providers: Record<SyncProviderId, ISyncProvider> = {
  github_gist: new GithubGistProvider(),
  local_storage: new LocalStorageProvider(),
  self_hosted_server: new SelfHostedProvider(),
};

export function getSyncProvider(
  providerId: SyncProviderId = "github_gist",
): ISyncProvider {
  return providers[providerId] ?? providers.github_gist;
}
