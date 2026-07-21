import { z } from "zod";
import { encryptData } from "@/core/crypto.ts";
import { type VaultItem, VaultListSchema } from "@/core/types.ts";
import { setSessionItem } from "@/core/storage.ts";
import {
  MSG_UPLOAD_TO_GIST,
  SESSION_KEY_ENCRYPTED_VAULT,
} from "@/core/constants.ts";

export const SyncResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

import { sendMessageToBackground } from "@/core/messaging.ts";
import { type TranslationKey } from "@/core/i18n.ts";
import { err, ok, Result } from "neverthrow";

export async function syncVaultToGist(
  items: VaultItem[],
  key: CryptoKey,
  salt: string,
): Promise<Result<VaultItem[], TranslationKey>> {
  const parsedResult = VaultListSchema.safeParse(items);
  if (!parsedResult.success) {
    return err("storage_error");
  }
  const validatedList = parsedResult.data;

  const encryptRes = await encryptData(JSON.stringify(validatedList), key);
  if (encryptRes.isErr()) {
    return err("storage_error");
  }
  const encrypted = encryptRes.value;
  const payload = JSON.stringify({
    salt,
    iv: encrypted.iv,
    ciphertext: encrypted.ciphertext,
  });

  const sendResult = await sendMessageToBackground({
    type: MSG_UPLOAD_TO_GIST,
    content: payload,
  });
  if (sendResult.isErr()) {
    return err("storage_error");
  }
  const parseResResult = SyncResponseSchema.safeParse(sendResult.value);
  if (!parseResResult.success) {
    return err("storage_error");
  }
  const res = parseResResult.data;

  if (!res.success) {
    return err("storage_error");
  }

  const setRes = await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, payload);
  if (setRes.isErr()) {
    return err(setRes.error);
  }

  return ok(validatedList);
}
