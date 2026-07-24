import { encryptData, getSessionKey } from "@/core/crypto.ts";
import { updateSettings } from "@/core/storage.ts";
import { setStore } from "@/core/store.ts";
import { ValidateTokenResponseSchema } from "@/core/types.ts";
import { MSG_VALIDATE_TOKEN } from "@/core/constants.ts";
import { sendMessageToBackground } from "@/core/messaging.ts";
import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import { safeParseUrl } from "@/core/domain-utils.ts";

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
      await updateSettings({
        cachedGithubUser: {
          login: res.username || "",
          avatar_url: res.avatarUrl || "",
        },
      });
    }

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
