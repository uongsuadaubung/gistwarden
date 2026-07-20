import { type Component, createSignal, Show } from "solid-js";
import { View } from "@/core/types.ts";
import { navigate } from "@/core/navigation.ts";
import {
  importCsvData,
  importJsonData,
} from "@/features/sync/import-service.ts";
import { showToast } from "@/core/ui-service.ts";
import { ChevronRightIcon, UploadIcon } from "@/icons/svg/index.ts";
import { t, type TranslationKey } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";

export const ImportAccounts: Component = () => {
  const [error, setError] = createSignal("");
  const [_loading, setLoading] = createSignal(false);

  let browserInputRef: HTMLInputElement | undefined;
  let bitwardenInputRef: HTMLInputElement | undefined;
  let jsonInputRef: HTMLInputElement | undefined;

  const handleBack = () => {
    navigate(View.VaultOptions);
  };

  const handleImportClick = (type: "browser" | "bitwarden" | "json") => {
    setError("");
    if (type === "browser") {
      browserInputRef?.click();
    } else if (type === "bitwarden") {
      bitwardenInputRef?.click();
    } else {
      jsonInputRef?.click();
    }
  };

  const handleFileChange = (
    e: Event,
    type: "browser" | "bitwarden" | "json",
  ) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    const file = target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result;
      if (typeof result !== "string") return;
      const text = result;
      try {
        let res;
        if (type === "json") {
          res = await importJsonData(text);
        } else {
          res = await importCsvData(text, type);
        }

        if (res.success) {
          showToast(
            t("vault_import_success", { count: res.importedCount ?? 0 }),
            "success",
          );
          navigate(View.Vault);
        } else {
          let errorKey: TranslationKey;
          if (type === "json") {
            errorKey = "vault_import_error_invalid";
          } else if (type === "browser") {
            errorKey = "import_error_browser_invalid";
          } else {
            errorKey = "import_error_bitwarden_invalid";
          }
          setError(res.error || t(errorKey));
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const genericErrorKey: TranslationKey = type === "json"
          ? "vault_import_error_fail"
          : "vault_import_csv_error_fail";
        setError(errMsg || t(genericErrorKey));
      } finally {
        setLoading(false);
        // Reset file inputs
        if (browserInputRef) browserInputRef.value = "";
        if (bitwardenInputRef) bitwardenInputRef.value = "";
        if (jsonInputRef) jsonInputRef.value = "";
      }
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

        <div class="card card-list">
          {/* Browser CSV */}
          <div class="setting-row" onClick={() => handleImportClick("browser")}>
            <div class="setting-row-left">
              <UploadIcon />
              <div>
                <div class="setting-label">{t("import_option_browser")}</div>
                <div class="setting-sub">{t("import_option_browser_sub")}</div>
              </div>
            </div>
            <ChevronRightIcon />
            <input
              type="file"
              ref={browserInputRef}
              accept=".csv"
              class="d-none"
              onChange={(e) => handleFileChange(e, "browser")}
            />
          </div>

          {/* Bitwarden CSV */}
          <div
            class="setting-row"
            onClick={() => handleImportClick("bitwarden")}
          >
            <div class="setting-row-left">
              <UploadIcon />
              <div>
                <div class="setting-label">
                  {t("import_option_bitwarden_csv")}
                </div>
                <div class="setting-sub">
                  {t("import_option_bitwarden_csv_sub")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
            <input
              type="file"
              ref={bitwardenInputRef}
              accept=".csv"
              class="d-none"
              onChange={(e) => handleFileChange(e, "bitwarden")}
            />
          </div>

          {/* JSON Backup */}
          <div class="setting-row" onClick={() => handleImportClick("json")}>
            <div class="setting-row-left">
              <UploadIcon />
              <div>
                <div class="setting-label">{t("import_option_json")}</div>
                <div class="setting-sub">{t("import_option_json_sub")}</div>
              </div>
            </div>
            <ChevronRightIcon />
            <input
              type="file"
              ref={jsonInputRef}
              accept=".json"
              class="d-none"
              onChange={(e) => handleFileChange(e, "json")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportAccounts;
