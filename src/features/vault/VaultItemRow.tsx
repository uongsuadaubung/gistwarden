import { type Component, Show } from "solid-js";
import {
  type CardVaultItem,
  type IdentityVaultItem,
  type SshKeyVaultItem,
  type VaultItem,
  VaultItemType,
  View,
} from "@/core/types.ts";
import {
  CopyIcon,
  ExternalLinkIcon,
  HeartFilledIcon,
  KeyIcon,
  MoreVerticalIcon,
  NoteIcon,
} from "@/icons/svg/index.ts";
import { openItem } from "@/core/navigation.ts";
import { openTab } from "@/core/tabs.ts";
import { t } from "@/core/i18n.ts";
import CardBrandIcon from "@/components/ui/CardBrandIcon.tsx";
import { getDomainFromItem } from "@/core/domain-utils.ts";
import Favicon from "@/components/ui/Favicon.tsx";
import { isCardItem, isIdentityItem, isSshKeyItem, isLoginItem } from "@/core/types.ts";

interface VaultItemRowProps {
  item: VaultItem;
  activeMenuId: string;
  activeOptionsMenuId: string;
  onToggleMenu: (itemId: string, e: MouseEvent) => void;
  onToggleOptionsMenu: (itemId: string, e: MouseEvent) => void;
  onCopyText: (text: string, type: string, e: MouseEvent) => void;
  onCopyTotpDirect: (item: VaultItem, e: MouseEvent) => void;
  onFavoriteItem: (item: VaultItem, e: MouseEvent) => void;
  onCloneItem: (item: VaultItem, e: MouseEvent) => void;
  onDeleteItem: (item: VaultItem, e: MouseEvent) => void;
  isSuggested?: boolean;
  onFillItem?: (item: VaultItem, e: MouseEvent) => void;
}

const getCardSub = (item: CardVaultItem): string => {
  const brand = item.card.brand || "Card";
  const number = item.card.number || "";
  const last4 = number.length > 4 ? number.slice(-4) : number;
  return `${brand}${last4 ? `, *${last4}` : ""}`;
};

const getIdentitySub = (item: IdentityVaultItem): string => {
  const first = item.identity.firstName || "";
  const last = item.identity.lastName || "";
  return `${first} ${last}`.trim() || t("detail_identity_title");
};

const getSshKeySub = (item: SshKeyVaultItem): string => {
  return item.sshKey.keyFingerprint || "SSH Key";
};

