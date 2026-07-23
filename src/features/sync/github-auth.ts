import { encryptData, getSessionKey } from "@/core/crypto.ts";
import { updateSettings } from "@/core/storage.ts";
import { setSessionItem } from "@/core/storage.ts";
import { SESSION_KEY_GITHUB_TOKEN } from "@/core/constants.ts";
import { setStore } from "@/core/store.ts";
import { ValidateTokenResponseSchema } from "@/core/types.ts";
import { MSG_VALIDATE_TOKEN } from "@/core/constants.ts";
import { sendMessageToBackground } from "@/core/messaging.ts";
import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

export async function setupGithub(
  token: string,
): Promise<Result<void, TranslationKey>> {
  const sendResult = await sendMessageToBackground({
    type: MSG_VALIDATE_TOKEN,
    token,
  });
  if (sendResult.isErr()) {
    return err(sendResult.error);
  }
  const parsed = ValidateTokenResponseSchema.safeParse(sendResult.value);
  if (!parsed.success) {
    return err("login_error_invalid_token");
  }
  const res = parsed.data;

  if (res.success) {
    const key = await getSessionKey();
    if (key) {
      const encryptRes = await encryptData(token, key);
      if (encryptRes.isErr()) {
        return err(encryptRes.error);
      }
      const { iv, ciphertext } = encryptRes.value;
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
    return ok();
  } else {
    return err("login_error_invalid_token");
  }
}
