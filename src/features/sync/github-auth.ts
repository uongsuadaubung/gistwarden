import { encryptData, getSessionKey } from "@/core/crypto.ts";
import { updateAccountSettings } from "@/core/storage.ts";
import { setAccountStore } from "@/core/store.ts";
import { validateTokenRoute } from "@/features/sync/sync-schemas.ts";
import { sendBackgroundMessage } from "@/core/messaging.ts";
import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import { safeParseUrl } from "@/core/domain-utils.ts";

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
  } else {
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

/**
 * Launch WebAuthFlow for GitHub OAuth and extract the access token from the redirect URL.
 */
export function launchGithubOauthFlow(
  clientId: string,
): Promise<Result<string, TranslationKey>> {
  return new Promise((resolve) => {
    if (
      typeof chrome === "undefined" ||
      !chrome.identity ||
      !chrome.identity.launchWebAuthFlow
    ) {
      resolve(err("login_error_oauth_fail"));
      return;
    }

    const redirectUri = chrome.identity.getRedirectURL();
    const authUrl =
      `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=gist,read:user&state=${
        encodeURIComponent(redirectUri)
      }`;

    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true,
      },
      (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          resolve(err("login_error_oauth_fail"));
          return;
        }

        const urlRes = safeParseUrl(redirectUrl);
        if (urlRes.isErr()) {
          resolve(err("login_error_oauth_fail"));
          return;
        }

        const token = urlRes.value.searchParams.get("token");
        if (!token) {
          resolve(err("login_error_oauth_no_token"));
          return;
        }

        resolve(ok(token));
      },
    );
  });
}
