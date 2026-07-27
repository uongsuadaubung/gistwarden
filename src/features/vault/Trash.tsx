import { type Component, createSignal, For, Show } from "solid-js";
import { accountStore } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { navigate } from "@/core/navigation.ts";
import {
  purgeAllTrash,
  purgeTrashItem,
  restoreVaultItem,
} from "@/features/vault/vault-service.ts";
import {
  confirm,
  requestReprompt,
  setGlobalLoading,
  showToast,
} from "@/core/ui-service.ts";
import {
  CardIcon,
  IdentityIcon,
  KeyIcon,
  NoteIcon,
  RefreshIcon,
  TrashIcon,
  VaultIcon,
} from "@/icons/svg/index.ts";
import { t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { VaultItemType } from "@/features/vault/vault-types.ts";
import type { TrashVaultItem } from "@/features/vault/vault-schemas.ts";

export const Trash: Component = () => {
  const [error, setError] = createSignal("");

  const handleBack = () => {
    navigate(View.VaultOptions);
  };

  const handleRestore = async (id: string) => {
    setGlobalLoading(true, t("dialog_loading"));
    setError("");
    const res = await restoreVaultItem(id);
    setGlobalLoading(false);

    if (res.isOk()) {
      showToast(t("toast_success"), "success");
    } else {
      setError(t(res.error));
    }
  };

  const handlePurge = async (id: string) => {
    if (
      !(await confirm(
        t("trash_purge"),
        t("trash_confirm_purge_all_msg"),
        "danger",
      ))
    ) {
      return;
    }

    setGlobalLoading(true, t("dialog_loading"));
    setError("");
    const res = await purgeTrashItem(id);
    setGlobalLoading(false);

    if (res.isOk()) {
      showToast(t("toast_success"), "success");
    } else {
      setError(t(res.error));
    }
  };

  const handlePurgeAll = async () => {
    if (
      !(await confirm(
        t("trash_confirm_purge_all"),
        t("trash_confirm_purge_all_msg"),
        "danger",
      ))
    ) {
      return;
    }

    const verified = await requestReprompt();
    if (!verified) {
      return;
    }

    setGlobalLoading(true, t("dialog_loading"));
    setError("");
    const res = await purgeAllTrash();
    setGlobalLoading(false);

    if (res.isOk()) {
      showToast(t("toast_success"), "success");
    } else {
      setError(t(res.error));
    }
  };

  const getItemIcon = (type: VaultItemType) => {
    switch (type) {
      case VaultItemType.SecureNote:
        return <NoteIcon />;
      case VaultItemType.Card:
        return <CardIcon />;
      case VaultItemType.Identity:
        return <IdentityIcon />;
      case VaultItemType.SshKey:
        return <KeyIcon />;
      case VaultItemType.Login:
      default:
        return <VaultIcon />;
    }
  };

  const formatDate = (dateStr: string) => {
    const timestamp = Date.parse(dateStr);
    return Number.isNaN(timestamp)
      ? dateStr
      : new Date(timestamp).toLocaleString();
  };

  return (
    <div class="app-container">
      <div class="app-body">
        {/* Header */}
        <DetailHeader
          title={t("trash_title")}
          onBack={handleBack}
        />

        <Show when={error()}>
          <div class="alert alert-danger mb-14">{error()}</div>
        </Show>

        <Show
          when={(accountStore.trashItems || []).length > 0}
          fallback={
            <div class="trash-empty-state">
              <div class="empty-icon-wrap">
                <TrashIcon />
              </div>
              <div class="empty-title">{t("trash_empty")}</div>
              <div class="empty-sub">
                {t("vault_options_trash_sub")}
              </div>
            </div>
          }
        >
          {/* Header Bar Actions */}
          <div class="trash-page-header">
            <div class="trash-count-info">
              <span class="trash-count-pill">
                {(accountStore.trashItems || []).length}
              </span>
              <span>{t("trash_title")}</span>
            </div>

            <button
              class="btn-purge-all"
              onClick={handlePurgeAll}
              title={t("trash_purge_all")}
            >
              <TrashIcon />
              <span>{t("trash_purge_all")}</span>
            </button>
          </div>

          {/* List of Trash Items */}
          <div class="trash-list-card">
            <For each={accountStore.trashItems || []}>
              {(entry: TrashVaultItem) => (
                <div class="trash-item-row">
                  <div class="trash-item-icon">
                    {getItemIcon(entry.item.type)}
                  </div>

                  <div class="trash-item-meta">
                    <div class="trash-item-title text-truncate">
                      {entry.item.name || "Chưa đặt tên"}
                    </div>
                    <div class="trash-item-date text-truncate">
                      {t("trash_deleted_date")}: {formatDate(entry.deletedDate)}
                    </div>
                  </div>

                  <div class="trash-item-actions">
                    <button
                      class="btn-restore"
                      onClick={() => handleRestore(entry.item.id)}
                      title={t("trash_restore")}
                    >
                      <RefreshIcon />
                      <span>{t("trash_restore")}</span>
                    </button>

                    <button
                      class="btn-purge"
                      onClick={() => handlePurge(entry.item.id)}
                      title={t("trash_purge")}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Trash;
