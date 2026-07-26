import type { Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

export type SyncProviderId = "github_gist";

export interface SyncValidationResult {
  username: string;
  avatarUrl: string;
}

export interface ISyncProvider {
  readonly id: SyncProviderId;
  readonly name: string;

  upload(content: string): Promise<Result<void, TranslationKey>>;
  download(): Promise<Result<string, TranslationKey>>;
  delete(targetId?: string): Promise<Result<void, TranslationKey>>;
  validateConfig(
    configToken?: string,
  ): Promise<Result<SyncValidationResult, TranslationKey>>;
}
