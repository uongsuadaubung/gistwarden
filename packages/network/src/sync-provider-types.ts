import type { Result } from "neverthrow";
import type { TranslationKey } from "@gistwarden/domain";

export type SyncProviderId = "github_gist";

export interface SyncValidationResult {
  username: string;
  avatarUrl: string;
}

export interface SyncOptions {
  token?: string;
  gistId?: string;
  username?: string;
}

export interface SyncResult {
  content?: string;
  gistId?: string;
}

export interface ISyncProvider {
  readonly id: SyncProviderId;
  readonly name: string;

  upload(
    content: string,
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>>;
  download(
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>>;
  delete(
    targetId?: string,
    options?: SyncOptions,
  ): Promise<Result<void, TranslationKey>>;
  validateConfig(
    configToken?: string,
  ): Promise<Result<SyncValidationResult, TranslationKey>>;
}
