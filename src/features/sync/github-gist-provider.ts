import { err, ok, type Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import { fetchGistContent } from "@/features/sync/github-api.ts";
import { sendMessageToBackground } from "@/core/messaging.ts";
import {
  MSG_DELETE_GIST,
  MSG_UPLOAD_TO_GIST,
  MSG_VALIDATE_TOKEN,
} from "@/core/constants.ts";
import { ValidateTokenResponseSchema } from "@/core/storage-schemas.ts";
import { SyncResponseSchema } from "@/features/sync/sync-utils.ts";
import type {
  ISyncProvider,
  SyncProviderId,
  SyncValidationResult,
} from "@/features/sync/sync-provider-types.ts";

export class GithubGistProvider implements ISyncProvider {
  readonly id: SyncProviderId = "github_gist";
  readonly name = "GitHub Gist";

  async upload(content: string): Promise<Result<void, TranslationKey>> {
    const sendResult = await sendMessageToBackground({
      type: MSG_UPLOAD_TO_GIST,
      content,
    });
    if (sendResult.isErr()) return err(sendResult.error);

    const parseRes = SyncResponseSchema.safeParse(sendResult.value);
    if (!parseRes.success || !parseRes.data.success) {
      const errorKey: TranslationKey =
        (parseRes.success && parseRes.data.error) || "storage_error";
      return err(errorKey);
    }
    return ok();
  }

  async download(): Promise<Result<string, TranslationKey>> {
    const fetchRes = await fetchGistContent();
    if (fetchRes.isErr()) {
      return err(fetchRes.error);
    }
    return ok(fetchRes.value.rawContent);
  }

  async delete(targetId?: string): Promise<Result<void, TranslationKey>> {
    const sendResult = await sendMessageToBackground({
      type: MSG_DELETE_GIST,
      content: targetId || "",
    });
    if (sendResult.isErr()) return err(sendResult.error);

    const parseRes = SyncResponseSchema.safeParse(sendResult.value);
    if (!parseRes.success || !parseRes.data.success) {
      const errorKey: TranslationKey =
        (parseRes.success && parseRes.data.error) || "storage_error";
      return err(errorKey);
    }
    return ok();
  }

  async validateConfig(
    configToken?: string,
  ): Promise<Result<SyncValidationResult, TranslationKey>> {
    const sendResult = await sendMessageToBackground({
      type: MSG_VALIDATE_TOKEN,
      token: configToken || "",
    });
    if (sendResult.isErr()) return err(sendResult.error);

    const parseRes = ValidateTokenResponseSchema.safeParse(sendResult.value);
    if (!parseRes.success || !parseRes.data.success) {
      const errorKey: TranslationKey =
        (parseRes.success && parseRes.data.error) ||
        "login_error_invalid_token";
      return err(errorKey);
    }

    return ok({
      username: parseRes.data.username || "",
      avatarUrl: parseRes.data.avatarUrl || "",
    });
  }
}
