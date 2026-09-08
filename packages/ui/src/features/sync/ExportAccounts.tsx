import { requestReprompt, showToast } from "@gistwarden/ui";
import { type Component, createSignal, For, Show } from "solid-js";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { t } from "@/core/i18n.ts";
import { goBack, navigate } from "@/core/navigation.ts";
import { accountStore } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { ChevronRightIcon, DownloadIcon } from "@/icons/svg/index.ts";
import {
  getAllExportStrategies,
  getExportStrategy,
} from "./import-export-registry.ts";

export const ExportAccounts: Component = () => {
  const [error, setError] = createSignal("");

  const handleBack = () => {
    goBack(View.VaultOptions);
  };

  const handleExportClick = async (formatId: string) => {
    setError("");
    const verified = await requestReprompt();
    if (!verified) return;

    const strategy = getExportStrategy(formatId);
    const result = strategy.export(
      accountStore.vaultItems,
      accountStore.folders,
    );

    const blob = new Blob([result.fileContent], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
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
          <For each={getAllExportStrategies()}>
            {(strategy) => (
              <div
                class="setting-row"
                onClick={() => handleExportClick(strategy.id)}
              >
                <div class="setting-row-left">
                  <DownloadIcon />
                  <div>
                    <div class="setting-label">{t(strategy.nameKey)}</div>
                    <div class="setting-sub">{t(strategy.subKey)}</div>
                  </div>
                </div>
                <ChevronRightIcon />
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

export default ExportAccounts;
