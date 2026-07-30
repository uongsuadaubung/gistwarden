import { type Component, createMemo, For, Show } from "solid-js";
import { isLoginItem, type LoginVaultItem, View } from "@gistwarden/domain";
import { accountStore } from "@/core/store.ts";
import { navigate, selectItem } from "@/core/navigation.ts";
import { t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { GlobeIcon, ShieldIcon } from "@/icons/svg/index.ts";
import { saveItem } from "@/features/vault/vault-service.ts";
import { setGlobalLoading } from "@gistwarden/ui";

export const ReportUnsecure: Component = () => {
  const unsecureItems = createMemo<LoginVaultItem[]>(() => {
    const items = (accountStore.vaultItems || []).filter(isLoginItem);
    return items.filter((item) => {
      const uris = item.login?.uris || [];
      return uris.some((u) =>
        u.uri && u.uri.trim().toLowerCase().startsWith("http://")
      );
    });
  });

  const handleUpgradeHttps = async (item: LoginVaultItem) => {
    if (!item.login?.uris) return;

    setGlobalLoading(true);
    try {
      const updatedUris = item.login.uris.map((u) => {
        if (u.uri && u.uri.trim().toLowerCase().startsWith("http://")) {
          return {
            ...u,
            uri: u.uri.replace(/^http:\/\//i, "https://"),
          };
        }
        return u;
      });

      const updatedItem: LoginVaultItem = {
        ...item,
        revisionDate: new Date().toISOString(),
        login: {
          ...item.login,
          uris: updatedUris,
        },
      };

      await saveItem(updatedItem);
    } catch (err) {
      console.error("[ReportUnsecure] Upgrade to HTTPS failed:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleEditItem = (item: LoginVaultItem) => {
    selectItem(item);
    navigate(View.ItemEdit);
  };

  const titleWithCount = () => {
    const count = unsecureItems().length;
    return count > 0
      ? `${t("report_unsecure_title")} (${count})`
      : t("report_unsecure_title");
  };

  return (
    <div class="page-container report-detail-view">
      <DetailHeader
        title={titleWithCount()}
        onBack={() => navigate(View.Reports)}
      />

      <p class="page-subtitle text-muted mt-2 mb-3">
        {t("report_unsecure_desc")}
      </p>

      <Show
        when={unsecureItems().length > 0}
        fallback={
          <div class="empty-state text-center p-4 card mt-3">
            <div class="empty-state-icon mb-2">
              <ShieldIcon />
            </div>
            <p class="text-muted fw-medium">
              {t("report_unsecure_clean_msg")}
            </p>
          </div>
        }
      >
        <div class="unsecure-items-list mt-2">
          <For each={unsecureItems()}>
            {(item) => (
              <div class="item-row flex-between align-center">
                <div class="item-info">
                  <div class="fw-bold flex-align-center gap-1">
                    <span class="text-info">
                      <GlobeIcon />
                    </span>
                    {item.name}
                  </div>
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
          </For>
        </div>
      </Show>
    </div>
  );
};

export default ReportUnsecure;
