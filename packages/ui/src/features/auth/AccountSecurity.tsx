import { updateExtensionSettingsUseCase } from "@gistwarden/orchestrator";
import { confirm, showToast } from "@gistwarden/ui";
import { type Component, createSignal, Show } from "solid-js";
import Checkbox from "@/components/ui/Checkbox.tsx";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { t } from "@/core/i18n.ts";
import { goBack, navigate } from "@/core/navigation.ts";
import { isExtension } from "@/core/runtime.ts";
import type {
  VaultTimeoutAction,
  VaultTimeoutValue,
} from "@/core/storage-schemas.ts";
import { accountStore, setSettingsStore, settingsStore } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { updateSessionTimeout } from "@/features/auth/auth-service.ts";
import { disablePinUnlock, setPinUnlock } from "@/features/auth/pin-service.ts";
import SetPinModal from "@/features/auth/SetPinModal.tsx";
import SessionTimeoutSettings from "@/features/settings/SessionTimeoutSettings.tsx";
import { ChevronRightIcon, KeyIcon } from "@/icons/svg/index.ts";

export const AccountSecurity: Component = () => {
  const [isPinModalOpen, setIsPinModalOpen] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleBack = () => {
    goBack(View.Settings);
  };

  const handlePinToggle = async (checked: boolean) => {
    if (checked) {
      setIsPinModalOpen(true);
    } else {
      if (
        await confirm(t("confirm_title"), t("confirm_disable_pin"), "warning")
      ) {
        await disablePinUnlock();
        showToast(t("toast_pin_disabled"), "info");
      }
    }
  };

  const handleSavePin = async (pin: string, requireRestart: boolean) => {
    setIsPinModalOpen(false);
    setError("");
    const res = await setPinUnlock(pin, requireRestart);
    if (res.isOk()) {
      showToast(t("toast_pin_set_success"), "success");
    } else {
      setError(t(res.error));
    }
  };

  const handleRequireRestartChange = async (checked: boolean) => {
    setSettingsStore("requireMasterPasswordOnRestart", checked);
    await updateExtensionSettingsUseCase({
      requireMasterPasswordOnRestart: checked,
    });
  };

  const handleTimeoutChange = async (
    timeout: VaultTimeoutValue,
    action: VaultTimeoutAction,
  ) => {
    await updateSessionTimeout(timeout, action);
    showToast(t("toast_timeout_updated"), "success");
  };

  const isPinEnabled = () => accountStore.pinConfig.enabled;
  const isRequireRestart = () => settingsStore.requireMasterPasswordOnRestart;
  const currentTimeout = () => settingsStore.vaultTimeout;
  const currentTimeoutAction = () => settingsStore.vaultTimeoutAction;

  return (
    <div class="app-container">
      <div class="app-body pb-24">
        {/* Header */}
        <DetailHeader title={t("account_security_title")} onBack={handleBack} />

        <Show when={error()}>
          <div class="alert alert-danger mb-16">{error()}</div>
        </Show>

        {/* Section 1: Unlock Options (PIN) - Available on Web & Extension */}
        <div class="detail-section-title mt-0">
          {t("unlock_options_header")}
        </div>
        <div class="card p-16 mb-20 d-flex flex-column gap-16">
          {/* PIN Option */}
          <Checkbox
            id="unlock-pin"
            checked={isPinEnabled()}
            onChange={handlePinToggle}
            label={t("unlock_with_pin")}
          />

          {/* Require master password on restart - Indent nested option */}
          <Show when={isPinEnabled()}>
            <Checkbox
              id="pin-require-restart"
              checked={isRequireRestart()}
              onChange={handleRequireRestartChange}
              label={t("require_master_password_on_restart")}
              class="pl-24"
            />
          </Show>
        </div>

        {/* Section 2: Extension Only (Vault Timeout Settings) */}
        <Show when={isExtension()}>
          <SessionTimeoutSettings
            timeout={currentTimeout()}
            action={currentTimeoutAction()}
            onChange={handleTimeoutChange}
          />
        </Show>

        {/* Section 3: Change Master Password Action */}
        <div class="detail-section-title">{t("settings_change_mp_title")}</div>
        <div class="card card-list">
          <div
            class="setting-row"
            onClick={() => navigate(View.ChangeMasterPassword)}
          >
            <div class="setting-row-left">
              <KeyIcon />
              <div>
                <div class="setting-label">{t("settings_change_mp_title")}</div>
                <div class="setting-sub">{t("settings_change_mp_sub")}</div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>
        </div>

        {/* Modal đặt mã PIN */}
        <SetPinModal
          isOpen={isPinModalOpen()}
          onClose={() => setIsPinModalOpen(false)}
          onSave={handleSavePin}
        />
      </div>
    </div>
  );
};

export default AccountSecurity;
