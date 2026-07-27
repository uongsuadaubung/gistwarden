import type { MessageRouter } from "@/extension/message-router.ts";
import {
  type DeleteGistMsg,
  deleteGistRoute,
  downloadFromGistRoute,
  type DownloadGistResponse,
  type StartGithubOauthMsg,
  type StartGithubOauthResponse,
  startGithubOauthRoute,
  type SyncActionResponse,
  type UploadToGistMsg,
  uploadToGistRoute,
  type ValidateTokenMsg,
  type ValidateTokenResponse,
  validateTokenRoute,
} from "@/features/sync/sync-schemas.ts";
import { SESSION_KEY_PENDING_GITHUB_TOKEN } from "@/core/constants.ts";
import { getSyncProvider } from "@/providers/sync-provider-registry.ts";
import { validateToken } from "@/features/sync/github-api.ts";
import { launchGithubOauthFlow } from "@/features/sync/github-auth.ts";
import { setAccountStore } from "@/core/store.ts";
import { setSessionItem } from "@/core/storage.ts";

export async function handleUploadToGist(
  payload: UploadToGistMsg,
): Promise<SyncActionResponse> {
  const res = await getSyncProvider().upload(payload.content || "");
  if (res.isOk()) {
    return { success: true };
  }
  return { success: false, error: res.error };
}

export async function handleDeleteGist(
  payload: DeleteGistMsg,
): Promise<SyncActionResponse> {
  const res = await getSyncProvider().delete(payload.content || "");
  if (res.isOk()) {
    return { success: true };
  }
  return { success: false, error: res.error };
}

export async function handleDownloadFromGist(): Promise<DownloadGistResponse> {
  const res = await getSyncProvider().download();
  if (res.isOk()) {
    return { success: true, content: res.value };
  }
  return { success: false, error: res.error };
}

export async function handleValidateToken(
  payload: ValidateTokenMsg,
): Promise<ValidateTokenResponse> {
  const token = payload.token || "";
  const res = await validateToken(token);
  if (res.isOk()) {
    setAccountStore({ githubToken: token, githubConfigured: true });
    return {
      success: true,
      username: res.value.username,
      avatarUrl: res.value.avatarUrl,
    };
  }
  return { success: false, error: res.error };
}

export async function handleStartGithubOauth(
  payload: StartGithubOauthMsg,
): Promise<StartGithubOauthResponse> {
  const clientId = payload.content || "";
  const oauthRes = await launchGithubOauthFlow(clientId);
  if (oauthRes.isOk()) {
    setAccountStore({
      githubToken: oauthRes.value,
      githubConfigured: true,
    });
    await setSessionItem(
      SESSION_KEY_PENDING_GITHUB_TOKEN,
      oauthRes.value,
    );
    return { success: true, token: oauthRes.value };
  }
  return { success: false, error: oauthRes.error };
}

export function registerSyncRoutes(router: MessageRouter): void {
  router
    .register(uploadToGistRoute, handleUploadToGist)
    .register(deleteGistRoute, handleDeleteGist)
    .register(downloadFromGistRoute, handleDownloadFromGist)
    .register(validateTokenRoute, handleValidateToken)
    .register(startGithubOauthRoute, handleStartGithubOauth);
}
