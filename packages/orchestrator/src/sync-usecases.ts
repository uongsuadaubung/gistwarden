import {
  getSyncProvider,
  launchGithubOauthFlow,
  validateToken,
} from "@gistwarden/network";
import {
  type DeleteGistMsg,
  type DownloadGistResponse,
  getAccountSettings,
  getGithubToken,
  setSessionItem,
  type StartGithubOauthMsg,
  type StartGithubOauthResponse,
  type SyncActionResponse,
  updateAccountSettings,
  type UploadToGistMsg,
  type ValidateTokenMsg,
  type ValidateTokenResponse,
} from "@gistwarden/repository";
import { SESSION_KEY_PENDING_GITHUB_TOKEN } from "@gistwarden/domain";

export async function uploadToGistUseCase(
  payload: UploadToGistMsg,
): Promise<SyncActionResponse> {
  const token = await getGithubToken();
  if (!token) {
    return { success: false, error: "github_error_missing_token" };
  }
  const settingsRes = await getAccountSettings();
  if (settingsRes.isErr()) {
    return { success: false, error: settingsRes.error };
  }

  const githubConfig = settingsRes.value.githubConfig;
  const res = await getSyncProvider().upload(payload.content || "", {
    token,
    gistId: githubConfig.gistId,
    username: githubConfig.username,
  });

  if (res.isOk()) {
    const gistId = res.value.gistId;
    if (gistId && gistId !== githubConfig.gistId) {
      await updateAccountSettings({
        githubConfig: { ...githubConfig, gistId },
        lastSync: Date.now(),
      });
    } else {
      await updateAccountSettings({ lastSync: Date.now() });
    }
    return { success: true };
  }
  return { success: false, error: res.error };
}

export async function deleteGistUseCase(
  payload: DeleteGistMsg,
): Promise<SyncActionResponse> {
  const token = await getGithubToken();
  const gistId = payload.content || "";
  const res = await getSyncProvider().delete(gistId, {
    token: token || undefined,
  });
  if (res.isOk()) {
    return { success: true };
  }
  return { success: false, error: res.error };
}

export async function downloadFromGistUseCase(): Promise<DownloadGistResponse> {
  const token = await getGithubToken();
  const settingsRes = await getAccountSettings();
  const settings = settingsRes.isOk() ? settingsRes.value : null;
  const githubConfig = settings?.githubConfig;

  const res = await getSyncProvider().download({
    token: token || undefined,
    gistId: githubConfig?.gistId,
    username: githubConfig?.username,
  });

  if (res.isOk()) {
    const gistId = res.value.gistId;
    if (gistId && githubConfig && gistId !== githubConfig.gistId) {
      await updateAccountSettings({
        githubConfig: { ...githubConfig, gistId },
        lastSync: Date.now(),
      });
    } else if (settings) {
      await updateAccountSettings({ lastSync: Date.now() });
    }
    return { success: true, content: res.value.content || "" };
  }
  return { success: false, error: res.error };
}

export async function validateTokenUseCase(
  payload: ValidateTokenMsg,
): Promise<ValidateTokenResponse> {
  const token = payload.token || "";
  const res = await validateToken(token);
  if (res.isOk()) {
    return {
      success: true,
      username: res.value.username,
      avatarUrl: res.value.avatarUrl,
    };
  }
  return { success: false, error: res.error };
}

export async function startGithubOauthUseCase(
  payload: StartGithubOauthMsg,
): Promise<StartGithubOauthResponse> {
  const clientId = payload.content || "";
  const oauthRes = await launchGithubOauthFlow(clientId);
  if (oauthRes.isOk()) {
    await setSessionItem(
      SESSION_KEY_PENDING_GITHUB_TOKEN,
      oauthRes.value,
    );
    return { success: true, token: oauthRes.value };
  }
  return { success: false, error: oauthRes.error };
}
