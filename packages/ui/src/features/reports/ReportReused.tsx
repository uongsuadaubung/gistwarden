import { type Component, createMemo, For, Show } from "solid-js";
import { isLoginItem, type LoginVaultItem, View } from "@gistwarden/domain";
import { accountStore } from "@/core/store.ts";
import { navigate, selectItem } from "@/core/navigation.ts";
import { t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { KeyIcon, ShieldIcon } from "@/icons/svg/index.ts";

interface ReusedGroup {
  passwordHashKey: string;
  items: LoginVaultItem[];
}

export const ReportReused: Component = () => {
  const reusedGroups = createMemo<ReusedGroup[]>(() => {
    const items = (accountStore.vaultItems || []).filter(isLoginItem);
    const pwdMap = new Map<string, LoginVaultItem[]>();

    for (const item of items) {
      const pwd = item.login?.password;
      if (pwd && pwd.trim().length > 0) {
        if (!pwdMap.has(pwd)) {
          pwdMap.set(pwd, []);
        }
        pwdMap.get(pwd)!.push(item);
      }
    }

    const groups: ReusedGroup[] = [];
    let groupIndex = 1;
    for (const [_, list] of pwdMap.entries()) {
      if (list.length > 1) {
        groups.push({
          passwordHashKey: `group-${groupIndex++}`,
          items: list,
        });
      }
    }
    return groups;
  });

  const handleEditItem = (item: LoginVaultItem) => {
    selectItem(item);
    navigate(View.ItemEdit);
  };

  return (
    <div class="page-container report-detail-view">
      <DetailHeader
        title={t("report_reused_title")}
        onBack={() => navigate(View.Reports)}
      />

      <p class="page-subtitle text-muted mt-2 mb-3">
        {t("report_reused_desc")}
      </p>

      <Show
        when={reusedGroups().length > 0}
        fallback={
          <div class="empty-state text-center p-4">
            <div class="empty-state-icon mb-2">
              <ShieldIcon />
            </div>
            <p class="text-muted fw-medium">
              {t("report_reused_clean_msg")}
            </p>
          </div>
        }
      >
        <div class="reused-groups-list">
          <For each={reusedGroups()}>
            {(group, index) => (
              <div class="group-card">
                <div class="group-header flex-align-center gap-2">
                  <div class="text-warning">
                    <KeyIcon />
                  </div>
                  <h4 class="group-title">
                    {t("report_reused_group_title")
                      .replace("{index}", (index() + 1).toString())
                      .replace("{count}", group.items.length.toString())}
                  </h4>
                </div>

                <div class="group-items">
                  <For each={group.items}>
                    {(item) => (
                      <div class="item-row flex-between align-center">
                        <div class="item-info">
                          <div class="fw-semibold">{item.name}</div>
                          <div class="text-muted text-sm">
                            {item.login.username || t("report_no_username")}
                          </div>
                        </div>
                        <button
                          class="btn btn-outline-primary btn-sm"
                          onClick={() => handleEditItem(item)}
                        >
                          {t("report_reused_btn_change")}
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default ReportReused;