export const VaultItemRow: Component<VaultItemRowProps> = (props) => {
  const domain = () => getDomainFromItem(props.item);

  const getUri = (): string | null => {
    if (
      props.item.type === VaultItemType.Login &&
      props.item.login.uris &&
      props.item.login.uris.length > 0 &&
      props.item.login.uris[0].uri
    ) {
      return props.item.login.uris[0].uri;
    }
    return null;
  };

  return (
    <div
      class="vault-item-row"
      onClick={() => openItem(props.item, View.ItemDetail)}
    >
      {/* Icon Container */}
      <div class="item-icon-container">
        <Show when={Number(props.item.type) === VaultItemType.SecureNote}>
          <NoteIcon />
        </Show>
        <Show when={isCardItem(props.item) ? props.item : null}>
          {(cardItem) => <CardBrandIcon brand={cardItem().card.brand || ""} />}
        </Show>
        <Show when={Number(props.item.type) === VaultItemType.Identity}>
          <CardBrandIcon brand="" />
        </Show>
        <Show when={Number(props.item.type) === VaultItemType.SshKey}>
          <KeyIcon />
        </Show>
        <Show when={Number(props.item.type) === VaultItemType.Login}>
          <Show
            when={domain()}
            fallback={<KeyIcon />}
          >
            {(dom) => <Favicon domain={dom()} fallback={<KeyIcon />} />}
          </Show>
        </Show>
      </div>

      {/* Info Container */}
      <div class="item-info">
        <Show
          when={Number(props.item.type) === VaultItemType.SecureNote}
          fallback={
            <>
              <div class="item-name d-flex align-center gap-6">
                {props.item.name}
                <Show when={props.item.favorite}>
                  <HeartFilledIcon class="favorite-heart-icon" />
                </Show>
              </div>
              <div class="item-sub">
                <Show when={isCardItem(props.item) ? props.item : null}>
                  {(cardItem) => getCardSub(cardItem())}
                </Show>
                <Show when={isIdentityItem(props.item) ? props.item : null}>
                  {(identityItem) => getIdentitySub(identityItem())}
                </Show>
                <Show when={isSshKeyItem(props.item) ? props.item : null}>
                  {(sshItem) => getSshKeySub(sshItem())}
                </Show>
                <Show when={isLoginItem(props.item) ? props.item : null}>
                  {(loginItem) => (
                    <>
                      <Show
                        when={loginItem().login.fido2Credentials &&
                          loginItem().login.fido2Credentials!.length > 0}
                      >
                        <span class="passkey-badge">PASSKEY</span>
                      </Show>
                      {loginItem().login.username || t("vault_no_username")}
                    </>
                  )}
                </Show>
              </div>
            </>
          }
        >
          <div class="item-name d-flex align-center gap-6">
            {props.item.name}
            <Show when={props.item.favorite}>
              <HeartFilledIcon class="favorite-heart-icon" />
            </Show>
          </div>
        </Show>
      </div>

      {/* Options Copy Dropdown Button */}
      <div class="item-actions pos-relative">
        <Show
          when={props.isSuggested &&
            Number(props.item.type) === VaultItemType.Login}
        >
          <button
            type="button"
            class="fill-btn"
            onClick={(e) => {
              e.stopPropagation();
              props.onFillItem?.(props.item, e);
            }}
          >
            Fill
          </button>
        </Show>

        <Show when={getUri()}>
          {(uri) => (
            <button
              class="action-btn"
              title={t("detail_visit_website")}
              onClick={(e) => {
                e.stopPropagation();
                let url = uri();
                if (!/^https?:\/\//i.test(url)) {
                  url = "https://" + url;
                }
                openTab(url);
              }}
            >
              <ExternalLinkIcon />
            </button>
          )}
        </Show>

        <button
          class="action-btn"
          title={props.item.type === VaultItemType.SecureNote
            ? t("vault_copy_notes")
            : t("vault_copy_options")}
          onClick={(e) => {
            if (props.item.type === VaultItemType.SecureNote) {
              props.onCopyText(props.item.notes || "", t("edit_type_note"), e);
            } else {
              props.onToggleMenu(props.item.id, e);
            }
          }}
        >
          <CopyIcon />
        </button>

        <button
          class="action-btn"
          title={t("vault_menu_more")}
          onClick={(e) => props.onToggleOptionsMenu(props.item.id, e)}
        >
          <MoreVerticalIcon />
        </button>

        {/* Dropdown overlay */}
        <Show
          when={props.item.type !== VaultItemType.SecureNote &&
            props.activeMenuId === props.item.id}
        >
          <div class="copy-dropdown" onClick={(e) => e.stopPropagation()}>
            {/* Login Item Copy Actions */}
            <Show
              when={props.item.type === VaultItemType.Login &&
                props.item.login.username}
            >
              <div
                class="dropdown-item"
                onClick={(e) =>
                  props.onCopyText(
                    props.item.type === VaultItemType.Login &&
                        props.item.login.username || "",
                    t("edit_label_username"),
                    e,
                  )}
              >
                {t("detail_copy_username")}
              </div>
            </Show>
            <Show
              when={props.item.type === VaultItemType.Login &&
                props.item.login.password}
            >
              <div
                class="dropdown-item"
                onClick={(e) =>
                  props.onCopyText(
                    props.item.type === VaultItemType.Login &&
                        props.item.login.password || "",
                    t("edit_label_password"),
                    e,
                  )}
              >
                {t("detail_copy_password")}
              </div>
            </Show>
            <Show
              when={props.item.type === VaultItemType.Login &&
                props.item.login.totp}
            >
              <div
                class="dropdown-item"
                onClick={(e) => props.onCopyTotpDirect(props.item, e)}
              >
                {t("detail_copy_totp")}
              </div>
            </Show>

            {/* Card Item Copy Actions */}
            <Show
              when={isCardItem(props.item) ? props.item : null}
            >
              {(cardItem) => (
                <>
                  <Show when={cardItem().card.number}>
                    <div
                      class="dropdown-item"
                      onClick={(e) =>
                        props.onCopyText(
                          cardItem().card.number || "",
                          t("detail_copy_card_number"),
                          e,
                        )}
                    >
                      {t("detail_copy_card_number")}
                    </div>
                  </Show>
                  <Show when={cardItem().card.code}>
                    <div
                      class="dropdown-item"
                      onClick={(e) =>
                        props.onCopyText(
                          cardItem().card.code || "",
                          t("detail_copy_card_code"),
                          e,
                        )}
                    >
                      {t("detail_copy_card_code")}
                    </div>
                  </Show>
                </>
              )}
            </Show>

            {/* SSH Key Item Copy Actions */}
            <Show
              when={isSshKeyItem(props.item) ? props.item : null}
            >
              {(sshItem) => (
                <>
                  <Show when={sshItem().sshKey.privateKey}>
                    <div
                      class="dropdown-item"
                      onClick={(e) =>
                        props.onCopyText(
                          sshItem().sshKey.privateKey || "",
                          t("detail_copy_ssh_private_key"),
                          e,
                        )}
                    >
                      {t("detail_copy_ssh_private_key")}
                    </div>
                  </Show>
                  <Show when={sshItem().sshKey.publicKey}>
                    <div
                      class="dropdown-item"
                      onClick={(e) =>
                        props.onCopyText(
                          sshItem().sshKey.publicKey || "",
                          t("detail_copy_ssh_public_key"),
                          e,
                        )}
                    >
                      {t("detail_copy_ssh_public_key")}
                    </div>
                  </Show>
                  <Show when={sshItem().sshKey.keyFingerprint}>
                    <div
                      class="dropdown-item"
                      onClick={(e) =>
                        props.onCopyText(
                          sshItem().sshKey.keyFingerprint || "",
                          t("detail_copy_ssh_fingerprint"),
                          e,
                        )}
                    >
                      {t("detail_copy_ssh_fingerprint")}
                    </div>
                  </Show>
                </>
              )}
            </Show>
          </div>
        </Show>

        {/* Options Dropdown overlay */}
        <Show when={props.activeOptionsMenuId === props.item.id}>
          <div class="options-dropdown" onClick={(e) => e.stopPropagation()}>
            <div
              class="dropdown-item"
              onClick={(e) => props.onFavoriteItem(props.item, e)}
            >
              {props.item.favorite
                ? t("vault_menu_unfavorite")
                : t("vault_menu_favorites")}
            </div>
            <div
              class="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                openItem(props.item, View.ItemEdit);
              }}
            >
              {t("btn_edit")}
            </div>
            <div
              class="dropdown-item"
              onClick={(e) => props.onCloneItem(props.item, e)}
            >
              {t("btn_clone")}
            </div>
            <div
              class="dropdown-item text-danger"
              onClick={(e) => props.onDeleteItem(props.item, e)}
            >
              {t("btn_delete")}
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};
