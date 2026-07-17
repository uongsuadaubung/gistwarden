import { type Component, createSignal, Show } from "solid-js";
import { store, storeActions, View } from "@/shared/store.ts";
import { updateSettings } from "@/shared/storage.ts";
import { ChevronRightIcon, KeyIcon } from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";
import SetPinModal from "@/components/SetPinModal.tsx";
import SessionTimeoutSettings from "@/components/SessionTimeoutSettings.tsx";
import Checkbox from "@/components/Checkbox.tsx";
import DetailHeader from "@/components/DetailHeader.tsx";

export const AccountSecurity: Component = () => {
  const [isPinModalOpen, setIsPinModalOpen] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleBack = () => {
    storeActions.navigate(View.Settings);
  };

  const handlePinToggle = async (checked: boolean) => {
    if (checked) {
      setIsPinModalOpen(true);
    } else {
      if (
        await storeActions.confirm(
          t("confirm_title"),
          store.language === "vi"
            ? "Bạn có chắc chắn muốn tắt tính năng mở khóa bằng mã PIN?"
            : "Are you sure you want to disable PIN unlock?",
          "warning",
        )
      ) {
        await storeActions.disablePinUnlock();
        storeActions.showToast(
          store.language === "vi"
            ? "Đã tắt mở khóa bằng mã PIN"
            : "PIN unlock disabled",
          "info",
        );
      }
    }
  };

  const handleSavePin = async (pin: string, requireRestart: boolean) => {
    setIsPinModalOpen(false);
    setError("");
    const res = await storeActions.setPinUnlock(pin, requireRestart);
    if (res.success) {
      storeActions.showToast(
        store.language === "vi"
          ? "Mã PIN đã được thiết lập thành công!"
          : "PIN set successfully!",
        "success",
      );
    } else {
      setError(res.error || "Failed to set PIN");
    }
  };

  const handleRequireRestartChange = async (checked: boolean) => {
    // Just update settings directly
    await updateSettings({ requireMasterPasswordOnRestart: checked });
  };

  const handleTimeoutChange = async (
    timeout: string,
    action: "lock" | "logout",
  ) => {
    await storeActions.updateSessionTimeout(timeout, action);
    storeActions.showToast(
      store.language === "vi"
        ? "Cài đặt thời gian chờ đã cập nhật"
        : "Timeout settings updated",
      "success",
    );
  };

  // Using a trick in SolidJS to trigger reactively for store state
  // because nested setStore doesn't trigger unless we access it.
  const isPinEnabled = () => store.pinUnlockEnabled;
  const isRequireRestart = () => store.requireMasterPasswordOnRestart;
  const currentTimeout = () => store.vaultTimeout;
  const currentTimeoutAction = () => store.vaultTimeoutAction;

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

        {/* Section 2: Session Timeout */}
        <div class="detail-section-title">{t("session_timeout_header")}</div>
        <div class="card p-16 mb-20">
          <SessionTimeoutSettings
            timeout={currentTimeout()}
            action={currentTimeoutAction()}
            onChange={handleTimeoutChange}
          />
        </div>

        {/* Section 3: Master Password */}
        <div class="detail-section-title">{t("settings_change_mp_title")}</div>
        <div class="card card-list mb-0">
          <div
            class="setting-row"
            onClick={() => storeActions.navigate(View.ChangeMasterPassword)}
          >
            <div class="setting-row-left">
              <KeyIcon />
              <div>
                <div class="setting-label">{t("settings_change_mp")}</div>
                <div class="setting-sub">{t("settings_change_mp_sub")}</div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>
        </div>
      </div>

      {/* Set PIN Modal */}
      <SetPinModal
        isOpen={isPinModalOpen()}
        onClose={() => setIsPinModalOpen(false)}
        onSave={handleSavePin}
      />
    </div>
  );
};

export default AccountSecurity;
