import { type Component, createSignal, Show } from "solid-js";
import { store } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { navigate } from "@/core/navigation.ts";
import { syncVault } from "@/features/sync/sync-service.ts";
import { showToast } from "@/core/ui-service.ts";
import {
  ChevronRightIcon,
  DownloadIcon,
  SyncIcon,
  UploadIcon,
} from "@/icons/svg/index.ts";
import { t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { handlePopout, isPopout } from "@/core/popout-utils.ts";
import { setSessionItem } from "@/core/storage.ts";
import { SESSION_KEY_LAST_VIEW } from "@/core/constants.ts";

export const VaultOptions: Component = () => {
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const handleBack = () => {
    navigate(View.Settings);
  };

  const handleSync = async () => {
    setLoading(true);
    setError("");
    const res = await syncVault();
    setLoading(false);
    if (res.success) {
      showToast(t("vault_sync_success"), "success");
    } else {
      setError(res.error || t("vault_sync_error"));
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
              <SyncIcon class={loading() ? "spinning" : ""} />
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
        </div>
      </div>
    </div>
  );
};

export default VaultOptions;
