import { type Component, createSignal, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import Input from "@/components/ui/Input.tsx";
import { EyeIcon, EyeOffIcon, UploadIcon } from "@/icons/svg/index.ts";
import { parseSshKey } from "@/core/crypto.ts";
import FormField from "@/components/ui/FormField.tsx";
import type { ItemEditFormState } from "@/features/vault/item-edit/vault-edit-helper.ts";

interface SshKeyEditFieldsProps {
  formState: ItemEditFormState;
  updateForm: <K extends keyof ItemEditFormState>(
    key: K,
    val: ItemEditFormState[K],
  ) => void;
}

export const SshKeyEditFields: Component<SshKeyEditFieldsProps> = (props) => {
  const [showPrivateKey, setShowPrivateKey] = createSignal(false);
  const [errorMsg, setErrorMsg] = createSignal("");

  const handlePasteSshKey = async () => {
    setErrorMsg("");
    try {
      const text = await navigator.clipboard.readText();
      const parsedRes = await parseSshKey(text);
      if (parsedRes.isOk()) {
        const parsed = parsedRes.value;
        props.updateForm("sshPrivateKey", text);
        props.updateForm("sshPublicKey", parsed.publicKey);
        props.updateForm("sshFingerprint", parsed.keyFingerprint);
      } else {
        setErrorMsg(
          t("ssh_invalid_key"),
        );
      }
    } catch (err) {
      console.error("Clipboard read error:", err);
      setErrorMsg("Failed to read from clipboard or clipboard access denied");
    }
  };

  return (
    <>
      <div class="detail-section-title">{t("vault_item_ssh_key")}</div>
      <div class="card mb-16">
        <Show when={errorMsg()}>
          <div class="alert alert-danger mb-12 m-16">{errorMsg()}</div>
        </Show>

        {/* Private Key */}
        <FormField id="ssh-private-key" label={t("detail_ssh_private_key")}>
          <div class="pos-relative">
            <Input
              id="ssh-private-key"
              type={showPrivateKey() ? "text" : "password"}
              value={props.formState.sshPrivateKey}
              readonly={true}
              placeholder={t("ssh_import_from_clipboard")}
              class="w-100"
              rightActions={
                <>
                  <button
                    type="button"
                    class="action-btn input-action-btn"
                    onClick={() => setShowPrivateKey(!showPrivateKey())}
                    title={t("detail_ssh_private_key")}
                  >
                    <Show
                      fallback={<EyeIcon class="icon-inline" />}
                      when={showPrivateKey()}
                    >
                      <EyeOffIcon class="icon-inline" />
                    </Show>
                  </button>
                  <button
                    type="button"
                    class="action-btn input-action-btn"
                    onClick={handlePasteSshKey}
                    title={t("ssh_import_from_clipboard")}
                  >
                    <UploadIcon class="icon-inline" />
                  </button>
                </>
              }
            />
          </div>
        </FormField>

        {/* Public Key */}
        <FormField id="ssh-public-key" label={t("detail_ssh_public_key")}>
          <textarea
            id="ssh-public-key"
            class="input-control"
            rows="4"
            value={props.formState.sshPublicKey}
            readonly={true}
            placeholder="Parsed automatically from Private Key..."
          />
        </FormField>

        {/* Fingerprint */}
        <FormField id="ssh-fingerprint" label={t("detail_ssh_fingerprint")}>
          <Input
            id="ssh-fingerprint"
            value={props.formState.sshFingerprint}
            readonly={true}
            placeholder="Parsed automatically from Private Key..."
          />
        </FormField>
      </div>
    </>
  );
};

export default SshKeyEditFields;
