import { type Result } from "neverthrow";
import type { TranslationKey } from "@gistwarden/domain";
import {
  deleteGist,
  downloadFromGist,
  uploadToGist,
  validateToken,
} from "./github-api.ts";
import type {
  ISyncProvider,
  SyncOptions,
  SyncProviderId,
  SyncResult,
  SyncValidationResult,
} from "./sync-provider-types.ts";

export class GithubGistProvider implements ISyncProvider {
  readonly id: SyncProviderId = "github_gist";
  readonly name = "GitHub Gist";

  async upload(
    content: string,
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>> {
    return await uploadToGist(content, options);
  }

  async download(
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>> {
    return await downloadFromGist(options);
  }

  async delete(
    targetId?: string,
    options?: SyncOptions,
  ): Promise<Result<void, TranslationKey>> {
    return await deleteGist(targetId || "", options?.token);
  }

  async validateConfig(
    configToken?: string,
  ): Promise<Result<SyncValidationResult, TranslationKey>> {
    return await validateToken(configToken || "");
  }
}
