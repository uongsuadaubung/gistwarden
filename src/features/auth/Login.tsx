import { type Component, createEffect, createSignal, Show } from "solid-js";
import {
  store,
} from "@/core/store.ts";
import { setupGithub } from "@/features/sync/github-auth.ts";
import {
  logout,
  unlock,
} from "@/features/auth/auth-service.ts";
import { unlockWithPin } from "@/features/auth/pin-service.ts";
import { confirm, updateLanguage } from "@/core/ui-service.ts";
import PinUnlockForm from "@/features/auth/PinUnlockForm.tsx";
import { GithubSetupForm } from "@/features/auth/components/GithubSetupForm.tsx";
import { MasterPasswordForm } from "@/features/auth/components/MasterPasswordForm.tsx";
import { AppIcon } from "@/icons/svg/index.ts";
import { isTranslationKey, t } from "@/core/i18n.ts";
import {
  APP_NAME,
  MSG_START_GITHUB_OAUTH,
  OAUTH_CLIENT_ID,
  OAUTH_WORKER_URL,
} from "@/core/constants.ts";
import { type LoginViewMode } from "@/core/types.ts";

export const Login: Component = () => {
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [viewMode, setViewMode] = createSignal<LoginViewMode>("masterPassword");
  const [failedUnlockAttempts, setFailedUnlockAttempts] = createSignal(0);

  createEffect(() => {
    if (store.isLoaded) {
      if (store.pinUnlockEnabled) {
        if (store.requireMasterPasswordOnRestart) {
          setViewMode(store.sessionUnlocked ? "pin" : "masterPassword");
        } else {
          setViewMode("pin");
        }
      } else {
        setViewMode("masterPassword");
      }
    }
  });

  const handlePinUnlock = async (pin: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await unlockWithPin(pin);
      if (!res.success) {
        setError(res.error && isTranslationKey(res.error) ? t(res.error) : (res.error || t("login_error_wrong_pin")));
      }
    } catch (err) {
      console.error("[Login] PIN unlock failed:", err);
      setError(t("login_error_wrong_pin"));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToken = async (token: string) => {
    if (!token.trim()) {
      setError(t("login_error_empty_pat"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await setupGithub(token.trim());
      if (!res.success) {
        setError(res.error ? (isTranslationKey(res.error) ? t(res.error) : res.error) : t("login_error_invalid_token"));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg ? (isTranslationKey(errMsg) ? t(errMsg) : errMsg) : t("login_error_any"));
    } finally {
      setLoading(false);
    }
  };

  const handleGithubOauth = async () => {
    setLoading(true);
    setError("");
    try {
      // Call background script to launch web auth flow
      const oauthRes = await new Promise<
        { success: boolean; token?: string; error?: string }
      >((resolve) => {
        chrome.runtime.sendMessage({
          type: MSG_START_GITHUB_OAUTH,
          content: OAUTH_CLIENT_ID,
          token: OAUTH_WORKER_URL,
        }, resolve);
      });

      if (!oauthRes.success || !oauthRes.token) {
        throw new Error(oauthRes.error || t("login_error_oauth_no_token"));
      }

      // Setup GitHub with the obtained token
      const res = await setupGithub(oauthRes.token);
      if (!res.success) {
        setError(res.error ? (isTranslationKey(res.error) ? t(res.error) : res.error) : t("login_error_invalid_token"));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg ? (isTranslationKey(errMsg) ? t(errMsg) : errMsg) : t("login_error_oauth_fail"));
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (password: string) => {
    if (!password) {
      setError(t("login_error_empty_mp"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await unlock(password);
      if (!res.success) {
        setFailedUnlockAttempts((prev) => prev + 1);
        setError(res.error ? (isTranslationKey(res.error) ? t(res.error) : res.error) : t("login_error_wrong_mp"));
      }
    } catch (err) {
      setFailedUnlockAttempts((prev) => prev + 1);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg ? (isTranslationKey(errMsg) ? t(errMsg) : errMsg) : t("login_error_unlock_fail"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetToken = () => {
    setError("");
    logout();
  };

  const handleForgotPassword = async () => {
    const gistId = store.gistId;
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
          class={`lang-toggle-btn ${store.language === "en" ? "active" : ""}`}
          onClick={() => updateLanguage("en")}
        >
          EN
        </button>
        <span class="lang-divider">|</span>
        <button
          type="button"
          class={`lang-toggle-btn ${store.language === "vi" ? "active" : ""}`}
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
            when={store.githubConfigured}
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
        when={store.githubConfigured}
        fallback={
          <GithubSetupForm
            loading={loading()}
            onSaveToken={handleSaveToken}
            onGithubOauth={handleGithubOauth}
          />
        }
      >
        <Show
          when={viewMode() === "pin"}
          fallback={
            <MasterPasswordForm
              loading={loading()}
              onUnlock={handleUnlock}
              onSwitchToPin={() => setViewMode("pin")}
              onLogout={handleResetToken}
              onForgotPassword={handleForgotPassword}
            />
          }
        >
          <PinUnlockForm
            loading={loading()}
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
