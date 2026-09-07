import { resetAccountSettingsUseCase } from "@gistwarden/orchestrator";
import { setGlobalLoading, updateLanguage } from "@gistwarden/ui";
import {
  type Component,
  createEffect,
  createSignal,
  onMount,
  Show,
} from "solid-js";
import TypedConfirmModal from "@/components/ui/TypedConfirmModal.tsx";
import { APP_NAME } from "@/core/constants.ts";
import { t } from "@/core/i18n.ts";
import {
  accountStore,
  resetAccountStore,
  settingsStore,
} from "@/core/store.ts";
import {
  logout,
  syncVaultStatus,
  unlock,
} from "@/features/auth/auth-service.ts";
import { MasterPasswordForm } from "@/features/auth/components/MasterPasswordForm.tsx";
import { handleForgotMasterPassword } from "@/features/auth/forgot-password-strategies.ts";
import PinUnlockForm from "@/features/auth/PinUnlockForm.tsx";
import { unlockWithPin } from "@/features/auth/pin-service.ts";
import {
  AppIcon,
  GithubIcon,
  GlobeIcon,
  VaultIcon,
} from "@/icons/svg/index.ts";

export const LockScreen: Component = () => {
  const [error, setError] = createSignal("");
  const [viewMode, setViewMode] = createSignal<"masterPassword" | "pin">(
    "masterPassword",
  );
  const [failedUnlockAttempts, setFailedUnlockAttempts] = createSignal(0);
  const [showResetLocalModal, setShowResetLocalModal] = createSignal(false);

  onMount(async () => {
    await syncVaultStatus(settingsStore.vaultMode);
  });

  createEffect(() => {
    if (accountStore.isLoaded && settingsStore.isLoaded) {
      if (accountStore.pinConfig.enabled) {
        if (
          settingsStore.requireMasterPasswordOnRestart &&
          !accountStore.hasUnlockedInSession
        ) {
          setViewMode("masterPassword");
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
    await handleForgotMasterPassword(settingsStore.vaultMode, {
      onOpenResetLocalModal: () => setShowResetLocalModal(true),
    });
  };

  const handleConfirmResetLocalVault = async () => {
    setShowResetLocalModal(false);
    await resetAccountSettingsUseCase("local_storage");
    resetAccountStore();
  };

  const getProviderBadge = () => {
    switch (settingsStore.vaultMode) {
      case "github_gist":
        return {
          icon: <GithubIcon size={14} />,
          label: t("login_provider_github_gist"),
        };
      case "self_hosted_server":
        return {
          icon: <GlobeIcon size={14} />,
          label: accountStore.syncConfig.username
            ? `${accountStore.syncConfig.username}`
            : t("login_provider_self_hosted"),
        };
      default:
        return {
          icon: <VaultIcon size={14} />,
          label: t("login_provider_local"),
        };
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
        <p class="login-subtitle">{t("login_title_locked")}</p>

        {/* Current Provider Static Badge */}
        <div class="lock-provider-badge">
          <span class="lock-provider-icon">{getProviderBadge().icon}</span>
          <span class="lock-provider-label">{getProviderBadge().label}</span>
        </div>
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
        when={viewMode() === "pin"}
        fallback={
          <MasterPasswordForm
            onUnlock={handleUnlock}
            onSwitchToPin={() => setViewMode("pin")}
            onLogout={handleResetToken}
            onForgotPassword={handleForgotPassword}
          />
        }
      >
        <PinUnlockForm
          error={error()}
          onUnlock={handlePinUnlock}
          onSwitchToMasterPassword={() => setViewMode("masterPassword")}
        />
      </Show>

      <TypedConfirmModal
        isOpen={showResetLocalModal()}
        title={t("login_local_forgot_password_title")}
        messageHtml={t("login_local_forgot_password_msg")}
        requiredWord="RESET"
        placeholder={t("login_local_reset_placeholder")}
        confirmButtonText={t("login_local_reset_btn")}
        variant="danger"
        onClose={() => setShowResetLocalModal(false)}
        onConfirm={handleConfirmResetLocalVault}
      />
    </div>
  );
};

export default LockScreen;
