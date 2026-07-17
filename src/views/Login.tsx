import { type Component, createSignal, Show } from "solid-js";
import { store, storeActions } from "@/shared/store.ts";
import Button from "@/components/Button.tsx";
import Input from "@/components/Input.tsx";
import { AppIcon, GithubIcon } from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";
import {
  APP_NAME,
  OAUTH_CLIENT_ID,
  OAUTH_WORKER_URL,
} from "@/shared/constants.ts";

export const Login: Component = () => {
  const [token, setToken] = createSignal("");
  const [masterPassword, setMasterPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  // OAuth states
  const [loginMethod, setLoginMethod] = createSignal<"oauth" | "pat">("oauth");

  const handleSaveToken = async (e: Event) => {
    e.preventDefault();
    if (!token().trim()) {
      setError(t("login_error_empty_pat"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await storeActions.setupGithub(token().trim());
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
          type: "START_GITHUB_OAUTH",
          content: OAUTH_CLIENT_ID,
          token: OAUTH_WORKER_URL,
        }, resolve);
      });

      if (!oauthRes.success || !oauthRes.token) {
        throw new Error(oauthRes.error || t("login_error_oauth_no_token"));
      }

      // Setup GitHub with the obtained token
      const res = await storeActions.setupGithub(oauthRes.token);
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
      const res = await storeActions.unlock(masterPassword());
      if (res.success) {
        setMasterPassword("");
        // If from FIDO2 Prompt, we will stay in FIDO2 Prompt View, otherwise storeActions automatically navigates to Vault
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
    storeActions.logout();
  };

  const handleForgotPassword = async () => {
    const gistId = store.gistId;
    if (
      await storeActions.confirm(
        t("login_forgot_password_title"),
        t("login_forgot_password_msg"),
        "danger",
      )
    ) {
      if (gistId) {
        window.open(`https://gist.github.com/${gistId}`, "_blank");
      }
      storeActions.logout();
    }
  };

  return (
    <div class="app-body justify-center h-full">
      {/* Floating Language Switcher */}
      <div class="login-lang-selector">
        <button
          type="button"
          class={`lang-toggle-btn ${store.language === "en" ? "active" : ""}`}
          onClick={() => storeActions.updateLanguage("en")}
        >
          EN
        </button>
        <span class="lang-divider">|</span>
        <button
          type="button"
          class={`lang-toggle-btn ${store.language === "vi" ? "active" : ""}`}
          onClick={() => storeActions.updateLanguage("vi")}
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
        <form onSubmit={handleUnlock} class="card mb-0">
          <div class="form-group">
            <label for="master-password">{t("login_master_password")}</label>
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
      </Show>
    </div>
  );
};
export default Login;
