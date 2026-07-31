import { encryptData } from "@gistwarden/domain";
import { getSessionKey } from "@gistwarden/orchestrator";
import {
  removeSessionItem,
  setSessionItem,
  updateAccountSettings,
} from "@/core/storage.ts";
import { accountStore, setAccountStore } from "@/core/store.ts";
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

  const username = res.username || "";
  const avatarUrl = res.avatarUrl || "";

  const key = await getSessionKey();
  if (key) {
    const encryptRes = await encryptData(token, key);
    if (encryptRes.isErr()) {
      return err(encryptRes.error);
    }
    const { iv, ciphertext } = encryptRes.value;
    const updatedGithubConfig = {
      ...accountStore.githubConfig,
      githubTokenEncrypted: ciphertext,
      githubTokenIv: iv,
      username,
      avatarUrl,
    };
    await updateAccountSettings({
      githubConfig: updatedGithubConfig,
    });
    setAccountStore("githubConfig", updatedGithubConfig);
    await removeSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN);
  } else {
    const updatedGithubConfig = {
      ...accountStore.githubConfig,
      username,
      avatarUrl,
    };
    await setSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN, token);
    await updateAccountSettings({
      githubConfig: updatedGithubConfig,
    });
    setAccountStore("githubConfig", updatedGithubConfig);
  }

  setAccountStore({
    githubToken: token,
    githubConfigured: true,
  });
  return ok();
}
