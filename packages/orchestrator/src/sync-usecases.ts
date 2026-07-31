import {
  getSyncProvider,
  launchGithubOauthFlow,
  validateToken,
} from "@gistwarden/network";
import {
  type DeleteGistMsg,
  type DownloadGistResponse,
  setSessionItem,
  type StartGithubOauthMsg,
  type StartGithubOauthResponse,
  type SyncActionResponse,
  type UploadToGistMsg,
  type ValidateTokenMsg,
  type ValidateTokenResponse,
} from "@gistwarden/repository";
import { SESSION_KEY_PENDING_GITHUB_TOKEN } from "@gistwarden/domain";

export async function uploadToGistUseCase(
  payload: UploadToGistMsg,
): Promise<SyncActionResponse> {
  const res = await getSyncProvider().upload(payload.content || "");
  if (res.isOk()) {
    return { success: true };
  }
  return { success: false, error: res.error };
}

export async function deleteGistUseCase(
  payload: DeleteGistMsg,
): Promise<SyncActionResponse> {
  const gistId = payload.content || "";
  const res = await getSyncProvider().delete(gistId);
  if (res.isOk()) {
    return { success: true };
  }
  return { success: false, error: res.error };
}

export async function downloadFromGistUseCase(): Promise<DownloadGistResponse> {
  const res = await getSyncProvider().download();
  if (res.isOk()) {
    return { success: true, content: res.value };
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
