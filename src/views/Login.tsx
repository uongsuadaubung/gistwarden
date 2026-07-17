import { type Component, createEffect, createSignal, Show } from "solid-js";
import { store, storeActions } from "@/shared/store.ts";
import Button from "@/components/Button.tsx";
import Input from "@/components/Input.tsx";
import { AppIcon, ChevronDownIcon, GithubIcon } from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";
import { APP_NAME } from "@/shared/constants.ts";

export const Login: Component = () => {
  const [token, setToken] = createSignal("");
  const [masterPassword, setMasterPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  // OAuth states
  const [loginMethod, setLoginMethod] = createSignal<"oauth" | "pat">("oauth");
  const [clientId, setClientId] = createSignal(store.oauthClientId || "");
  const [workerUrl, setWorkerUrl] = createSignal(store.oauthWorkerUrl || "");
  const [showConfig, setShowConfig] = createSignal(false);

  createEffect(() => {
    if (store.oauthClientId) setClientId(store.oauthClientId);
    if (store.oauthWorkerUrl) setWorkerUrl(store.oauthWorkerUrl);
  });

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
    const cId = clientId().trim();
    const wUrl = workerUrl().trim();

    if (!cId || !wUrl) {
      setError(t("login_error_oauth_missing_config"));
      setShowConfig(true);
      return;
    }

    setLoading(true);
    setError("");
    try {
      // 1. Save OAuth config locally
      await storeActions.saveOauthConfig(cId, wUrl);

      // 2. Call background script to launch web auth flow
      const oauthRes = await new Promise<
        { success: boolean; token?: string; error?: string }
      >((resolve) => {
        chrome.runtime.sendMessage({
          type: "START_GITHUB_OAUTH",
          content: cId,
          token: wUrl,
        }, resolve);
      });

      if (!oauthRes.success || !oauthRes.token) {
        throw new Error(oauthRes.error || t("login_error_oauth_no_token"));
      }

      // 3. Setup GitHub with the obtained token
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

                <div class="login-oauth-config-footer">
                  <div
                    onClick={() => setShowConfig(!showConfig())}
                    class="oauth-config-toggle"
                  >
                    <span>
                      {showConfig()
                        ? t("login_oauth_hide")
                        : t("login_oauth_show")}
                    </span>
                    <ChevronDownIcon
                      class={`oauth-config-chevron ${
                        showConfig() ? "open" : ""
                      }`}
                    />
                  </div>

                  <Show when={showConfig()}>
                    <div class="oauth-config-box">
                      <div class="form-group mb-8 text-left">
                        <label for="oauth-client-id" class="login-config-label">
                          {t("login_oauth_client_id")}
                        </label>
                        <Input
                          id="oauth-client-id"
                          type="text"
                          class="login-config-input"
                          placeholder="Client ID..."
                          value={clientId()}
                          onInput={(e) => setClientId(e.currentTarget.value)}
                          disabled={loading()}
                        />
                      </div>
                      <div class="form-group mb-12 text-left">
                        <label
                          for="oauth-worker-url"
                          class="login-config-label"
                        >
                          {t("login_oauth_worker_url")}
                        </label>
                        <Input
                          id="oauth-worker-url"
                          type="text"
                          class="login-config-input"
                          placeholder="https://xxx.workers.dev"
                          value={workerUrl()}
                          onInput={(e) => setWorkerUrl(e.currentTarget.value)}
                          disabled={loading()}
                        />
                      </div>
                      <Button
                        variant="secondary"
                        block
                        class="login-config-save-btn"
                        onClick={() => {
                          storeActions.saveOauthConfig(
                            clientId().trim(),
                            workerUrl().trim(),
                          );
                          alert(t("login_oauth_alert_save"));
                        }}
                        disabled={loading()}
                      >
                        {t("login_btn_save_config")}
                      </Button>
                    </div>
                  </Show>
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

          <div style="margin-top: 16px; text-align: center;">
            <a
              href="#"
              style="color: var(--text-muted); font-size: 11.5px; text-decoration: underline;"
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
