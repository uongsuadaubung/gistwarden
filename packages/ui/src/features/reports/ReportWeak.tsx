import {
  evaluatePasswordStrength,
  isLoginItem,
  type LoginVaultItem,
  type TranslationKey,
  View,
} from "@gistwarden/domain";
import { type Component, createMemo } from "solid-js";
import { t } from "@/core/i18n.ts";
import { navigate, selectItem } from "@/core/navigation.ts";
import { accountStore } from "@/core/store.ts";
import { GaugeIcon } from "@/icons/svg/index.ts";
import { ReportLayout } from "./components/ReportLayout.tsx";
import { formatVaultItemUsername } from "./reports-service.ts";

interface WeakResult {
  item: LoginVaultItem;
  score: number;
  scoreLabelKey: TranslationKey;
  badgeClass: string;
}

export const ReportWeak: Component = () => {
  const weakItems = createMemo<WeakResult[]>(() => {
    const items = (accountStore.vaultItems || []).filter(isLoginItem);
    const results: WeakResult[] = [];

    for (const item of items) {
      const pwd = item.login?.password || "";
      const res = evaluatePasswordStrength(pwd);

      if (res.score <= 2) {
        let labelKey: TranslationKey = "pwd_strength_weak";
        let badgeClass = "badge-danger";

        if (res.score === 0) {
          labelKey = "pwd_strength_very_weak";
          badgeClass = "badge-danger-dark";
        } else if (res.score === 1) {
          labelKey = "pwd_strength_weak";
          badgeClass = "badge-danger";
        } else if (res.score === 2) {
          labelKey = "pwd_strength_fair";
          badgeClass = "badge-warning";
        }

        results.push({
          item,
          score: res.score,
          scoreLabelKey: labelKey,
          badgeClass,
        });
      }
    }

    return results;
  });

  const handleEditItem = (item: LoginVaultItem) => {
    selectItem(item, View.ItemEdit);
  };

  return (
    <ReportLayout<WeakResult>
      titleKey="report_weak_title"
      descKey="report_weak_desc"
      itemCount={weakItems().length}
      items={weakItems()}
      cleanMsgKey="report_weak_clean_msg"
      cleanIcon={<GaugeIcon />}
      renderItem={(res) => (
        <div class="item-row flex-between align-center">
          <div class="item-info">
            <div class="fw-bold">{res.item.name}</div>
            <div class="text-muted text-sm">
              {formatVaultItemUsername(res.item)}
            </div>
            <div class={`badge ${res.badgeClass} mt-1`}>
              {t(res.scoreLabelKey)} (
              {t("report_score_label").replace(
                "{score}",
                (res.score + 1).toString(),
              )}
              )
            </div>
          </div>
          <button
            class="btn btn-outline-primary btn-sm"
            onClick={() => handleEditItem(res.item)}
          >
            {t("report_weak_btn_upgrade")}
          </button>
        </div>
      )}
    />
  );
};

export default ReportWeak;
