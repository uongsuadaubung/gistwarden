import { type Component, createSignal, Show } from "solid-js";
import { type SshKeyVaultItem } from "@/shared/types.ts";
import { t } from "@/shared/i18n.ts";
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
        <Show when={props.item.sshKey.publicKey}>
          <div class="detail-row">
            <div class="field-content">
              <div class="field-label">{t("detail_ssh_public_key")}</div>
              <div class="field-value text-break">
                {props.item.sshKey.publicKey}
              </div>
            </div>
            <button
              type="button"
              class="action-btn"
              onClick={() =>
                props.onCopy(
                  props.item.sshKey.publicKey || "",
                  t("detail_ssh_public_key"),
                )}
              title={t("btn_copy")}
            >
              <CopyIcon />
            </button>
          </div>
        </Show>

        {/* Fingerprint */}
        <Show when={props.item.sshKey.keyFingerprint}>
          <div class="detail-row">
            <div class="field-content">
              <div class="field-label">{t("detail_ssh_fingerprint")}</div>
              <div class="field-value text-break">
                {props.item.sshKey.keyFingerprint}
              </div>
            </div>
            <button
              type="button"
              class="action-btn"
              onClick={() =>
                props.onCopy(
                  props.item.sshKey.keyFingerprint || "",
                  t("detail_ssh_fingerprint"),
                )}
              title={t("btn_copy")}
            >
              <CopyIcon />
            </button>
          </div>
        </Show>
      </div>
    </>
  );
};

export default SshKeyDetailFields;
