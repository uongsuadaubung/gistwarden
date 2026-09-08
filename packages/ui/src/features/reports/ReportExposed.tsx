import { isLoginItem, type LoginVaultItem, View } from "@gistwarden/domain";
import { type Component, createSignal } from "solid-js";
import { t } from "@/core/i18n.ts";
import { navigate, selectItem } from "@/core/navigation.ts";
import { accountStore } from "@/core/store.ts";
import { ShieldAlertIcon } from "@/icons/svg/index.ts";
import { ReportLayout } from "./components/ReportLayout.tsx";
import {
  checkPasswordHIBP,
  formatVaultItemUsername,
} from "./reports-service.ts";

interface ExposedResult {
  item: LoginVaultItem;
  count: number;
}

export const ReportExposed: Component = () => {
  const [isScanning, setIsScanning] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  const [hasScanned, setHasScanned] = createSignal(false);
  const [exposedResults, setExposedResults] = createSignal<ExposedResult[]>([]);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  const handleStartScan = async () => {
    setIsScanning(true);
    setProgress(0);
    setHasScanned(false);
    setExposedResults([]);
    setErrorMessage(null);

    const items = (accountStore.vaultItems || []).filter(isLoginItem);
    const validItems = items.filter((item) => item.login?.password);
    const total = validItems.length;

    if (total === 0) {
      setIsScanning(false);
      setHasScanned(true);
      return;
    }

    const results: ExposedResult[] = [];
    const cache = new Map<string, number>();

    for (let i = 0; i < total; i++) {
      const item = validItems[i];
      if (!item) continue;
      const pwd = item.login.password!;
      let count = 0;

      if (cache.has(pwd)) {
        count = cache.get(pwd)!;
      } else {
        const checkRes = await checkPasswordHIBP(pwd);
        if (checkRes.errorKey) {
          setErrorMessage(t(checkRes.errorKey));
          setIsScanning(false);
          return;
        }
        count = checkRes.count;
        cache.set(pwd, count);
      }

      if (count > 0) {
        results.push({ item, count });
      }

      setProgress(Math.round(((i + 1) / total) * 100));
      await new Promise((r) => setTimeout(r, 50));
    }

    setExposedResults(results);
    setIsScanning(false);
    setHasScanned(true);
  };

  const handleEditItem = (item: LoginVaultItem) => {
    selectItem(item, View.ItemEdit);
  };

  return (
    <ReportLayout<ExposedResult>
      titleKey="report_exposed_title"
      descKey="report_exposed_desc"
      items={exposedResults()}
      isScanning={isScanning()}
      progress={progress()}
      hasScanned={hasScanned()}
      errorMessage={errorMessage()}
      cleanMsgKey="report_exposed_clean_msg"
      foundMsgKey="report_exposed_found_msg"
      scanButtonTextKey="report_exposed_btn_check"
      scanButtonIcon={<ShieldAlertIcon />}
      onStartScan={handleStartScan}
      exportFileName={`Gistwarden_Exposed_Passwords_Report_${Date.now()}.html`}
      renderExportRows={(results) =>
        results
          .map(
            (res) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid var(--border, #314158); font-weight: bold; color: var(--text, #f7f9fa);">${res.item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid var(--border, #314158); color: var(--text-muted, #8496b0);">${formatVaultItemUsername(res.item)}</td>
          <td style="padding: 10px; border-bottom: 1px solid var(--border, #314158);">
            <span style="background: var(--error-translucent-15, rgba(255, 78, 99, 0.15)); color: var(--error, #ff4e63); border: 1px solid var(--error-translucent-30, rgba(255, 78, 99, 0.3)); padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${t("report_exposed_times").replace("{count}", res.count.toLocaleString())}
            </span>
          </td>
        </tr>`,
          )
          .join("")
      }
      renderItem={(res) => (
        <div class="item-row flex-between align-center">
          <div class="item-info">
            <div class="fw-bold">{res.item.name}</div>
            <div class="text-muted text-sm">
              {formatVaultItemUsername(res.item)}
            </div>
            <div class="badge badge-danger mt-1">
              {t("report_exposed_times").replace(
                "{count}",
                res.count.toLocaleString(),
              )}
            </div>
          </div>
          <div class="item-actions">
            <button
              class="btn btn-outline-primary btn-sm"
              onClick={() => handleEditItem(res.item)}
            >
              {t("btn_edit")}
            </button>
          </div>
        </div>
      )}
    />
  );
};

export default ReportExposed;
