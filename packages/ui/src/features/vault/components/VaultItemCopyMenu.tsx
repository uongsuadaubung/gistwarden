import { type Component, Show } from "solid-js";
import {
  isCardItem,
  isLoginItem,
  isSshKeyItem,
  VaultItemType,
} from "@gistwarden/domain";
import type { VaultItem } from "@gistwarden/domain";
import { CopyIcon } from "@/icons/svg/index.ts";
import { t } from "@/core/i18n.ts";

interface VaultItemCopyMenuProps {
  item: VaultItem;
  activeMenuId: string;
  onToggleMenu: (itemId: string, e: MouseEvent) => void;
  onCopyText: (text: string, type: string, e: MouseEvent) => void;
  onCopyTotpDirect: (item: VaultItem, e: MouseEvent) => void;
}

export const VaultItemCopyMenu: Component<VaultItemCopyMenuProps> = (
  props,
) => {
  const isNotes = () => props.item.type === VaultItemType.SecureNote;

  return (
    <>
      {/* Copy Button Trigger */}
      <button
        class="action-btn"
        title={isNotes() ? t("vault_copy_notes") : t("vault_copy_options")}
        onClick={(e) => {
          if (isNotes()) {
            props.onCopyText(
              props.item.notes || "",
              t("edit_type_note"),
              e,
            );
          } else {
            props.onToggleMenu(props.item.id, e);
          }
        }}
      >
        <CopyIcon />
      </button>

      {/* Copy Options Menu Overlay */}
      <Show when={props.activeMenuId === props.item.id}>
        <div class="copy-dropdown" onClick={(e) => e.stopPropagation()}>
          {/* Login Item Copy Actions */}
          <Show when={isLoginItem(props.item) ? props.item : null}>
            {(loginItem) => (
              <>
                <Show when={loginItem().login.username}>
                  <div
                    class="dropdown-item"
                    onClick={(e) =>
                      props.onCopyText(
                        loginItem().login.username || "",
                        "username",
                        e,
                      )}
                  >
                    {t("detail_copy_username")}
                  </div>
                </Show>
                <Show when={loginItem().login.password}>
                  <div
                    class="dropdown-item"
                    onClick={(e) =>
                      props.onCopyText(
                        loginItem().login.password || "",
                        "password",
                        e,
                      )}
                  >
                    {t("detail_copy_password")}
                  </div>
                </Show>
                <Show when={loginItem().login.totp}>
                  <div
                    class="dropdown-item"
                    onClick={(e) => props.onCopyTotpDirect(props.item, e)}
                  >
                    {t("detail_copy_totp")}
                  </div>
                </Show>
              </>
            )}
          </Show>

          {/* Secure Note Copy Action */}
          <Show when={isNotes() && props.item.notes}>
            <div
              class="dropdown-item"
              onClick={(e) =>
                props.onCopyText(
                  props.item.notes || "",
                  "notes",
                  e,
                )}
            >
              {t("vault_copy_notes")}
            </div>
          </Show>

          {/* Card Item Copy Actions */}
          <Show when={isCardItem(props.item) ? props.item : null}>
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
          <Show when={isSshKeyItem(props.item) ? props.item : null}>
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
    </>
  );
};
