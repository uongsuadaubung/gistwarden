import { type Component, createSignal, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import Button from "@/components/ui/Button.tsx";
import Input from "@/components/ui/Input.tsx";
import { GithubIcon } from "@/icons/svg/index.ts";
import { type LoginMethod } from "@/core/types.ts";

interface GithubSetupFormProps {
  loading: boolean;
  onSaveToken: (token: string) => void;
  onGithubOauth: () => void;
}

export const GithubSetupForm: Component<GithubSetupFormProps> = (props) => {
  const [loginMethod, setLoginMethod] = createSignal<LoginMethod>("oauth");
  const [token, setToken] = createSignal("");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    props.onSaveToken(token());
  };

  return (
    <div class="card mb-0 p-16">
      {/* Method Tabs */}
      <div class="tabs-container login-tabs mb-16">
        <div
          onClick={() => setLoginMethod("oauth")}
          class={`login-tab-btn ${loginMethod() === "oauth" ? "active" : ""}`}
        >
          {t("login_method_oauth")}
        </div>
        <div
          onClick={() => setLoginMethod("pat")}
          class={`login-tab-btn ${loginMethod() === "pat" ? "active" : ""}`}
        >
          {t("login_method_pat")}
        </div>
      </div>

      <Show
        when={loginMethod() === "oauth"}
        fallback={
          <form onSubmit={handleSubmit} class="mb-0">
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
                disabled={props.loading}
              />
              <span class="login-pat-help" innerHTML={t("login_pat_help")} />
            </div>

            <Button
              type="submit"
              variant="primary"
              block
              loading={props.loading}
              loadingText={t("login_loading_auth")}
            >
              {t("login_btn_save_token")}
            </Button>
          </form>
        }
      >
        <div>
          <div class="text-center mb-16">
            <p class="login-oauth-help">{t("login_oauth_help")}</p>

            <Button
              variant="primary"
              block
              onClick={() => props.onGithubOauth()}
              loading={props.loading}
              loadingText={t("login_loading_connect")}
            >
              <GithubIcon class="github-btn-icon" />
              {t("login_btn_oauth")}
            </Button>
          </div>
        </div>
      </Show>
    </div>
  );
};
