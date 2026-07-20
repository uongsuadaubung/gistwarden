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

export async function syncVaultToGist(
  items: VaultItem[],
  key: CryptoKey,
  salt: string,
): Promise<{ success: boolean; error?: string; validatedList?: VaultItem[] }> {
  try {
    const validatedList = VaultListSchema.parse(items);
    const encrypted = await encryptData(JSON.stringify(validatedList), key);
    const payload = JSON.stringify({
      salt,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
    });

    const rawRes = await sendMessageToBackground({
      type: MSG_UPLOAD_TO_GIST,
      content: payload,
    }).catch(() => null);

    const res = SyncResponseSchema.parse(rawRes);

    if (!res.success) {
      return {
        success: false,
        error: res.error || "Lỗi đồng bộ lên GitHub Gist",
      };
    }

    await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, payload);

    return { success: true, validatedList };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg };
  }
}
