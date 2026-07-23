import { type Component, createSignal, Show } from "solid-js";
import { store } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { navigate } from "@/core/navigation.ts";
import { syncVault } from "@/features/sync/sync-service.ts";
import { clearVault } from "@/features/vault/vault-service.ts";
import {
  confirm,
  requestReprompt,
  setGlobalLoading,
  showToast,
} from "@/core/ui-service.ts";
import {
  ChevronRightIcon,
  DownloadIcon,
  SyncIcon,
  TrashIcon,
  UploadIcon,
} from "@/icons/svg/index.ts";
import { t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { handlePopout, isPopout } from "@/core/popout-utils.ts";
import { setSessionItem } from "@/core/storage.ts";
import { SESSION_KEY_LAST_VIEW } from "@/core/constants.ts";

export const VaultOptions: Component = () => {
  const [error, setError] = createSignal("");

  const handleBack = () => {
    navigate(View.Settings);
  };

  const handleSync = async () => {
    setGlobalLoading(true, t("vault_syncing"));
    const res = await syncVault();
    setGlobalLoading(false);
    if (res.isOk()) {
      showToast(t("vault_sync_success"), "success");
    } else {
      setError(res.error || t("vault_sync_error"));
    }
  };

  const handleClearVault = async () => {
    if (
      !(await confirm(
        t("settings_clear_vault"),
        t("settings_clear_vault_msg"),
        "danger",
      ))
    ) {
      return;
    }
    if (
      !(await confirm(
        t("settings_clear_vault_confirm_title"),
        t("settings_clear_vault_confirm_msg"),
        "danger",
      ))
    ) {
      return;
    }

    const verified = await requestReprompt();
    if (!verified) {
      return;
    }

    setGlobalLoading(true);
    setError("");
    const res = await clearVault();
    setGlobalLoading(false);
    if (res.isOk()) {
      showToast(
        t("settings_clear_vault_success"),
        "success",
      );
    } else {
      setError(t(res.error));
    }
  };

  return (
    <div class="app-container">
      <div class="app-body">
        {/* Header */}
        <DetailHeader
          title={t("settings_vault_options_label")}
          onBack={handleBack}
        />

        <Show when={error()}>
          <div class="alert alert-danger">{error()}</div>
        </Show>

        <div class="card card-list">
          {/* Sync */}
          <div class="setting-row" onClick={handleSync}>
            <div class="setting-row-left">
              <SyncIcon />
              <div>
                <div class="setting-label">
                  {t("vault_options_sync_manual")}
                </div>
                <div class="setting-sub">
                  {t("settings_last_sync")}: {store.lastSync
                    ? new Date(store.lastSync).toLocaleTimeString()
                    : t("settings_sync_never")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Import */}
          <div
            class="setting-row"
            onClick={async () => {
              const isFirefox = navigator.userAgent.includes("Firefox");
              if (isFirefox && !isPopout()) {
                await setSessionItem(
                  SESSION_KEY_LAST_VIEW,
                  View.ImportAccounts,
                );
                handlePopout();
              } else {
                navigate(View.ImportAccounts);
              }
            }}
          >
            <div class="setting-row-left">
              <UploadIcon />
              <div>
                <div class="setting-label">{t("vault_options_import")}</div>
                <div class="setting-sub">
                  {t("vault_options_import_sub")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Export */}
          <div
            class="setting-row"
            onClick={() => navigate(View.ExportAccounts)}
          >
            <div class="setting-row-left">
              <DownloadIcon />
              <div>
                <div class="setting-label">{t("vault_options_export")}</div>
                <div class="setting-sub">
                  {t("vault_options_export_sub")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Clear Vault */}
          <div class="setting-row" onClick={handleClearVault}>
            <div class="setting-row-left">
              <TrashIcon class="text-error" />
              <div>
                <div class="setting-label text-error">
                  {t("settings_clear_vault")}
                </div>
                <div class="setting-sub">
                  {t("settings_clear_vault_sub")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultOptions;
