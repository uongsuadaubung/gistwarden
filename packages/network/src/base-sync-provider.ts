import {
  type GistId,
  type GitHubAccessToken,
  type ISyncProvider,
  isRecord,
  type SyncOptions,
  type SyncProviderId,
  type SyncResult,
  type SyncStatusResult,
  type SyncValidationResult,
  safeJsonParse,
  type TranslationKey,
} from "@gistwarden/domain";
import type { Result } from "neverthrow";

/**
 * BaseSyncProvider - Template Method Pattern for ISyncProvider.
 * Encapsulates common workflow for checking vault status, parsing encrypted envelopes,
 * and handling offline fallbacks across all providers.
 */
export abstract class BaseSyncProvider implements ISyncProvider {
  abstract readonly id: SyncProviderId;
  abstract readonly name: string;

  abstract upload(
    content: string,
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>>;

  abstract download(
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>>;

  abstract delete(
    targetId?: GistId,
    options?: SyncOptions,
  ): Promise<Result<void, TranslationKey>>;

  abstract validateConfig(
    configToken?: GitHubAccessToken,
  ): Promise<Result<SyncValidationResult, TranslationKey>>;

  abstract isConfigured(options?: SyncOptions): Promise<boolean>;

  /**
   * Hook for subclasses to determine if a remote download should be attempted based on options.
   * Default implementation checks if a token or local storage is present.
   */
  protected shouldAttemptDownload(options?: SyncOptions): boolean {
    return Boolean(options?.token);
  }

  /**
   * Helper to safely extract salt from downloaded JSON string payload.
   */
  protected extractSaltFromPayload(content: string): string | undefined {
    const parseRes = safeJsonParse(content);
    if (parseRes.isOk() && isRecord(parseRes.value)) {
      const salt = parseRes.value.salt;
      if (typeof salt === "string" && salt.trim().length > 0) {
        return salt.trim();
      }
    }
    return undefined;
  }

  /**
   * Template Method: Coordinates standard vault status checking across all providers.
   * 1. Checks if download is feasible with given credentials.
   * 2. Attempts download of vault payload.
   * 3. Parses envelope to retrieve encryption salt.
   * 4. Handles 404 (not found) vs offline fallback gracefully.
   */
  async checkVaultStatus(options?: SyncOptions): Promise<SyncStatusResult> {
    if (!this.shouldAttemptDownload(options)) {
      if (options?.hasStoredSalt) {
        return { status: "exists" };
      }
      return { status: "new" };
    }

    const downloadRes = await this.download(options);

    if (downloadRes.isOk() && downloadRes.value.content) {
      const content = downloadRes.value.content;
      const foundGistId = downloadRes.value.gistId;
      const salt = this.extractSaltFromPayload(content);

      if (salt) {
        return {
          status: "exists",
          salt,
          gistId: foundGistId,
        };
      }
      return { status: "exists", gistId: foundGistId };
    }

    if (
      downloadRes.isErr() &&
      downloadRes.error === "provider_error_not_found"
    ) {
      return { status: "new" };
    }

    if (options?.hasStoredSalt) {
      return { status: "exists" };
    }

    return { status: "new" };
  }
}
