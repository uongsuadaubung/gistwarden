import { type Component, createEffect, createSignal, Show } from "solid-js";
import { z } from "zod";
import Button from "@/components/ui/Button.tsx";
import GuideHelpButton from "@/components/ui/GuideHelpButton.tsx";
import Input from "@/components/ui/Input.tsx";
import ServerConfigModal from "@/components/ui/ServerConfigModal.tsx";
import { t } from "@/core/i18n.ts";
import { handleForgotAccountPassword } from "@/features/auth/forgot-password-strategies.ts";
import { GlobeIcon, SettingsIcon } from "@/icons/svg/index.ts";

export interface SelfHostedSetupFormProps {
  readonly initialServerUrl?: string;
  readonly onSaveServerUrl?: (serverUrl: string) => Promise<void> | void;
  readonly onLogin: (
    serverUrl: string,
    username: string,
    password: string,
  ) => Promise<void>;
  readonly onRegister: (
    serverUrl: string,
    username: string,
    password: string,
  ) => Promise<void>;
}

const SelfHostedAuthSchema = z.object({
  username: z.string().trim().min(1, { message: "login_error_empty_username" }),
  password: z.string().trim().min(1, { message: "login_error_empty_password" }),
});

export const SelfHostedSetupForm: Component<SelfHostedSetupFormProps> = (
  props,
) => {
  const [authMode, setAuthMode] = createSignal<"login" | "register">("login");
  const [serverUrl, setServerUrl] = createSignal(props.initialServerUrl || "");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [errorMessage, setErrorMessage] = createSignal("");
  const [isModalOpen, setIsModalOpen] = createSignal(false);

  createEffect(() => {
    if (props.initialServerUrl) {
      setServerUrl(props.initialServerUrl);
    }
  });

  const handleTabSwitch = (mode: "login" | "register") => {
    setAuthMode(mode);
    setErrorMessage("");
  };

  const handleForgotPassword = async () => {
    await handleForgotAccountPassword("self_hosted_server");
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setErrorMessage("");

    // Step 1: Validate Username & Password using Zod FIRST!
    const authData = {
      username: username().trim(),
      password: password().trim(),
    };

    const parsed = SelfHostedAuthSchema.safeParse(authData);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      if (firstIssue?.path[0] === "username") {
        setErrorMessage(t("login_error_empty_username"));
      } else {
        setErrorMessage(t("login_error_empty_password"));
      }
      return;
    }

    if (authMode() === "register") {
      if (authData.username.length < 2) {
        setErrorMessage(t("self_hosted_error_username_too_short"));
        return;
      }
      if (authData.username.length > 64) {
        setErrorMessage(t("self_hosted_error_username_too_long"));
        return;
      }
      if (authData.password.length < 6) {
        setErrorMessage(t("self_hosted_error_password_too_short"));
        return;
      }
    }

    // Step 2: ONLY AFTER Username & Password pass Zod validation: Check Server URL!
    const url = serverUrl().trim();
    if (!url) {
      setIsModalOpen(true);
      return;
    }

    // Step 3: Proceed to login / register
    if (authMode() === "login") {
      await props.onLogin(url, parsed.data.username, parsed.data.password);
    } else {
      await props.onRegister(url, parsed.data.username, parsed.data.password);
    }
  };

  const handleSaveServerUrl = async (newUrl: string) => {
    setServerUrl(newUrl);
    setErrorMessage("");
    if (props.onSaveServerUrl) {
      await props.onSaveServerUrl(newUrl);
    }
  };

  const currentDisplayUrl = () => {
    return serverUrl() || t("server_config_not_set");
  };

  return (
    <div class="card mb-0 p-16">
      {/* Header Indicator with Server URL & Settings Button */}
      <div class="selfhosted-server-bar">
        <div class="server-info-badge">
          <GlobeIcon size={14} class="server-icon" />
          <span class="server-label">{t("server_config_current_server")}</span>
          <span class="server-url-val">{currentDisplayUrl()}</span>
        </div>
        <div class="server-actions-group">
          <GuideHelpButton
            route="getting-started/self-hosted-server"
            size={16}
          />
          <Button
            type="button"
            variant="secondary"
            class="server-config-btn"
            onClick={() => setIsModalOpen(true)}
            title={t("server_config_modal_title")}
          >
            <SettingsIcon size={16} />
          </Button>
        </div>
      </div>

      {/* Auth Sub-tabs */}
      <div class="tabs-container login-tabs mb-16">
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleTabSwitch("login")}
          class={`login-tab-btn ${authMode() === "login" ? "active" : ""}`}
        >
          {t("login_self_hosted_tab_login")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleTabSwitch("register")}
          class={`login-tab-btn ${authMode() === "register" ? "active" : ""}`}
        >
          {t("login_self_hosted_tab_register")}
        </Button>
      </div>

      <form onSubmit={handleSubmit} class="mb-0">
        <Show when={errorMessage()}>
          <div class="alert alert-danger mb-12">{errorMessage()}</div>
        </Show>

        <div class="form-group mb-12">
          <label for="server-username" class="mb-6">
            {t("login_self_hosted_username")}
          </label>
          <Input
            id="server-username"
            type="text"
            placeholder="user123"
            value={username()}
            onInput={(e) => {
              setUsername(e.currentTarget.value);
              setErrorMessage("");
            }}
          />
        </div>

        <div class="form-group mb-8">
          <label for="server-password" class="mb-6">
            {t("login_self_hosted_password")}
          </label>
          <Input
            id="server-password"
            type="password"
            placeholder="••••••••"
            value={password()}
            onInput={(e) => {
              setPassword(e.currentTarget.value);
              setErrorMessage("");
            }}
          />
        </div>

        <Show when={authMode() === "login"}>
          <div class="flex justify-end mb-16">
            <Button
              type="button"
              variant="secondary"
              class="btn-link text-xs p-0"
              onClick={handleForgotPassword}
            >
              {t("login_self_hosted_forgot_password")}
            </Button>
          </div>
        </Show>

        <Button type="submit" variant="primary" block>
          {authMode() === "login"
            ? t("login_self_hosted_btn_login")
            : t("login_self_hosted_btn_register")}
        </Button>
      </form>

      {/* Server Config Modal */}
      <ServerConfigModal
        isOpen={isModalOpen()}
        onClose={() => setIsModalOpen(false)}
        initialUrl={serverUrl()}
        onSave={handleSaveServerUrl}
      />
    </div>
  );
};
