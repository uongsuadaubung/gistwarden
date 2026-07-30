import { type Component, createMemo, For, Show } from "solid-js";
import { isLoginItem, type LoginVaultItem, View } from "@gistwarden/domain";
import { accountStore } from "@/core/store.ts";
import { navigate, selectItem } from "@/core/navigation.ts";
import { t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { LockIcon, ShieldIcon } from "@/icons/svg/index.ts";
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
    selectItem(item);
    navigate(View.ItemEdit);
  };

  const titleWithCount = () => {
    const count = inactiveItems().length;
    return count > 0
      ? `${t("report_inactive_2fa_title")} (${count})`
      : t("report_inactive_2fa_title");
  };

  return (
    <div class="page-container report-detail-view">
      <DetailHeader
        title={titleWithCount()}
        onBack={() => navigate(View.Reports)}
      />

      <p class="page-subtitle text-muted mt-2 mb-3">
        {t("report_inactive_2fa_desc")}
      </p>

      <Show
        when={inactiveItems().length > 0}
        fallback={
          <div class="empty-state text-center p-4 card mt-3">
            <div class="empty-state-icon mb-2">
              <ShieldIcon />
            </div>
            <p class="text-muted fw-medium">
              {t("report_inactive_2fa_clean_msg")}
            </p>
          </div>
        }
      >
        <div class="inactive-items-list mt-2">
          <For each={inactiveItems()}>
            {(item) => (
              <div class="item-row flex-between align-center">
                <div class="item-info">
                  <div class="fw-bold flex-align-center gap-1">
                    <span class="text-purple">
                      <LockIcon />
                    </span>
                    {item.name}
                  </div>
                  <div class="text-muted text-sm">
                    {formatVaultItemUsername(item)}
                  </div>
                  <div class="badge badge-secondary mt-1">
                    {t("report_inactive_2fa_badge")}
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
          </For>
        </div>
      </Show>
    </div>
  );
};

export default ReportInactive2FA;
