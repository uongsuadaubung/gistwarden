import { isLoginItem, type LoginVaultItem, View } from "@gistwarden/domain";
import { type Component, createMemo, For } from "solid-js";
import { t } from "@/core/i18n.ts";
import { navigate, selectItem } from "@/core/navigation.ts";
import { accountStore } from "@/core/store.ts";
import { RepeatKeyIcon } from "@/icons/svg/index.ts";
import { ReportLayout } from "./components/ReportLayout.tsx";
import { formatVaultItemUsername } from "./reports-service.ts";

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
        pwdMap.get(pwd)?.push(item);
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
    selectItem(item, View.ItemEdit);
  };

  return (
    <ReportLayout<ReusedGroup>
      titleKey="report_reused_title"
      descKey="report_reused_desc"
      items={reusedGroups()}
      cleanMsgKey="report_reused_clean_msg"
      cleanIcon={<RepeatKeyIcon />}
      renderItem={(group, index) => (
        <div class="group-card mb-3">
          <div class="group-header flex-align-center gap-2">
            <div class="text-warning">
              <RepeatKeyIcon />
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
                      {formatVaultItemUsername(item)}
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
    />
  );
};

export default ReportReused;
