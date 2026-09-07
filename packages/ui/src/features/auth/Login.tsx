import { SESSION_KEY_ENCRYPTED_VAULT } from "@gistwarden/domain";
import { startGithubOauthRoute } from "@gistwarden/orchestrator";
import {
  DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
  DEFAULT_SYNC_CONFIG,
  type VaultMode,
  VaultModeSchema,
} from "@gistwarden/repository";
import { setGlobalLoading, updateLanguage } from "@gistwarden/ui";
import {
  type Component,
  createSignal,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { z } from "zod";
import Button from "@/components/ui/Button.tsx";
import GuideHelpButton from "@/components/ui/GuideHelpButton.tsx";
import { Select } from "@/components/ui/Select.tsx";
import {
  APP_NAME,
  OAUTH_CLIENT_ID,
  SESSION_KEY_PENDING_SYNC_TOKEN,
} from "@/core/constants.ts";
import { type TranslationKey, t } from "@/core/i18n.ts";
import { sendBackgroundMessage } from "@/core/messaging.ts";
import {
  getAccountSettings,
  getSessionItem,
  removeSessionItem,
  setSessionItem,
  updateAccountSettings,
  updateExtensionSettings,
} from "@/core/storage.ts";
import {
  accountStore,
  setAccountStore,
  setSettingsStore,
  settingsStore,
} from "@/core/store.ts";
import {
  createNewVault,
  syncVaultStatus,
} from "@/features/auth/auth-service.ts";
import { GithubSetupForm } from "@/features/auth/components/GithubSetupForm.tsx";
import { MasterPasswordCreate } from "@/features/auth/components/MasterPasswordCreate.tsx";
import { SelfHostedSetupForm } from "@/features/auth/components/SelfHostedSetupForm.tsx";
import { setupGithub } from "@/features/sync/github-auth.ts";
import {
  AppIcon,
  GithubIcon,
  GlobeIcon,
  ShieldAlertIcon,
  VaultIcon,
} from "@/icons/svg/index.ts";

export const Login: Component = () => {
  const [error, setError] = createSignal("");
  const [isLocalSetupActive, setIsLocalSetupActive] = createSignal(false);
  const [gistStatus, setGistStatus] = createSignal<
    "checking" | "new" | "exists"
  >("checking");

  onMount(async () => {
    setGistStatus("checking");
    let tokenToSetup: string | null = null;

    const rawTokenRes = await getSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN);
    const rawToken = rawTokenRes.isOk() ? rawTokenRes.value : null;
    const parsed = z.string().safeParse(rawToken);
    if (parsed.success && parsed.data) {
      tokenToSetup = parsed.data;
    }

    if (!tokenToSetup && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token");
      if (tokenFromUrl) {
        tokenToSetup = tokenFromUrl;
        const cleanUrl =
          window.location.origin +
          window.location.pathname +
          window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    if (tokenToSetup) {
      setGlobalLoading(true);
      const setupRes = await setupGithub(tokenToSetup);
      setGlobalLoading(false);
      if (setupRes.isErr()) {
        setError(t(setupRes.error));
      }
    }

    const initialStatus = await syncVaultStatus(settingsStore.vaultMode, false);
    setGistStatus(initialStatus);
  });

  const handleConnectGithubToken = async (rawToken: string) => {
    const trimmed = rawToken.trim();
    if (!trimmed) {
      setError(t("login_error_empty_pat"));
      return;
    }
    setGlobalLoading(true);
    setGistStatus("checking");
    setError("");
    const setupRes = await setupGithub(trimmed);
    if (setupRes.isErr()) {
      setGlobalLoading(false);
      setGistStatus("exists");
      setError(t(setupRes.error));
      return;
    }
    const status = await syncVaultStatus(settingsStore.vaultMode);
    setGistStatus(status);
    setGlobalLoading(false);
  };

  const handleSaveToken = async (token: string) => {
    await handleConnectGithubToken(token);
  };

  const handleGithubOauth = async () => {
    setGlobalLoading(true);
    setError("");

    const handleOauthError = (errVal: TranslationKey) => {
      setError(t(errVal));
      setGlobalLoading(false);
    };

    const sendResult = await sendBackgroundMessage(startGithubOauthRoute, {
      content: OAUTH_CLIENT_ID,
    });
    if (sendResult.isErr()) {
      handleOauthError(sendResult.error);
      return;
    }
    if (!sendResult.value.success) {
      handleOauthError(sendResult.value.error || "messaging_error_send_failed");
      return;
    }

    await handleConnectGithubToken(sendResult.value.token);
  };

  const handleSelfHostedAuth = async (
    action: "login" | "register",
    serverUrl: string,
    username: string,
    password: string,
  ) => {
    if (!serverUrl || !username || !password) {
      setError("Vui lòng điền đầy đủ Server URL, Username và Password.");
      return;
    }

    setGlobalLoading(true);
    setGistStatus("checking");
    setError("");

    try {
      const cleanUrl = serverUrl.trim().endsWith("/")
        ? serverUrl.trim().slice(0, -1)
        : serverUrl.trim();

      const endpoint =
        action === "login"
          ? `${cleanUrl}/auth/login`
          : `${cleanUrl}/auth/register`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setGlobalLoading(false);
        setGistStatus("exists");
        const errorCode = data.error || data.code;
        if (response.status === 409 || errorCode === "user_already_exists") {
          setError(t("self_hosted_error_user_exists"));
        } else if (
          response.status === 401 ||
          errorCode === "invalid_credentials"
        ) {
          setError(t("self_hosted_error_invalid_credentials"));
        } else if (errorCode === "username_too_short") {
          setError(t("self_hosted_error_username_too_short"));
        } else if (errorCode === "username_too_long") {
          setError(t("self_hosted_error_username_too_long"));
        } else if (errorCode === "password_too_short") {
          setError(t("self_hosted_error_password_too_short"));
        } else if (
          errorCode === "missing_fields" ||
          errorCode === "empty_username" ||
          errorCode === "empty_password"
        ) {
          setError(t("self_hosted_error_missing_fields"));
        } else if (data.message && typeof data.message === "string") {
          setError(data.message);
        } else {
          setError(t("self_hosted_error_network"));
        }
        return;
      }

      const accessToken = data.accessToken;
      if (!accessToken) {
        setGlobalLoading(false);
        setGistStatus("exists");
        setError(t("self_hosted_error_network"));
        return;
      }

      const currentAccRes = await getAccountSettings("self_hosted_server");
      const currentAcc = currentAccRes.isOk() ? currentAccRes.value : null;

      const updatedSyncConfig = {
        ...(currentAcc?.syncConfig || DEFAULT_SYNC_CONFIG),
        serverUrl: cleanUrl,
        username,
        syncTokenEncrypted: "",
        syncTokenIv: "",
      };

      await setSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN, accessToken);
      await updateAccountSettings(
        { syncConfig: updatedSyncConfig },
        "self_hosted_server",
      );

      setAccountStore("syncConfig", updatedSyncConfig);
      setAccountStore("syncToken", accessToken);

      const status = await syncVaultStatus("self_hosted_server");
      setGistStatus(status);
      setGlobalLoading(false);
    } catch {
      setGlobalLoading(false);
      setGistStatus("exists");
      setError(t("self_hosted_error_network"));
    }
  };

  const handleSaveSelfHostedServerUrl = async (serverUrl: string) => {
    const cleanUrl = serverUrl.trim().endsWith("/")
      ? serverUrl.trim().slice(0, -1)
      : serverUrl.trim();

    const currentAccRes = await getAccountSettings("self_hosted_server");
    const currentAcc = currentAccRes.isOk() ? currentAccRes.value : null;

    const updatedSyncConfig = {
      ...(currentAcc?.syncConfig || DEFAULT_SYNC_CONFIG),
      serverUrl: cleanUrl,
    };

    await updateAccountSettings(
      { syncConfig: updatedSyncConfig },
      "self_hosted_server",
    );

    setAccountStore("syncConfig", updatedSyncConfig);
  };

  const handleSwitchVaultMode = async (mode: VaultMode) => {
    setIsLocalSetupActive(false);
    setSettingsStore("vaultMode", mode);
    await updateExtensionSettings({ vaultMode: mode });
    await removeSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
    setError("");

    setGistStatus("checking");
    const status = await syncVaultStatus(mode, false);
    setGistStatus(status);
  };

  const handleAccessLocalVault = async () => {
    setGlobalLoading(true);
    setError("");
    const status = await syncVaultStatus("local_storage", true);
    setGlobalLoading(false);
    if (status === "exists") {
      setAccountStore("vaultConfigured", true);
    } else {
      setIsLocalSetupActive(true);
    }
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
        <p class="login-subtitle">{t("login_title_setup")}</p>
      </div>

      {/* Provider Selector Dropdown */}
      <div class="form-group mb-16">
        <Select
          id="provider-select"
          class="w-100"
          value={settingsStore.vaultMode}
          onChange={(e) => {
            const parsedMode = VaultModeSchema.safeParse(e.currentTarget.value);
            if (parsedMode.success) {
              handleSwitchVaultMode(parsedMode.data);
            }
          }}
          options={[
            {
              value: "github_gist",
              label: t("login_provider_github_gist"),
              icon: <GithubIcon size={16} />,
            },
            {
              value: "local_storage",
              label: t("login_provider_local"),
              icon: <VaultIcon size={16} />,
            },
            {
              value: "self_hosted_server",
              label: t("login_provider_self_hosted"),
              icon: <GlobeIcon size={16} />,
            },
          ]}
        />
      </div>

      {/* Local Vault Must Read Warning Banner */}
      <Show when={settingsStore.vaultMode === "local_storage"}>
        <div class="local-vault-must-read-banner mb-16">
          <div class="must-read-text">
            <ShieldAlertIcon size={16} class="must-read-icon" />
            <span>{t("login_local_vault_must_read")}</span>
          </div>
          <div class="must-read-link-group">
            <span class="must-read-label">
              {t("login_local_vault_must_read_btn")}
            </span>
            <GuideHelpButton route="getting-started/local-vault" size={15} />
          </div>
        </div>
      </Show>

      <Show when={error()}>
        <div class="alert alert-danger mb-16">{error()}</div>
      </Show>

      {/* Setup / Create Flow */}
      <Switch>
        <Match when={gistStatus() === "checking"}>
          <div class="min-h-120" />
        </Match>

        {/* 1. Local Storage Mode: Show Access Button or Master Password Creation */}
        <Match when={settingsStore.vaultMode === "local_storage"}>
          <Show
            when={isLocalSetupActive()}
            fallback={
              <div class="card mb-0 p-16 text-center">
                <p class="login-oauth-help mb-16">
                  {t("guide_start_local_lead")}
                </p>
                <Button
                  variant="primary"
                  block
                  onClick={handleAccessLocalVault}
                >
                  <VaultIcon class="github-btn-icon" size={16} />
                  <span>{t("login_btn_access_local")}</span>
                </Button>
              </div>
            }
          >
            <MasterPasswordCreate onCreate={handleCreateMasterPassword} />
          </Show>
        </Match>

        {/* 2. Self-Hosted Mode */}
        <Match when={settingsStore.vaultMode === "self_hosted_server"}>
          <Show
            when={Boolean(accountStore.syncToken) && gistStatus() === "new"}
            fallback={
              <SelfHostedSetupForm
                initialServerUrl={accountStore.syncConfig.serverUrl}
                onSaveServerUrl={handleSaveSelfHostedServerUrl}
                onLogin={(url, user, pass) =>
                  handleSelfHostedAuth("login", url, user, pass)
                }
                onRegister={(url, user, pass) =>
                  handleSelfHostedAuth("register", url, user, pass)
                }
              />
            }
          >
            <MasterPasswordCreate onCreate={handleCreateMasterPassword} />
          </Show>
        </Match>

        {/* 3. GitHub Gist Mode */}
        <Match when={settingsStore.vaultMode === "github_gist"}>
          <Show
            when={Boolean(accountStore.syncToken) && gistStatus() === "new"}
            fallback={
              <GithubSetupForm
                onSaveToken={handleSaveToken}
                onGithubOauth={handleGithubOauth}
              />
            }
          >
            <MasterPasswordCreate onCreate={handleCreateMasterPassword} />
          </Show>
        </Match>
      </Switch>
    </div>
  );
};

export default Login;
