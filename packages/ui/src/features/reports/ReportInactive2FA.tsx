import { isLoginItem, type LoginVaultItem, View } from "@gistwarden/domain";
import { type Component, createMemo } from "solid-js";
import { t } from "@/core/i18n.ts";
import { navigate, selectItem } from "@/core/navigation.ts";
import { accountStore } from "@/core/store.ts";
import { ReportLayout } from "./components/ReportLayout.tsx";
import { formatVaultItemUsername } from "./reports-service.ts";

export const ReportInactive2FA: Component = () => {
  const inactiveItems = createMemo<LoginVaultItem[]>(() => {
    const items = (accountStore.vaultItems || []).filter(isLoginItem);
    return items.filter((item) => {
      const hasTotp = !!(item.login?.totp && item.login.totp.trim().length > 0);
      const hasPasskey = !!(
        item.login?.fido2Credentials && item.login.fido2Credentials.length > 0
      );
      return !hasTotp && !hasPasskey;
    });
  });

  const handleEditItem = (item: LoginVaultItem) => {
    selectItem(item, View.ItemEdit);
  };

  return (
    <ReportLayout<LoginVaultItem>
      titleKey="report_inactive_2fa_title"
      descKey="report_inactive_2fa_desc"
      itemCount={inactiveItems().length}
      items={inactiveItems()}
      cleanMsgKey="report_inactive_2fa_clean_msg"
      renderItem={(item) => (
        <div class="item-row flex-between align-center">
          <div class="item-info">
            <div class="fw-bold">{item.name}</div>
            <div class="text-muted text-sm">
              {formatVaultItemUsername(item)}
            </div>
          </div>
          <button
            class="btn btn-outline-primary btn-sm"
            onClick={() => handleEditItem(item)}
          >
            {t("report_inactive_2fa_btn_setup")}
          </button>
        </div>
      )}
    />
  );
};

export default ReportInactive2FA;
