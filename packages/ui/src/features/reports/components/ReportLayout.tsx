import { View } from "@gistwarden/domain";
import { createEffect, For, type JSX, Show } from "solid-js";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { type TranslationKey, t } from "@/core/i18n.ts";
import { goBack, navigate } from "@/core/navigation.ts";
import { DownloadIcon, SyncIcon } from "@/icons/svg/index.ts";

export interface ReportLayoutProps<T> {
  titleKey: TranslationKey;
  descKey: TranslationKey;
  itemCount?: number;
  items?: T[];
  isScanning?: boolean;
  progress?: number;
  scanButtonTextKey?: TranslationKey;
  scanButtonIcon?: JSX.Element;
  onStartScan?: () => void;
  errorMessage?: string | null;
  hasScanned?: boolean;
  cleanMsgKey: TranslationKey;
  cleanIcon?: JSX.Element;
  foundMsgKey?: TranslationKey;
  exportFileName?: string;
  renderExportRows?: (items: T[]) => string;
  renderItem?: (item: T, index: () => number) => JSX.Element;
  children?: JSX.Element;
}

export function ReportLayout<T>(props: ReportLayoutProps<T>): JSX.Element {
  const title = () => {
    const baseTitle = t(props.titleKey);
    if (props.itemCount !== undefined && props.itemCount > 0) {
      return `${baseTitle} (${props.itemCount})`;
    }
    return baseTitle;
  };

  const handleExportHtml = () => {
    if (!props.items || props.items.length === 0 || !props.renderExportRows) {
      return;
    }
    const results = props.items;
    const dateStr = new Date().toLocaleString();
    const rowsHtml = props.renderExportRows(results);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t("report_export_title")}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: var(--bg, #0f172b); color: var(--text, #f7f9fa); padding: 30px; margin: 0; }
    .container { max-width: 800px; margin: 0 auto; background-color: var(--surface, #1d293d); border: 1px solid var(--border, #314158); border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border, #314158); padding-bottom: 16px; margin-bottom: 20px; }
    .title { font-size: 20px; font-weight: bold; color: var(--primary-accent, #65abff); margin: 0; }
    .meta { font-size: 12px; color: var(--text-muted, #8496b0); }
    .summary { background-color: var(--error-translucent-15, rgba(255, 78, 99, 0.15)); border: 1px solid var(--error-translucent-30, rgba(255, 78, 99, 0.3)); border-radius: 8px; padding: 12px 16px; color: var(--error, #ff4e63); font-weight: bold; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 10px; border-bottom: 2px solid var(--border, #314158); color: var(--text-muted, #8496b0); font-size: 12px; text-transform: uppercase; }
    .footer { margin-top: 24px; text-align: center; font-size: 12px; color: var(--text-muted, #8496b0); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="title" style="display: flex; align-items: center; gap: 8px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
          ${t("report_export_heading")}
        </h1>
        <div class="meta">${t("report_export_meta")}</div>
      </div>
      <div class="meta">${dateStr}</div>
    </div>
    <div class="summary" style="display: flex; align-items: center; gap: 8px;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <span>${t("report_export_summary").replace("{count}", results.length.toString())}</span>
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
    a.download = props.exportFileName || `Gistwarden_Report_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div class="page-container report-detail-view">
      <DetailHeader title={title()} onBack={() => goBack(View.Reports)} />

      <p class="page-subtitle text-muted mt-2 mb-3">{t(props.descKey)}</p>

      {/* Action Button & Progress */}
      <Show when={props.onStartScan}>
        <div class="card p-3 mb-3">
          <button
            class="btn btn-primary w-100 flex-center gap-2"
            onClick={props.onStartScan}
            disabled={props.isScanning}
          >
            <Show when={props.isScanning} fallback={props.scanButtonIcon}>
              <SyncIcon class="spinning" />
            </Show>
            {props.isScanning
              ? t("report_scanning_progress").replace(
                  "{progress}",
                  (props.progress ?? 0).toString(),
                )
              : props.scanButtonTextKey
                ? t(props.scanButtonTextKey)
                : ""}
          </button>

          <Show when={props.isScanning}>
            <div class="progress-bar-container mt-3">
              <div
                class="progress-bar-fill"
                ref={(el) => {
                  createEffect(() => {
                    el.style.width = `${props.progress ?? 0}%`;
                  });
                }}
              />
            </div>
          </Show>
        </div>
      </Show>

      {/* Error Message */}
      <Show when={props.errorMessage}>
        <div class="alert alert-warning mb-3">{props.errorMessage}</div>
      </Show>

      {/* Custom Children Content */}
      {props.children}

      {/* Item List or Empty State */}
      <Show when={props.hasScanned ?? true}>
        <Show
          when={props.items && props.items.length > 0}
          fallback={
            <div class="empty-state text-center p-4 card mt-3">
              <Show when={props.cleanIcon}>
                <div class="empty-state-icon mb-2">{props.cleanIcon}</div>
              </Show>
              <p class="text-muted fw-medium">{t(props.cleanMsgKey)}</p>
            </div>
          }
        >
          <Show when={props.foundMsgKey}>
            <div class="alert alert-danger mb-2 w-100">
              {t(props.foundMsgKey!).replace(
                "{count}",
                (props.items?.length ?? 0).toString(),
              )}
            </div>
          </Show>

          <Show when={props.renderExportRows}>
            <div class="export-actions-row">
              <span class="text-muted text-sm fw-medium">
                {t(props.foundMsgKey || props.cleanMsgKey).replace(
                  "{count}",
                  (props.items?.length ?? 0).toString(),
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
          </Show>

          <Show when={props.renderItem}>
            <div class="item-list mt-2">
              <For each={props.items}>
                {(item, index) => props.renderItem?.(item, index)}
              </For>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  );
}
