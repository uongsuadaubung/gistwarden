import { encryptData, getSessionKey } from "@/core/crypto.ts";
import { updateSettings } from "@/core/storage.ts";
import { setSessionItem } from "@/core/storage.ts";
import { SESSION_KEY_GITHUB_TOKEN } from "@/core/constants.ts";
import { setStore } from "@/core/store.ts";
import { ValidateTokenResponseSchema } from "@/core/types.ts";
import { MSG_VALIDATE_TOKEN } from "@/core/constants.ts";

import { sendMessageToBackground } from "@/core/messaging.ts";

export async function setupGithub(
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const rawRes = await sendMessageToBackground({
    type: MSG_VALIDATE_TOKEN,
    token,
  }).catch(() => null);
  const res = ValidateTokenResponseSchema.parse(rawRes);

  if (res.success) {
    const key = await getSessionKey();
    if (key) {
      const { iv, ciphertext } = await encryptData(token, key);
      await updateSettings({
        githubTokenEncrypted: ciphertext,
        githubTokenIv: iv,
        cachedGithubUser: {
          login: res.username || "",
          avatar_url: res.avatarUrl || "",
        },
      });
    } else {
      // Onboarding: save in session storage only
      await updateSettings({
        cachedGithubUser: {
          login: res.username || "",
          avatar_url: res.avatarUrl || "",
        },
      });
    }

    await setSessionItem(SESSION_KEY_GITHUB_TOKEN, token);
    setStore({
      githubToken: token,
      githubConfigured: true,
      cachedGithubUser: {
        login: res.username || "",
        avatar_url: res.avatarUrl || "",
      },
    });
    return { success: true };
  } else {
    return { success: false, error: res.error || "Token không hợp lệ" };
  }
}
