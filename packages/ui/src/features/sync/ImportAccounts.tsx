import { setGlobalLoading, showToast } from "@gistwarden/ui";
import { type Component, createSignal, For, Show } from "solid-js";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { t } from "@/core/i18n.ts";
import { goBack, navigate } from "@/core/navigation.ts";
import { View } from "@/core/types.ts";
import { importVaultData } from "@/features/sync/import-service.ts";
import { ChevronRightIcon, UploadIcon } from "@/icons/svg/index.ts";
import { getAllImportStrategies } from "./import-export-registry.ts";
import type { ImportStrategy } from "./import-export-types.ts";

export const ImportAccounts: Component = () => {
  const [error, setError] = createSignal("");
  const [activeStrategy, setActiveStrategy] =
    createSignal<ImportStrategy | null>(null);
  let fileInputRef: HTMLInputElement | undefined;

  const handleBack = () => {
    goBack(View.VaultOptions);
  };

  const handleStrategyClick = (strategy: ImportStrategy) => {
    setError("");
    setActiveStrategy(strategy);
    if (fileInputRef) {
      fileInputRef.accept = strategy.extension;
      fileInputRef.click();
    }
  };

  const handleFileChange = (e: Event) => {
    const strategy = activeStrategy();
    if (!strategy) return;
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    const file = target.files?.[0];
    if (!file) return;

    setError("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result;
      if (typeof result !== "string") return;

      setGlobalLoading(true, t("vault_importing"));
      const res = await importVaultData(result, strategy.id);
      setGlobalLoading(false);

      if (res.isOk()) {
        showToast(t("vault_import_success", { count: res.value }), "success");
        navigate(View.Vault);
      } else {
        setError(t(res.error));
      }

      if (fileInputRef) fileInputRef.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div class="app-container">
      <div class="app-body">
        {/* Header */}
        <DetailHeader
          title={t("settings_import_accounts_title")}
          onBack={handleBack}
        />

        <Show when={error()}>
          <div class="alert alert-danger">{error()}</div>
        </Show>

        <input
          type="file"
          ref={fileInputRef}
          class="d-none"
          onChange={handleFileChange}
        />

        <div class="card card-list">
          <For each={getAllImportStrategies()}>
            {(strategy) => (
              <div
                class="setting-row"
                onClick={() => handleStrategyClick(strategy)}
              >
                <div class="setting-row-left">
                  <UploadIcon />
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

export default ImportAccounts;
