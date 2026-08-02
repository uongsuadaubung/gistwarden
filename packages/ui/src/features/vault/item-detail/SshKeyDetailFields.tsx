import CopyableField from "@/components/ui/CopyableField.tsx";
import { type Component, createSignal, Show } from "solid-js";
import type { SshKeyVaultItem } from "@gistwarden/domain";
import { t } from "@/core/i18n.ts";
import { CopyIcon, EyeIcon, EyeOffIcon } from "@/icons/svg/index.ts";

interface SshKeyDetailFieldsProps {
  item: SshKeyVaultItem;
  onCopy: (text: string, label: string) => void;
}

export const SshKeyDetailFields: Component<SshKeyDetailFieldsProps> = (
  props,
) => {
  const [showPrivateKey, setShowPrivateKey] = createSignal(false);

  return (
    <>
      <div class="detail-section-title">
        {t("vault_item_ssh_key")}
      </div>
      <div class="card mb-16">
        {/* Private Key */}
        <div class="detail-row">
          <div class="field-content">
            <div class="field-label">{t("detail_ssh_private_key")}</div>
            <div class="field-value password-font text-break">
              {showPrivateKey()
                ? (props.item.sshKey.privateKey || "")
                : "●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●"}
            </div>
          </div>
          <div class="field-actions">
            <button
              type="button"
              class="action-btn"
              onClick={() => setShowPrivateKey(!showPrivateKey())}
              title={t("detail_ssh_private_key")}
            >
              <Show
                when={showPrivateKey()}
                fallback={<EyeIcon class="icon-inline" />}
              >
                <EyeOffIcon class="icon-inline" />
              </Show>
            </button>
            <Show when={props.item.sshKey.privateKey}>
              <button
                type="button"
                class="action-btn"
                onClick={() =>
                  props.onCopy(
                    props.item.sshKey.privateKey || "",
                    t("detail_ssh_private_key"),
                  )}
                title={t("btn_copy")}
              >
                <CopyIcon />
              </button>
            </Show>
          </div>
        </div>

        {/* Public Key */}
        <CopyableField
          label={t("detail_ssh_public_key")}
          value={props.item.sshKey.publicKey}
          onCopy={props.onCopy}
          copyTitle={t("btn_copy")}
        />

        {/* Fingerprint */}
        <CopyableField
          label={t("detail_ssh_fingerprint")}
          value={props.item.sshKey.keyFingerprint}
          onCopy={props.onCopy}
          copyTitle={t("btn_copy")}
        />
      </div>
    </>
  );
};

export default SshKeyDetailFields;
