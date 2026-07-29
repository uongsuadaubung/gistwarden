import {
  type Component,
  createEffect,
  createSignal,
  Match,
  onMount,
  Show,
  Switch,
  untrack,
} from "solid-js";
import { accountStore, settingsStore, uiStore } from "@/core/store.ts";
import { setupGithub } from "@/features/sync/github-auth.ts";
import { sendBackgroundMessage } from "@/core/messaging.ts";

import {
  createNewVault,
  logout,
  unlock,
} from "@/features/auth/auth-service.ts";

import { unlockWithPin } from "@/features/auth/pin-service.ts";
import { confirm, setGlobalLoading, updateLanguage } from "@gistwarden/ui";
import PinUnlockForm from "@/features/auth/PinUnlockForm.tsx";
import { GithubSetupForm } from "@/features/auth/components/GithubSetupForm.tsx";
import { MasterPasswordForm } from "@/features/auth/components/MasterPasswordForm.tsx";
import { MasterPasswordCreate } from "@/features/auth/components/MasterPasswordCreate.tsx";
import { AppIcon, SyncIcon } from "@/icons/svg/index.ts";
import { t, type TranslationKey } from "@/core/i18n.ts";
import { getSessionItem, removeSessionItem } from "@/core/storage.ts";
import { z } from "zod";
import {
  downloadFromGistRoute,
  startGithubOauthRoute,
} from "@gistwarden/orchestrator";
import {
  APP_NAME,
  OAUTH_CLIENT_ID,
  SESSION_KEY_PENDING_GITHUB_TOKEN,
} from "@/core/constants.ts";
import { type LoginViewMode } from "@/core/storage-schemas.ts";

