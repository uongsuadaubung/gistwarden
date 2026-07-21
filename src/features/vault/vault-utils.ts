import { t } from "@/core/i18n.ts";
import { type VaultItem, VaultItemType, View } from "@/core/types.ts";
import { confirm, setGlobalLoading, showToast } from "@/core/ui-service.ts";
import { deleteItem } from "@/features/vault/vault-service.ts";
import { navigate } from "@/core/navigation.ts";

export const getVaultItemTypeLabel = (type: VaultItemType | "all") => {
  switch (type) {
    case VaultItemType.Login:
      return t("vault_item_login");
    case VaultItemType.Card:
      return t("vault_item_card");
    case VaultItemType.Identity:
      return t("vault_item_identity");
    case VaultItemType.SecureNote:
      return t("vault_item_note");
    case VaultItemType.SshKey:
      return t("vault_item_ssh_key");
    default:
      return t("vault_filter_type");
  }
};

export const getVaultItemTitle = (type: VaultItemType, isEdit = false) => {
  if (isEdit) {
    switch (type) {
      case VaultItemType.SecureNote:
        return t("edit_title_edit_note");
      case VaultItemType.Card:
        return t("edit_title_edit_card");
      case VaultItemType.Identity:
        return t("edit_title_edit_identity");
      case VaultItemType.SshKey:
        return t("edit_title_edit_ssh_key");
      default:
        return t("edit_title_edit_login");
    }
  } else {
    switch (type) {
      case VaultItemType.SecureNote:
        return t("edit_title_add_note");
      case VaultItemType.Card:
        return t("edit_title_add_card");
      case VaultItemType.Identity:
        return t("edit_title_add_identity");
      case VaultItemType.SshKey:
        return t("edit_title_add_ssh_key");
      default:
        return t("edit_title_add_login");
    }
  }
};

export const getVaultItemToastMsg = (type: VaultItemType, isEdit = false) => {
  if (isEdit) {
    switch (type) {
      case VaultItemType.SecureNote:
        return t("edit_toast_updated_note");
      case VaultItemType.Card:
        return t("edit_toast_updated_card");
      case VaultItemType.Identity:
        return t("edit_toast_updated_identity");
      case VaultItemType.SshKey:
        return t("edit_toast_updated_ssh_key");
      default:
        return t("edit_toast_updated_login");
    }
  } else {
    switch (type) {
      case VaultItemType.SecureNote:
        return t("edit_toast_created_note");
      case VaultItemType.Card:
        return t("edit_toast_created_card");
      case VaultItemType.Identity:
        return t("edit_toast_created_identity");
      case VaultItemType.SshKey:
        return t("edit_toast_created_ssh_key");
      default:
        return t("edit_toast_created_login");
    }
  }
};

export const getVaultItemDetailTitle = (type: VaultItemType | undefined) => {
  switch (Number(type)) {
    case VaultItemType.SecureNote:
      return t("detail_title_note");
    case VaultItemType.Card:
      return t("detail_title_card");
    case VaultItemType.Identity:
      return t("detail_title_identity");
    case VaultItemType.SshKey:
      return t("detail_title_ssh_key");
    default:
      return t("detail_title_login");
  }
};

export const deleteVaultItemWithConfirm = async (
  item: VaultItem,
  onSuccess?: () => void,
) => {
  const confirmed = await confirm(
    t("edit_confirm_delete_title"),
    t("edit_confirm_delete_msg", { name: item.name }),
    "danger",
  );
  if (!confirmed) return false;

  setGlobalLoading(true);
  const res = await deleteItem(item.id);
  setGlobalLoading(false);

  if (res.isOk()) {
    showToast(t("toast_success"), "success");
    if (onSuccess) {
      onSuccess();
    } else {
      navigate(View.Vault);
    }
    return true;
  } else {
    showToast(t(res.error) || t("toast_error"), "error");
    return false;
  }
};
