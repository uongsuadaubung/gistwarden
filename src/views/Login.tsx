import { type Component, createEffect, createSignal, Show } from "solid-js";
import { store } from "@/shared/store.ts";
import { logout, setupGithub, unlock } from "@/shared/auth-service.ts";
import { confirm, updateLanguage } from "@/shared/ui-service.ts";
import Button from "@/components/Button.tsx";
import Input from "@/components/Input.tsx";
import PinUnlockForm from "@/components/PinUnlockForm.tsx";
import { AppIcon, GithubIcon } from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";
import {
  base64ToArrayBuffer,
  decryptData,
  deriveKey,
} from "@/shared/crypto.ts";
import {
  APP_NAME,
  MSG_START_GITHUB_OAUTH,
  OAUTH_CLIENT_ID,
  OAUTH_WORKER_URL,
} from "@/shared/constants.ts";
import { type LoginMethod, type LoginViewMode } from "@/shared/types.ts";

export const Login: Component = () => {
  const [token, setToken] = createSignal("");
  const [masterPassword, setMasterPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [viewMode, setViewMode] = createSignal<LoginViewMode>("masterPassword");

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
      if (!store.pinUnlockValue || !store.pinUnlockIv || !store.pinUnlockSalt) {
        throw new Error(t("login_error_unlock_fail"));
      }

      const saltBuffer = base64ToArrayBuffer(store.pinUnlockSalt);
      const pinKey = await deriveKey(pin, new Uint8Array(saltBuffer));
      const decryptedMp = await decryptData(
        store.pinUnlockValue,
        store.pinUnlockIv,
        pinKey,
      );

      const res = await unlock(decryptedMp);
      if (res.success) {
        setMasterPassword("");
      } else {
        setError(res.error || t("login_error_wrong_pin"));
      }
    } catch (err) {
      console.error("[Login] PIN unlock failed:", err);
      setError(t("login_error_wrong_pin"));
    } finally {
      setLoading(false);
    }
  };

  // OAuth states
  const [loginMethod, setLoginMethod] = createSignal<LoginMethod>("oauth");

  const handleSaveToken = async (e: Event) => {
    e.preventDefault();
    if (!token().trim()) {
      setError(t("login_error_empty_pat"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await setupGithub(token().trim());
      if (!res.success) {
        setError(res.error || t("login_error_invalid_token"));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || t("login_error_any"));
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
        setError(res.error || t("login_error_invalid_token"));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || t("login_error_oauth_fail"));
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e: Event) => {
    e.preventDefault();
    if (!masterPassword()) {
      setError(t("login_error_empty_mp"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await unlock(masterPassword());
      if (res.success) {
        setMasterPassword("");
        // If from FIDO2 Prompt, we will stay in FIDO2 Prompt View, otherwise auth service automatically navigates to Vault
      } else {
        setError(res.error || t("login_error_wrong_mp"));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || t("login_error_unlock_fail"));
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
            when={store.githubToken}
            fallback={t("login_title_setup")}
          >
            {t("login_title_locked")}
          </Show>
        </p>
      </div>

      <Show when={error()}>
        <div class="alert alert-danger mb-16">{error()}</div>
      </Show>

      <Show
        when={store.githubToken}
        fallback={
          <div class="card mb-0 p-16">
            {/* Method Tabs */}
            <div class="tabs-container login-tabs mb-16">
              <div
                onClick={() => setLoginMethod("oauth")}
                class={`login-tab-btn ${
                  loginMethod() === "oauth" ? "active" : ""
                }`}
              >
                {t("login_method_oauth")}
              </div>
              <div
                onClick={() => setLoginMethod("pat")}
                class={`login-tab-btn ${
                  loginMethod() === "pat" ? "active" : ""
                }`}
              >
                {t("login_method_pat")}
              </div>
            </div>

            <Show
              when={loginMethod() === "oauth"}
              fallback={
                <form onSubmit={handleSaveToken} class="mb-0">
                  <div class="form-group">
                    <label for="github-token">
                      GitHub Personal Access Token (PAT)
                    </label>
                    <Input
                      id="github-token"
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={token()}
                      onInput={(e) => setToken(e.currentTarget.value)}
                      disabled={loading()}
                    />
                    <span
                      class="login-pat-help"
                      innerHTML={t("login_pat_help")}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    block
                    loading={loading()}
                    loadingText={t("login_loading_auth")}
                  >
                    {t("login_btn_save_token")}
                  </Button>
                </form>
              }
            >
              <div>
                <div class="text-center mb-16">
                  <p class="login-oauth-help">
                    {t("login_oauth_help")}
                  </p>

                  <Button
                    variant="primary"
                    block
                    onClick={handleGithubOauth}
                    loading={loading()}
                    loadingText={t("login_loading_connect")}
                  >
                    <GithubIcon class="github-btn-icon" />
                    {t("login_btn_oauth")}
                  </Button>
                </div>
              </div>
            </Show>
          </div>
        }
      >
        <Show
          when={viewMode() === "pin"}
          fallback={
            <form onSubmit={handleUnlock} class="card mb-0">
              <div class="form-group">
                <label for="master-password">
                  {t("login_master_password")}
                </label>
                <Input
                  id="master-password"
                  type="password"
                  placeholder={t("login_placeholder_mp")}
                  value={masterPassword()}
                  onInput={(e) => setMasterPassword(e.currentTarget.value)}
                  disabled={loading()}
                  autofocus
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                block
                loading={loading()}
                loadingText={t("login_loading_unlock")}
                class="mb-12"
              >
                {t("login_btn_unlock")}
              </Button>

              <Show
                when={store.pinUnlockEnabled &&
                  !(store.requireMasterPasswordOnRestart &&
                    !store.sessionUnlocked)}
              >
                <Button
                  type="button"
                  variant="secondary"
                  block
                  onClick={() => setViewMode("pin")}
                  disabled={loading()}
                  class="mb-12"
                >
                  {t("login_unlock_with_pin")}
                </Button>
              </Show>

              <Button
                type="button"
                variant="secondary"
                block
                onClick={handleResetToken}
                disabled={loading()}
              >
                {t("login_reset_token")}
              </Button>

              <div class="mt-16 text-center">
                <a
                  href="#"
                  class="forgot-pass-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleForgotPassword();
                  }}
                >
                  {t("login_forgot_password")}
                </a>
              </div>
            </form>
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
