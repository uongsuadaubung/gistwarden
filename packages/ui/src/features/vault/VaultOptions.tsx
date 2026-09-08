import { setSessionStorageUseCase } from "@gistwarden/orchestrator";
import { requestReprompt, setGlobalLoading, showToast } from "@gistwarden/ui";
import { type Component, createSignal, Show } from "solid-js";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import TypedConfirmModal from "@/components/ui/TypedConfirmModal.tsx";
import {
  SESSION_KEY_LAST_VIEW,
  STORE_KEY_SYNC_ERROR,
  STORE_KEY_SYNCING,
} from "@/core/constants.ts";
import { t } from "@/core/i18n.ts";
import { goBack, navigate } from "@/core/navigation.ts";
import { handlePopout, isPopout } from "@/core/popout-utils.ts";
import { isExtension, isFirefox } from "@/core/runtime.ts";
import { accountStore, setUiStore } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { syncVault } from "@/features/sync/sync-service.ts";
import { clearVault } from "@/features/vault/vault-service.ts";
import {
  ChevronRightIcon,
  DownloadIcon,
  FolderIcon,
  QrIcon,
  SyncIcon,
  TrashIcon,
  UploadIcon,
} from "@/icons/svg/index.ts";

export const VaultOptions: Component = () => {
  const [error, setError] = createSignal("");
  const [showClearModal, setShowClearModal] = createSignal(false);

  const handleBack = () => {
    goBack(View.Settings);
  };

  const handleSync = async () => {
    setUiStore(STORE_KEY_SYNCING, true);
    setUiStore(STORE_KEY_SYNC_ERROR, "");
    setGlobalLoading(true, t("vault_syncing"));
    const res = await syncVault();
    setGlobalLoading(false);
    if (res.isOk()) {
      showToast(t("vault_sync_success"), "success");
    } else {
      const errorKey = res.error || "vault_sync_error";
      setUiStore(STORE_KEY_SYNC_ERROR, t(errorKey));
      setError(t(errorKey));
    }
    setUiStore(STORE_KEY_SYNCING, false);
  };

  const handleClearVault = () => {
    setShowClearModal(true);
  };

  const handleConfirmClearVault = async () => {
    setShowClearModal(false);
    const verified = await requestReprompt();
    if (!verified) {
      return;
    }

    setGlobalLoading(true);
    setError("");
    const res = await clearVault();
    setGlobalLoading(false);
    if (res.isOk()) {
      showToast(t("settings_clear_vault_success"), "success");
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

        {/* Group 1: Sync, Import/Export & Migration */}
        <div class="setting-group-title">
          {t("vault_options_group_sync_import")}
        </div>
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
                  {t("settings_last_sync")}:{" "}
                  {accountStore.lastSync
                    ? new Date(accountStore.lastSync).toLocaleTimeString()
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
              if (isExtension() && isFirefox() && !isPopout()) {
                await setSessionStorageUseCase(
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
                <div class="setting-sub">{t("vault_options_import_sub")}</div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Google Authenticator Decoder Tool */}
          <div
            class="setting-row"
            onClick={async () => {
              if (isExtension() && isFirefox() && !isPopout()) {
                await setSessionStorageUseCase(
                  SESSION_KEY_LAST_VIEW,
                  View.GoogleAuthTool,
                );
                handlePopout();
              } else {
                navigate(View.GoogleAuthTool);
              }
            }}
          >
            <div class="setting-row-left">
              <QrIcon />
              <div>
                <div class="setting-label">
                  {t("settings_tools_google_auth")}
                </div>
                <div class="setting-sub">
                  {t("settings_tools_google_auth_sub")}
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
                <div class="setting-sub">{t("vault_options_export_sub")}</div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>
        </div>

        {/* Group 2: Storage & Organization */}
        <div class="setting-group-title">
          {t("vault_options_group_management")}
        </div>
        <div class="card card-list">
          {/* Folders */}
          <div class="setting-row" onClick={() => navigate(View.Folders)}>
            <div class="setting-row-left">
              <FolderIcon />
              <div>
                <div class="setting-label">
                  {t("folder_management_title")} (
                  {(accountStore.folders || []).length})
                </div>
                <div class="setting-sub">{t("vault_options_folders_sub")}</div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Trash */}
          <div class="setting-row" onClick={() => navigate(View.Trash)}>
            <div class="setting-row-left">
              <TrashIcon />
              <div>
                <div class="setting-label">
                  {t("trash_title")} ({(accountStore.trashItems || []).length})
                </div>
                <div class="setting-sub">{t("vault_options_trash_sub")}</div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>
        </div>

        {/* Group 3: Danger Zone */}
        <div class="setting-group-title">{t("vault_options_group_danger")}</div>
        <div class="card card-list">
          {/* Clear Vault */}
          <div class="setting-row" onClick={handleClearVault}>
            <div class="setting-row-left">
              <TrashIcon class="text-error" />
              <div>
                <div class="setting-label text-error">
                  {t("settings_clear_vault")}
                </div>
                <div class="setting-sub">{t("settings_clear_vault_sub")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TypedConfirmModal
        isOpen={showClearModal()}
        title={t("settings_clear_vault_confirm_title")}
        messageHtml={t("clear_vault_confirm_prompt_msg")}
        requiredWord="DELETE"
        placeholder={t("clear_vault_confirm_placeholder")}
        confirmButtonText={t("settings_clear_vault")}
        variant="danger"
        onClose={() => setShowClearModal(false)}
        onConfirm={handleConfirmClearVault}
      />
    </div>
  );
};

export default VaultOptions;
