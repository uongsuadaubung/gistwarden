import { type LoginVaultItem, View } from "@gistwarden/domain";
import { setGlobalLoading } from "@gistwarden/ui";
import { type Component, createMemo } from "solid-js";
import { t } from "@/core/i18n.ts";
import { navigate, selectItem } from "@/core/navigation.ts";
import { accountStore } from "@/core/store.ts";
import { ReportLayout } from "./components/ReportLayout.tsx";
import {
  getUnsecureLoginItems,
  upgradeLoginItemToHttps,
} from "./reports-service.ts";

export const ReportUnsecure: Component = () => {
  const unsecureItems = createMemo<LoginVaultItem[]>(() =>
    getUnsecureLoginItems(accountStore.vaultItems),
  );

  const handleUpgradeHttps = async (item: LoginVaultItem) => {
    setGlobalLoading(true);
    try {
      await upgradeLoginItemToHttps(item);
    } catch (err) {
      console.error("[ReportUnsecure] Upgrade to HTTPS failed:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleEditItem = (item: LoginVaultItem) => {
    selectItem(item, View.ItemEdit);
  };

  return (
    <ReportLayout<LoginVaultItem>
      titleKey="report_unsecure_title"
      descKey="report_unsecure_desc"
      itemCount={unsecureItems().length}
      items={unsecureItems()}
      cleanMsgKey="report_unsecure_clean_msg"
      renderItem={(item) => (
        <div class="item-row flex-between align-center">
          <div class="item-info">
            <div class="fw-bold">{item.name}</div>
            <div
              class="text-muted text-sm font-monospace"
              title={item.login.uris?.[0]?.uri || ""}
            >
              {item.login.uris?.[0]?.uri || t("report_no_uri")}
            </div>
          </div>
          <div class="item-actions">
            <button
              class="btn btn-outline-primary btn-sm"
              onClick={() => handleUpgradeHttps(item)}
            >
              {t("report_unsecure_btn_upgrade")}
            </button>
            <button
              class="btn btn-secondary btn-sm"
              onClick={() => handleEditItem(item)}
            >
              {t("btn_edit")}
            </button>
          </div>
        </div>
      )}
    />
  );
};

export default ReportUnsecure;
