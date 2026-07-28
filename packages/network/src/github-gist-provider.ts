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
  SyncProviderId,
  SyncValidationResult,
} from "./sync-provider-types.ts";

export class GithubGistProvider implements ISyncProvider {
  readonly id: SyncProviderId = "github_gist";
  readonly name = "GitHub Gist";

  async upload(content: string): Promise<Result<void, TranslationKey>> {
    return await uploadToGist(content);
  }

  async download(): Promise<Result<string, TranslationKey>> {
    return await downloadFromGist();
  }

  async delete(targetId?: string): Promise<Result<void, TranslationKey>> {
    return await deleteGist(targetId || "");
  }

  async validateConfig(
    configToken?: string,
  ): Promise<Result<SyncValidationResult, TranslationKey>> {
    return await validateToken(configToken || "");
  }
}
