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
import { store } from "@/core/store.ts";
import { setupGithub } from "@/features/sync/github-auth.ts";
import { logout, unlock } from "@/features/auth/auth-service.ts";
import { unlockWithPin } from "@/features/auth/pin-service.ts";
import {
  confirm,
  setGlobalLoading,
  updateLanguage,
} from "@/core/ui-service.ts";
import PinUnlockForm from "@/features/auth/PinUnlockForm.tsx";
import { GithubSetupForm } from "@/features/auth/components/GithubSetupForm.tsx";
import { MasterPasswordForm } from "@/features/auth/components/MasterPasswordForm.tsx";
import { MasterPasswordCreate } from "@/features/auth/components/MasterPasswordCreate.tsx";
import { AppIcon, SyncIcon } from "@/icons/svg/index.ts";
import { t, type TranslationKey } from "@/core/i18n.ts";
import { getSessionItem, removeSessionItem } from "@/core/storage.ts";
import { z } from "zod";
import {
  APP_NAME,
  MSG_DOWNLOAD_FROM_GIST,
  MSG_START_GITHUB_OAUTH,
  OAUTH_CLIENT_ID,
  OAUTH_WORKER_URL,
  SESSION_KEY_PENDING_GITHUB_TOKEN,
} from "@/core/constants.ts";
import {
  DownloadFromGistResponseSchema,
  type LoginViewMode,
} from "@/core/types.ts";
import { sendMessageToBackground } from "@/core/messaging.ts";

const OauthResponseSchema = z.object({
  success: z.boolean().catch(false),
  token: z.string().optional(),
  error: z.custom<TranslationKey>().optional(),
});

export const Login: Component = () => {
  const [error, setError] = createSignal("");
  const [viewMode, setViewMode] = createSignal<LoginViewMode>("masterPassword");
  const [failedUnlockAttempts, setFailedUnlockAttempts] = createSignal(0);
  const [gistStatus, setGistStatus] = createSignal<
    "checking" | "new" | "exists"
  >("exists");

  createEffect(() => {
    const isConfigured = store.githubConfigured;
    const hasSalt = store.salt;
    const mode = viewMode();

    if (isConfigured && !hasSalt && mode === "masterPassword") {
      setGistStatus("checking");
      (async () => {
        const sendResult = await sendMessageToBackground({
          type: MSG_DOWNLOAD_FROM_GIST,
        });
        if (sendResult.isErr()) {
          setGistStatus("exists");
          return;
        }
        const res = DownloadFromGistResponseSchema.safeParse(
          sendResult.value,
        );
        if (res.success && res.data.success) {
          if (res.data.content) {
            setGistStatus("exists");
          } else {
            setGistStatus("new");
          }
        } else {
          setGistStatus("exists");
        }
      })();
    } else {
      if (!untrack(() => store.globalLoading)) {
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

    const sendResult = await sendMessageToBackground({
      type: MSG_START_GITHUB_OAUTH,
      content: OAUTH_CLIENT_ID,
      token: OAUTH_WORKER_URL,
    });
    if (sendResult.isErr()) {
      handleOauthError(sendResult.error);
      return;
    }
    const parsed = OauthResponseSchema.safeParse(sendResult.value);

    if (!parsed.success || !parsed.data.success || !parsed.data.token) {
      const errorMsg = (parsed.success && parsed.data.error)
        ? parsed.data.error
        : "login_error_oauth_no_token";
      handleOauthError(errorMsg);
      return;
    }

    // Setup GitHub with the obtained token
    const setupRes = await setupGithub(parsed.data.token);
    if (setupRes.isErr()) {
      handleOauthError(setupRes.error);
      return;
    }

    // Remove the pending token so it doesn't trigger onMount again
    const removeRes = await removeSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN);
    if (removeRes.isErr()) {
      handleOauthError(removeRes.error);
      return;
    }

    setGlobalLoading(false);
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
                  onUnlock={handleUnlock}
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
