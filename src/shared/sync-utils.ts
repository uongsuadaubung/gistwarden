import { encryptData } from "./crypto.ts";
import { type VaultItem, VaultListSchema } from "./types.ts";

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

    const res = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        chrome.runtime.sendMessage({
          type: "UPLOAD_TO_GIST",
          content: payload,
        }, resolve);
      },
    );

    if (!res.success) {
      return { success: false, error: res.error || "Lỗi đồng bộ lên GitHub Gist" };
    }

    return { success: true, validatedList };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg };
  }
}
