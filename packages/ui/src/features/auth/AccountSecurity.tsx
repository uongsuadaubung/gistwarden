import { type Component, createSignal, Show } from "solid-js";
import { accountStore, setSettingsStore, settingsStore } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import {
  type VaultTimeoutAction,
  type VaultTimeoutValue,
} from "@/core/storage-schemas.ts";
import { navigate } from "@/core/navigation.ts";
import { disablePinUnlock, setPinUnlock } from "@/features/auth/pin-service.ts";
import { updateSessionTimeout } from "@/features/auth/auth-service.ts";
import { confirm, setGlobalLoading, showToast } from "@gistwarden/ui";
import { updateExtensionSettings } from "@/core/storage.ts";
import { ChevronRightIcon, KeyIcon } from "@/icons/svg/index.ts";
import { t } from "@/core/i18n.ts";
import SetPinModal from "@/features/auth/SetPinModal.tsx";
import SessionTimeoutSettings from "@/features/settings/SessionTimeoutSettings.tsx";
import Checkbox from "@/components/ui/Checkbox.tsx";
import DetailHeader from "@/components/ui/DetailHeader.tsx";

export const AccountSecurity: Component = () => {
  const [isPinModalOpen, setIsPinModalOpen] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleBack = () => {
    navigate(View.Settings);
  };

  const handlePinToggle = async (checked: boolean) => {
    if (checked) {
      setIsPinModalOpen(true);
    } else {
      if (
        await confirm(
          t("confirm_title"),
          t("confirm_disable_pin"),
          "warning",
        )
      ) {
        await disablePinUnlock();
        showToast(
          t("toast_pin_disabled"),
          "info",
        );
      }
    }
  };

  const handleSavePin = async (pin: string, requireRestart: boolean) => {
    setIsPinModalOpen(false);
    setError("");
    setGlobalLoading(true);
    const res = await setPinUnlock(pin, requireRestart);
    setGlobalLoading(false);
    if (res.isOk()) {
      showToast(
        t("toast_pin_set_success"),
        "success",
      );
    } else {
      setError(t(res.error));
    }
  };

  const handleRequireRestartChange = async (checked: boolean) => {
    setSettingsStore("requireMasterPasswordOnRestart", checked);
    await updateExtensionSettings({ requireMasterPasswordOnRestart: checked });
  };

  const handleTimeoutChange = async (
    timeout: VaultTimeoutValue,
    action: VaultTimeoutAction,
  ) => {
    await updateSessionTimeout(timeout, action);
    showToast(
      t("toast_timeout_updated"),
      "success",
    );
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

        {/* Section 1: Unlock Options */}
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

        {/* Section 2: Vault Timeout Settings */}
        <SessionTimeoutSettings
          timeout={currentTimeout()}
          action={currentTimeoutAction()}
          onChange={handleTimeoutChange}
        />

        {/* Section 3: Change Master Password Action */}
        <div class="detail-section-title">
          {t("settings_change_mp_title")}
        </div>
        <div class="card card-list">
          <div
            class="setting-row"
            onClick={() => navigate(View.ChangeMasterPassword)}
          >
            <div class="setting-row-left">
              <KeyIcon />
              <div>
                <div class="setting-label">
                  {t("settings_change_mp_title")}
                </div>
                <div class="setting-sub">
                  {t("settings_change_mp_sub")}
                </div>
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
