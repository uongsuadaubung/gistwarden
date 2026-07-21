import {
  type Component,
  createSignal,
  For,
  type JSX,
  onMount,
  Show,
} from "solid-js";
import { store } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { navigate } from "@/core/navigation.ts";
import { deleteItem } from "@/features/vault/vault-service.ts";
import { confirm, setGlobalLoading, showToast } from "@/core/ui-service.ts";
import {
  type CardVaultItem,
  CustomFieldType,
  type IdentityVaultItem,
  type LoginVaultItem,
  type SecureNoteVaultItem,
  type SshKeyVaultItem,
  type VaultField,
  type VaultItem,
  VaultItemType,
} from "@/core/types.ts";
import Button from "@/components/ui/Button.tsx";
import {
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  NoteIcon,
  TrashIcon,
} from "@/icons/svg/index.ts";
import { formatDateTime, t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { safeParseUrl } from "@/core/domain-utils.ts";
import LoginDetailFields from "@/features/vault/item-detail/LoginDetailFields.tsx";
import CardDetailFields from "@/features/vault/item-detail/CardDetailFields.tsx";
import NoteDetailFields from "@/features/vault/item-detail/NoteDetailFields.tsx";
import IdentityDetailFields from "@/features/vault/item-detail/IdentityDetailFields.tsx";
import SshKeyDetailFields from "@/features/vault/item-detail/SshKeyDetailFields.tsx";
import CardBrandIcon from "@/components/ui/CardBrandIcon.tsx";

const isLoginItem = (item: VaultItem): item is LoginVaultItem => {
  return Number(item.type) === VaultItemType.Login;
};

const isCardItem = (item: VaultItem): item is CardVaultItem => {
  return Number(item.type) === VaultItemType.Card;
};

const isNoteItem = (item: VaultItem): item is SecureNoteVaultItem => {
  return Number(item.type) === VaultItemType.SecureNote;
};

const isIdentityItem = (item: VaultItem): item is IdentityVaultItem => {
  return Number(item.type) === VaultItemType.Identity;
};

const isSshKeyItem = (item: VaultItem): item is SshKeyVaultItem => {
  return Number(item.type) === VaultItemType.SshKey;
};

const getDomain = (item: LoginVaultItem): string | null => {
  if (
    Number(item.type) !== VaultItemType.Login || !item.login.uris ||
    item.login.uris.length === 0
  ) {
    return null;
  }
  const uri = item.login.uris[0].uri;
  let hostname = uri;
  if (!/^https?:\/\//i.test(hostname)) {
    hostname = "http://" + hostname;
  }
  return safeParseUrl(hostname).map((url) => url.hostname).unwrapOr(null);
};

const Favicon: Component<{ domain: string; fallback: JSX.Element }> = (
  props,
) => {
  const [hasError, setHasError] = createSignal(false);
  return (
    <Show when={!hasError()} fallback={props.fallback}>
      <img
        src={`https://www.google.com/s2/favicons?domain=${props.domain}&sz=32`}
        alt=""
        onError={() => setHasError(true)}
      />
    </Show>
  );
};

export const ItemDetail: Component = () => {
  // Local view states
  const [name, setName] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [fields, setFields] = createSignal<VaultField[]>([]);
  const [visibleFields, setVisibleFields] = createSignal<
    Record<number, boolean>
  >({});
  const [error, setError] = createSignal("");

  // Populate form states on mount
  onMount(() => {
    const item = store.selectedItem;
    if (item) {
      setName(item.name || "");
      setNotes(item.notes || "");
      setFields(item.fields || []);
    }
  });

  const getCardItem = (): CardVaultItem | null => {
    const item = store.selectedItem;
    return item && isCardItem(item) ? item : null;
  };

  const getLoginItem = (): LoginVaultItem | null => {
    const item = store.selectedItem;
    return item && isLoginItem(item) ? item : null;
  };

  const getNoteItem = (): SecureNoteVaultItem | null => {
    const item = store.selectedItem;
    return item && isNoteItem(item) ? item : null;
  };

  const getIdentityItem = (): IdentityVaultItem | null => {
    const item = store.selectedItem;
    return item && isIdentityItem(item) ? item : null;
  };

  const getSshKeyItem = (): SshKeyVaultItem | null => {
    const item = store.selectedItem;
    return item && isSshKeyItem(item) ? item : null;
  };

  const toggleFieldVisibility = (index: number) => {
    setVisibleFields((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopy = async (text: string, _type: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    showToast(t("detail_copied"), "success");
  };

  const handleDelete = async () => {
    if (!store.selectedItem?.id) return;
    if (
      !(await confirm(
        t("edit_confirm_delete_title"),
        t("edit_confirm_delete_msg", { name: name() }),
        "danger",
      ))
    ) {
      return;
    }

    setGlobalLoading(true);
    setError("");
    const res = await deleteItem(store.selectedItem.id);
    setGlobalLoading(false);
    if (res.isOk()) {
      navigate(View.Vault);
    } else {
      setError(t(res.error));
    }
  };

  const handleBackToVault = () => {
    navigate(View.Vault);
  };

  const handleGoToEdit = () => {
    navigate(View.ItemEdit);
  };

  return (
    <div class="app-container h-full">
      <div class="detail-form">
        {/* Scrollable Body */}
        <div class="app-body pb-24">
          {/* Header */}
          <DetailHeader
            title={Number(store.selectedItem?.type) === VaultItemType.SecureNote
              ? t("detail_title_note")
              : Number(store.selectedItem?.type) === VaultItemType.Card
              ? t("detail_title_card")
              : Number(store.selectedItem?.type) === VaultItemType.Identity
              ? t("detail_title_identity")
              : Number(store.selectedItem?.type) === VaultItemType.SshKey
              ? t("detail_title_ssh_key")
              : t("detail_title_login")}
            onBack={handleBackToVault}
            showPopout
          />
          <Show when={error()}>
            <div class="alert alert-danger">{error()}</div>
          </Show>

          {/* Card Info Name (For all items) */}
          <Show when={store.selectedItem}>
            {(item) => {
              const getDetailIcon = () => {
                const currentItem = item();
                if (Number(currentItem.type) === VaultItemType.SecureNote) {
                  return <NoteIcon />;
                }
                if (isCardItem(currentItem)) {
                  return <CardBrandIcon brand={currentItem.card.brand || ""} />;
                }
                if (Number(currentItem.type) === VaultItemType.Identity) {
                  return <CardBrandIcon brand="" />;
                }
                if (Number(currentItem.type) === VaultItemType.SshKey) {
                  return <KeyIcon />;
                }
                // Login
                if (isLoginItem(currentItem)) {
                  const domainStr = getDomain(currentItem);
                  return (
                    <Show
                      when={domainStr}
                      fallback={<KeyIcon />}
                    >
                      {(dom) => (
                        <Favicon domain={dom()} fallback={<KeyIcon />} />
                      )}
                    </Show>
                  );
                }
                return <KeyIcon />;
              };

              return (
                <div class="card p-16 mb-16">
                  <div class="d-flex align-center gap-12">
                    <div class="item-icon-container item-icon-container-large">
                      {getDetailIcon()}
                    </div>
                    <div>
                      <div class="font-w-600 font-sz-16 text-break">
                        {item().name || t("detail_no_value")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          </Show>

          {/* Modular Type-Specific Fields */}
          <Show when={getCardItem()}>
            {(cardItem) => (
              <CardDetailFields
                item={cardItem()}
                onCopy={handleCopy}
              />
            )}
          </Show>
          <Show when={getLoginItem()}>
            {(loginItem) => (
              <LoginDetailFields
                item={loginItem()}
                onCopy={handleCopy}
              />
            )}
          </Show>
          <Show when={getNoteItem()}>
            {(noteItem) => (
              <NoteDetailFields
                item={noteItem()}
              />
            )}
          </Show>
          <Show when={getIdentityItem()}>
            {(identityItem) => (
              <IdentityDetailFields
                item={identityItem()}
                onCopy={handleCopy}
              />
            )}
          </Show>
          <Show when={getSshKeyItem()}>
            {(sshKeyItem) => (
              <SshKeyDetailFields
                item={sshKeyItem()}
                onCopy={handleCopy}
              />
            )}
          </Show>

          {/* Card 4: Custom Fields */}
          <Show when={fields().length > 0}>
            <div
              class={`detail-section-title ${
                store.selectedItem?.type === VaultItemType.SecureNote
                  ? "mt-0"
                  : "mt-16"
              }`}
            >
              {t("edit_label_fields")}
            </div>
            <div class="card mb-16">
              <For each={fields()}>
                {(field, index) => (
                  <Show
                    when={field.type === CustomFieldType.Divider}
                    fallback={
                      <div class="detail-row">
                        <div class="field-content">
                          <div class="field-label">
                            {field.name || t("edit_label_fields")}
                          </div>
                          <div class="field-value">
                            {field.type === CustomFieldType.Hidden
                              ? (visibleFields()[index()]
                                ? field.value
                                : "••••••••••••")
                              : field.value || t("detail_no_value")}
                          </div>
                        </div>
                        <div class="field-actions">
                          <Show when={field.type === CustomFieldType.Hidden}>
                            <button
                              type="button"
                              class="action-btn"
                              onClick={() => toggleFieldVisibility(index())}
                              title={t("edit_field_val_placeholder")}
                            >
                              <Show
                                when={visibleFields()[index()]}
                                fallback={<EyeIcon class="icon-inline" />}
                              >
                                <EyeOffIcon class="icon-inline" />
                              </Show>
                            </button>
                          </Show>
                          <Show when={field.value}>
                            <button
                              type="button"
                              class="action-btn"
                              onClick={() =>
                                handleCopy(
                                  field.value,
                                  field.name || "value",
                                )}
                              title={t("btn_copy")}
                            >
                              <CopyIcon />
                            </button>
                          </Show>
                        </div>
                      </div>
                    }
                  >
                    {/* Divider row */}
                    <div class="custom-field-divider">
                      <span>{field.name || "Divider"}</span>
                    </div>
                  </Show>
                )}
              </For>
            </div>
          </Show>

          {/* Card 5: Notes display (Only for Login & Card since Secure Note displays it above) */}
          <Show
            when={store.selectedItem?.type !== VaultItemType.SecureNote &&
              notes()}
          >
            <div
              class={`detail-section-title ${
                (store.selectedItem?.type === VaultItemType.SecureNote &&
                    fields().length === 0)
                  ? "mt-0"
                  : "mt-16"
              }`}
            >
              {t("edit_label_notes")}
            </div>
            <div class="card mb-16">
              <div class="notes-display">{notes()}</div>
            </div>
          </Show>

          {/* Card 6: Item history */}
          <Show when={store.selectedItem}>
            {(item) => (
              <>
                <div class="detail-section-title mt-16">
                  {t("detail_item_history")}
                </div>
                <div class="card mb-16 p-16 font-sz-12 text-muted">
                  <div class="py-6 d-flex align-center gap-8">
                    <span>{t("detail_revision_date")}:</span>
                    <span class="font-w-500 text-normal">
                      {formatDateTime(item().revisionDate)}
                    </span>
                  </div>
                  <div class="py-6 d-flex align-center gap-8">
                    <span>{t("detail_creation_date")}:</span>
                    <span class="font-w-500 text-normal">
                      {formatDateTime(item().creationDate)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </Show>
        </div>

        {/* Footer: Sửa và Xóa */}
        <div class="detail-footer-bar">
          <Button
            type="button"
            variant="primary"
            onClick={handleGoToEdit}
          >
            {t("btn_edit")}
          </Button>
          <button
            type="button"
            class="detail-delete-btn"
            onClick={handleDelete}
            title={t("btn_delete")}
          >
            <TrashIcon class="icon-inline-large" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ItemDetail;
