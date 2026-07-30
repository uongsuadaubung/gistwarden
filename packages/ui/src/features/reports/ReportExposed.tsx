import {
  type Component,
  createEffect,
  createSignal,
  For,
  Show,
} from "solid-js";
import { isLoginItem, type LoginVaultItem, View } from "@gistwarden/domain";
import { accountStore } from "@/core/store.ts";
import { navigate, selectItem } from "@/core/navigation.ts";
import { t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { DownloadIcon, ShieldAlertIcon, SyncIcon } from "@/icons/svg/index.ts";
import {
  checkPasswordHIBPUseCase,
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
      const pwd = item.login.password!;
      let count = 0;

      if (cache.has(pwd)) {
        count = cache.get(pwd)!;
      } else {
        const checkRes = await checkPasswordHIBPUseCase(pwd);
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
    selectItem(item);
    navigate(View.ItemEdit);
  };

  const handleExportHtml = () => {
    const results = exposedResults();
    if (results.length === 0) return;

    const dateStr = new Date().toLocaleString();
    const rowsHtml = results
      .map(
        (res) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #334155; font-weight: bold; color: #f8fafc;">${res.item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #334155; color: #94a3b8;">${
          formatVaultItemUsername(res.item)
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #334155;">
          <span style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            ${
          t("report_exposed_times").replace(
            "{count}",
            res.count.toLocaleString(),
          )
        }
          </span>
        </td>
      </tr>
    `,
      )
      .join("");

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t("report_export_title")}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 30px; margin: 0; }
    .container { max-width: 800px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }
    .title { font-size: 20px; font-weight: bold; color: #38bdf8; margin: 0; }
    .meta { font-size: 12px; color: #94a3b8; }
    .summary { background-color: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 12px 16px; color: #fca5a5; font-weight: bold; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 10px; border-bottom: 2px solid #334155; color: #94a3b8; font-size: 12px; text-transform: uppercase; }
    .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="title">${t("report_export_heading")}</h1>
        <div class="meta">${t("report_export_meta")}</div>
      </div>
      <div class="meta">${dateStr}</div>
    </div>
    <div class="summary">
      ${
      t("report_export_summary").replace("{count}", results.length.toString())
    }
    </div>
    <table>
      <thead>
        <tr>
          <th>${t("report_export_col_account")}</th>
          <th>${t("report_export_col_username")}</th>
          <th>${t("report_export_col_exposure")}</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <div class="footer">
      ${t("report_export_footer")}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Gistwarden_Exposed_Passwords_Report_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div class="page-container report-detail-view">
      <DetailHeader
        title={t("report_exposed_title")}
        onBack={() => navigate(View.Reports)}
      />

      <p class="page-subtitle text-muted mt-2 mb-3">
        {t("report_exposed_desc")}
      </p>

      <div class="card p-3 mb-3">
        <button
          class="btn btn-primary w-100 flex-center gap-2"
          onClick={handleStartScan}
          disabled={isScanning()}
        >
          <Show when={isScanning()} fallback={<ShieldAlertIcon />}>
            <SyncIcon class="spinning" />
          </Show>
          {isScanning()
            ? t("report_scanning_progress").replace(
              "{progress}",
              progress().toString(),
            )
            : t("report_exposed_btn_check")}
        </button>

        <Show when={isScanning()}>
          <div class="progress-bar-container mt-3">
            <div
              class="progress-bar-fill"
              ref={(el) => {
                createEffect(() => {
                  el.style.width = `${progress()}%`;
                });
              }}
            />
          </div>
        </Show>
      </div>

      <Show when={errorMessage()}>
        <div class="alert alert-warning mb-3">{errorMessage()}</div>
      </Show>

      <Show when={hasScanned()}>
        <Show
          when={exposedResults().length > 0}
          fallback={
            <div class="empty-state text-center p-4 card">
              <div class="empty-state-icon mb-2">
                <ShieldAlertIcon />
              </div>
              <p class="text-muted fw-medium">
                {t("report_exposed_clean_msg")}
              </p>
            </div>
          }
        >
          <div class="alert alert-danger mb-2 w-100">
            {t("report_exposed_found_msg").replace(
              "{count}",
              exposedResults().length.toString(),
            )}
          </div>

          <div class="export-actions-row">
            <span class="text-muted text-sm fw-medium">
              {t("report_exposed_found_count").replace(
                "{count}",
                exposedResults().length.toString(),
              )}
            </span>
            <button
              class="btn btn-outline-primary btn-sm flex-align-center gap-1"
              onClick={handleExportHtml}
              title={t("report_export_btn")}
            >
              <DownloadIcon />
              {t("report_export_btn")}
            </button>
          </div>

          <div class="item-list">
            <For each={exposedResults()}>
              {(res) => (
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
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
};

export default ReportExposed;
