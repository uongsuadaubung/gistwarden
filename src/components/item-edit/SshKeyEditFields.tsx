import { type Component, createSignal, Show } from "solid-js";
import { t } from "@/shared/i18n.ts";
import Input from "@/components/Input.tsx";
import { UploadIcon, EyeIcon, EyeOffIcon } from "@/icons/svg/index.ts";
import { parseSshKey } from "@/shared/crypto.ts";
import FormField from "@/components/FormField.tsx";

interface SshKeyEditFieldsProps {
  privateKey: string;
  setPrivateKey: (val: string) => void;
  publicKey: string;
  setPublicKey: (val: string) => void;
  keyFingerprint: string;
  setKeyFingerprint: (val: string) => void;
}

export const SshKeyEditFields: Component<SshKeyEditFieldsProps> = (props) => {
  const [showPrivateKey, setShowPrivateKey] = createSignal(false);
  const [errorMsg, setErrorMsg] = createSignal("");

  const handlePasteSshKey = async () => {
    setErrorMsg("");
    try {
      const text = await navigator.clipboard.readText();
      const parsed = await parseSshKey(text);
      if (parsed) {
        props.setPrivateKey(text);
        props.setPublicKey(parsed.publicKey);
        props.setKeyFingerprint(parsed.keyFingerprint);
      } else {
        setErrorMsg(t("ssh_invalid_key") || "Invalid SSH Private Key or format unsupported (requires unencrypted OpenSSH format)");
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
              value={props.privateKey}
              readonly={true}
              placeholder={t("ssh_import_from_clipboard") || "Paste unencrypted OpenSSH Private Key from clipboard..."}
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
                    title={t("ssh_import_from_clipboard") || "Paste from clipboard"}
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
            value={props.publicKey}
            readonly={true}
            placeholder="Parsed automatically from Private Key..."
          />
        </FormField>

        {/* Fingerprint */}
        <FormField id="ssh-fingerprint" label={t("detail_ssh_fingerprint")}>
          <Input
            id="ssh-fingerprint"
            value={props.keyFingerprint}
            readonly={true}
            placeholder="Parsed automatically from Private Key..."
          />
        </FormField>
      </div>
    </>
  );
};

export default SshKeyEditFields;
