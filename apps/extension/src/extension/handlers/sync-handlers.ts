import type { MessageRouter } from "@/extension/message-router.ts";
import {
  deleteGistRoute,
  deleteGistUseCase,
  downloadFromGistRoute,
  downloadFromGistUseCase,
  startGithubOauthRoute,
  startGithubOauthUseCase,
  uploadToGistRoute,
  uploadToGistUseCase,
  validateTokenRoute,
  validateTokenUseCase,
} from "@gistwarden/orchestrator";

export function registerSyncRoutes(router: MessageRouter): void {
  router
    .register(uploadToGistRoute, uploadToGistUseCase)
    .register(deleteGistRoute, deleteGistUseCase)
    .register(downloadFromGistRoute, downloadFromGistUseCase)
    .register(validateTokenRoute, validateTokenUseCase)
    .register(startGithubOauthRoute, startGithubOauthUseCase);
}
