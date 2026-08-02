import { type Component, createSignal, Show } from "solid-js";
import { accountStore } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { exportToJsonWasm, VaultItemType } from "@gistwarden/domain";
import { navigate } from "@/core/navigation.ts";
import { requestReprompt, showToast } from "@gistwarden/ui";
import { ChevronRightIcon, DownloadIcon } from "@/icons/svg/index.ts";
import { t } from "@/core/i18n.ts";
import { APP_NAME } from "@/core/constants.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import {
  exportToBitwardenCsv,
  exportToBrowserCsv,
} from "@/features/sync/csv-export.ts";

export const ExportAccounts: Component = () => {
  const [error, setError] = createSignal("");

  const handleBack = () => {
    navigate(View.VaultOptions);
  };

  const handleExportClick = async (type: "browser" | "bitwarden" | "json") => {
    setError("");
    const verified = await requestReprompt();
    if (!verified) return;

    let fileContent = "";
    let fileName = "";
    let mimeType = "";

    if (type === "json") {
      const itemsJson = JSON.stringify(accountStore.vaultItems || []);
      const foldersJson = JSON.stringify(accountStore.folders || []);
      fileContent = exportToJsonWasm(itemsJson, foldersJson);
      fileName = `${APP_NAME.toLowerCase()}_export_${
        new Date().toISOString().slice(0, 10)
      }.json`;
      mimeType = "application/json";
    } else if (type === "browser") {
      fileContent = exportToBrowserCsv(accountStore.vaultItems);
      fileName = `${APP_NAME.toLowerCase()}_browser_export_${
        new Date().toISOString().slice(0, 10)
      }.csv`;
      mimeType = "text/csv";
    } else {
      fileContent = exportToBitwardenCsv(
        accountStore.vaultItems,
        accountStore.folders,
      );
      fileName = `${APP_NAME.toLowerCase()}_bitwarden_export_${
        new Date().toISOString().slice(0, 10)
      }.csv`;
      mimeType = "text/csv";
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("settings_export_success"), "success");
  };

  return (
    <div class="app-container">
      <div class="app-body">
        {/* Header */}
        <DetailHeader
          title={t("settings_export_accounts_title")}
          onBack={handleBack}
        />

        <Show when={error()}>
          <div class="alert alert-danger">{error()}</div>
        </Show>

        <div class="card card-list">
          {/* Browser CSV */}
          <div class="setting-row" onClick={() => handleExportClick("browser")}>
            <div class="setting-row-left">
              <DownloadIcon />
              <div>
                <div class="setting-label">{t("export_option_browser")}</div>
                <div class="setting-sub">{t("export_option_browser_sub")}</div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Bitwarden CSV */}
          <div
            class="setting-row"
            onClick={() => handleExportClick("bitwarden")}
          >
            <div class="setting-row-left">
              <DownloadIcon />
              <div>
                <div class="setting-label">
                  {t("export_option_bitwarden_csv")}
                </div>
                <div class="setting-sub">
                  {t("export_option_bitwarden_csv_sub")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* JSON Backup */}
          <div class="setting-row" onClick={() => handleExportClick("json")}>
            <div class="setting-row-left">
              <DownloadIcon />
              <div>
                <div class="setting-label">{t("export_option_json")}</div>
                <div class="setting-sub">{t("export_option_json_sub")}</div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportAccounts;