export const Login: Component = () => {
  const [error, setError] = createSignal("");
  const [viewMode, setViewMode] = createSignal<LoginViewMode>("masterPassword");
  const [failedUnlockAttempts, setFailedUnlockAttempts] = createSignal(0);
  const [gistStatus, setGistStatus] = createSignal<
    "checking" | "new" | "exists"
  >("exists");

  createEffect(() => {
    const isConfigured = accountStore.githubConfigured;
    const hasSalt = accountStore.masterPasswordConfig.salt;
    const mode = viewMode();

    if (isConfigured && !hasSalt && mode === "masterPassword") {
      setGistStatus("checking");
      (async () => {
        const sendResult = await sendBackgroundMessage(
          downloadFromGistRoute,
        );
        if (
          sendResult.isOk() && sendResult.value.success &&
          sendResult.value.content
        ) {
          setGistStatus("exists");
        } else {
          setGistStatus("new");
        }
      })();
    } else {
      if (!untrack(() => uiStore.globalLoading)) {
        setGistStatus("exists");
      }
    }
  });

  onMount(async () => {
    const rawTokenRes = await getSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN);
    const rawToken = rawTokenRes.isOk() ? rawTokenRes.value : null;
    const parsed = z.string().safeParse(rawToken);

    if (parsed.success && parsed.data) {
      const token = parsed.data;
      setGlobalLoading(true);
      await removeSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN);
      const setupRes = await setupGithub(token);
      setGlobalLoading(false);
      if (setupRes.isErr()) {
        setError(t(setupRes.error));
      }
    }
  });

  createEffect(() => {
    if (accountStore.isLoaded && settingsStore.isLoaded) {
      if (accountStore.pinConfig.enabled) {
        if (settingsStore.requireMasterPasswordOnRestart) {
          setViewMode(accountStore.sessionUnlocked ? "pin" : "masterPassword");
        } else {
          setViewMode("pin");
        }
      } else {
        setViewMode("masterPassword");
      }
    }
  });

  const handlePinUnlock = async (pin: string) => {
    setGlobalLoading(true);
    setError("");
    const res = await unlockWithPin(pin);
    if (res.isErr()) {
      setError(t(res.error));
    }
    setGlobalLoading(false);
  };

  const handleSaveToken = async (token: string) => {
    if (!token.trim()) {
      setError(t("login_error_empty_pat"));
      return;
    }
    setGlobalLoading(true);
    setError("");
    const result = await setupGithub(token.trim());
    setGlobalLoading(false);
    if (result.isErr()) {
      setError(t(result.error));
    }
  };

  const handleGithubOauth = async () => {
    setGlobalLoading(true);
    setError("");

    const handleOauthError = (errVal: TranslationKey) => {
      setError(t(errVal));
      setGlobalLoading(false);
    };

    const sendResult = await sendBackgroundMessage(
      startGithubOauthRoute,
      { content: OAUTH_CLIENT_ID },
    );
    if (sendResult.isErr()) {
      handleOauthError(sendResult.error);
      return;
    }
    if (!sendResult.value.success) {
      handleOauthError(sendResult.value.error || "messaging_error_send_failed");
      return;
    }

    // Setup GitHub with the obtained token
    const setupRes = await setupGithub(sendResult.value.token);
    if (setupRes.isErr()) {
      handleOauthError(setupRes.error);
      return;
    }

    setGlobalLoading(false);
  };

  const handleCreateMasterPassword = async (password: string) => {
    if (!password) {
      setError(t("login_error_empty_mp"));
      return;
    }
    setGlobalLoading(true);
    setError("");
    const result = await createNewVault(password);
    setGlobalLoading(false);
    if (result.isErr()) {
      setError(t(result.error));
    }
  };

  const handleUnlock = async (password: string) => {
    if (!password) {
      setError(t("login_error_empty_mp"));
      return;
    }
    setGlobalLoading(true);
    setError("");
    const result = await unlock(password);
    setGlobalLoading(false);
    if (result.isErr()) {
      setFailedUnlockAttempts((prev) => prev + 1);
      setError(t(result.error));
    }
  };

  const handleResetToken = async () => {
    setError("");
    await logout();
  };

  const handleForgotPassword = async () => {
    const gistId = accountStore.gistId;
    if (
      await confirm(
        t("login_forgot_password_title"),
        t("login_forgot_password_msg"),
        "danger",
      )
    ) {
      if (gistId) {
        window.open(`https://gist.github.com/${gistId}`, "_blank");
      }
      logout();
    }
  };

  return (
    <div class="app-body justify-center h-full">
      {/* Floating Language Switcher */}
      <div class="login-lang-selector">
        <button
          type="button"
          class={`lang-toggle-btn ${
            settingsStore.language === "en" ? "active" : ""
          }`}
          onClick={() => updateLanguage("en")}
        >
          EN
        </button>
        <span class="lang-divider">|</span>
        <button
          type="button"
          class={`lang-toggle-btn ${
            settingsStore.language === "vi" ? "active" : ""
          }`}
          onClick={() => updateLanguage("vi")}
        >
          VI
        </button>
      </div>

      <div class="text-center mb-24">
        <AppIcon class="login-header-logo" />
        <h2 class="login-brand-title">{APP_NAME}</h2>
        <p class="login-subtitle">
          <Show
            when={accountStore.githubConfigured}
            fallback={t("login_title_setup")}
          >
            {t("login_title_locked")}
          </Show>
        </p>
      </div>

      <Show when={error()}>
        <div class="alert alert-danger mb-16">{error()}</div>
      </Show>

      <Show when={failedUnlockAttempts() >= 3}>
        <div class="text-center text-sm text-muted mb-16">
          {t("login_error_changed_mp_hint")}
        </div>
      </Show>

      <Show
        when={accountStore.githubConfigured}
        fallback={
          <GithubSetupForm
            onSaveToken={handleSaveToken}
            onGithubOauth={handleGithubOauth}
          />
        }
      >
        <Show
          when={viewMode() === "pin"}
          fallback={
            <Switch>
              <Match when={gistStatus() === "checking"}>
                <div class="text-center p-24 card">
                  <SyncIcon class="spinning loading-icon mb-12" />
                  <div class="font-sz-13 text-muted">
                    {t("login_checking_gist")}
                  </div>
                </div>
              </Match>
              <Match when={gistStatus() === "new"}>
                <MasterPasswordCreate
                  onCreate={handleCreateMasterPassword}
                />
              </Match>
              <Match when={gistStatus() === "exists"}>
                <MasterPasswordForm
                  onUnlock={handleUnlock}
                  onSwitchToPin={() => setViewMode("pin")}
                  onLogout={handleResetToken}
                  onForgotPassword={handleForgotPassword}
                />
              </Match>
            </Switch>
          }
        >
          <PinUnlockForm
            error={error()}
            onUnlock={handlePinUnlock}
            onSwitchToMasterPassword={() => setViewMode("masterPassword")}
          />
        </Show>
      </Show>
    </div>
  );
};
export default Login;
