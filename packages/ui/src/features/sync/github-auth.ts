import { encryptData } from "@gistwarden/domain";
import { getSessionKey } from "@gistwarden/orchestrator";
import {
  removeSessionItem,
  setSessionItem,
  updateAccountSettings,
} from "@/core/storage.ts";
import { setAccountStore } from "@/core/store.ts";
import { validateTokenRoute } from "@gistwarden/orchestrator";
import { sendBackgroundMessage } from "@/core/messaging.ts";
import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import { SESSION_KEY_PENDING_GITHUB_TOKEN } from "@/core/constants.ts";

export async function setupGithub(
  token: string,
): Promise<Result<void, TranslationKey>> {
  const sendResult = await sendBackgroundMessage(validateTokenRoute, {
    token,
  });
  if (sendResult.isErr()) {
    return err(sendResult.error);
  }
  if (!sendResult.value.success) {
    return err(sendResult.value.error || "messaging_error_send_failed");
  }
  const res = sendResult.value;

  const key = await getSessionKey();
  if (key) {
    const encryptRes = await encryptData(token, key);
    if (encryptRes.isErr()) {
      return err(encryptRes.error);
    }
    const { iv, ciphertext } = encryptRes.value;
    await updateAccountSettings({
      githubTokenEncrypted: ciphertext,
      githubTokenIv: iv,
      cachedGithubUser: {
        login: res.username || "",
        avatar_url: res.avatarUrl || "",
      },
    });
    await removeSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN);
  } else {
    await setSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN, token);
    await updateAccountSettings({
      cachedGithubUser: {
        login: res.username || "",
        avatar_url: res.avatarUrl || "",
      },
    });
  }

  setAccountStore({
    githubToken: token,
    githubConfigured: true,
    cachedGithubUser: {
      login: res.username || "",
      avatar_url: res.avatarUrl || "",
    },
  });
  return ok();
}

export { launchGithubOauthFlow } from "@gistwarden/network";
