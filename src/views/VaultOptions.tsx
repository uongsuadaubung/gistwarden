import { type Component, createSignal, Show } from "solid-js";
import { store, storeActions, View } from "@/shared/store.ts";
import {
  ChevronRightIcon,
  DownloadIcon,
  SyncIcon,
  UploadIcon,
} from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";
import DetailHeader from "@/components/DetailHeader.tsx";

export const VaultOptions: Component = () => {
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const handleBack = () => {
    storeActions.navigate(View.Settings);
  };

  const handleSync = async () => {
    setLoading(true);
    setError("");
    const res = await storeActions.syncVault();
    setLoading(false);
    if (res.success) {
      storeActions.showToast(t("vault_sync_success"), "success");
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
            onClick={() => storeActions.navigate(View.ImportAccounts)}
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
            onClick={() => storeActions.navigate(View.ExportAccounts)}
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
