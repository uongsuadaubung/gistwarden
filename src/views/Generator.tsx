import { type Component, createSignal, onMount, Show } from "solid-js";
import Button from "@/components/Button.tsx";
import { RefreshIcon } from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";

export const Generator: Component = () => {
  const [password, setPassword] = createSignal("");
  const [length, setLength] = createSignal(14);
  const [uppercase, setUppercase] = createSignal(true);
  const [lowercase, setLowercase] = createSignal(true);
  const [numbers, setNumbers] = createSignal(true);
  const [specials, setSpecials] = createSignal(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = createSignal(false);
  const [copied, setCopied] = createSignal(false);

  onMount(() => {
    generate();
  });

  const generate = () => {
    let charset = "";
    if (uppercase()) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (lowercase()) charset += "abcdefghijklmnopqrstuvwxyz";
    if (numbers()) charset += "0123456789";
    if (specials()) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (avoidAmbiguous()) {
      // Remove easily confused characters: I, l, 1, O, 0, o, etc.
      charset = charset.replace(/[Il1O0o]/g, "");
    }

    if (!charset) {
      setPassword(t("gen_error_charset_empty"));
      return;
    }

    let generated = "";
    const bytes = new Uint8Array(length());
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length(); i++) {
      generated += charset[bytes[i] % charset.length];
    }
    setPassword(generated);
  };

  const handleCopy = async () => {
    if (!password() || password() === t("gen_error_charset_empty")) return;
    await navigator.clipboard.writeText(password());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div class="app-container">
      <div class="app-body">
        <h3 class="generator-title">{t("gen_title")}</h3>

        {/* Output */}
        <div class="generator-output">
          <div class="output-value">{password()}</div>
          <div class="output-actions">
            <Button variant="secondary" onClick={generate} title={t("gen_btn_generate")}>
              <RefreshIcon class="icon-inline" />
            </Button>
            <Button variant="primary" onClick={handleCopy} class="min-w-100">
              <Show when={copied()} fallback={t("btn_copy")}>
                {t("btn_copied")}
              </Show>
            </Button>
          </div>
        </div>

        {/* Options */}
        <div class="card">
          <div class="form-group mb-16">
            <label>{t("gen_label_length")}</label>
            <div class="range-slider">
              <input
                type="range"
                min="8"
                max="50"
                value={length()}
                onInput={(e) => {
                  setLength(parseInt(e.currentTarget.value));
                  generate();
                }}
              />
              <span class="slider-val">{length()}</span>
            </div>
          </div>

          <div class="flex-col gap-8">
            <label class="checkbox-option">
              <input
                type="checkbox"
                checked={uppercase()}
                onChange={(e) => {
                  setUppercase(e.currentTarget.checked);
                  generate();
                }}
              />
              <span>{t("gen_opt_uppercase")}</span>
            </label>

            <label class="checkbox-option">
              <input
                type="checkbox"
                checked={lowercase()}
                onChange={(e) => {
                  setLowercase(e.currentTarget.checked);
                  generate();
                }}
              />
              <span>{t("gen_opt_lowercase")}</span>
            </label>

            <label class="checkbox-option">
              <input
                type="checkbox"
                checked={numbers()}
                onChange={(e) => {
                  setNumbers(e.currentTarget.checked);
                  generate();
                }}
              />
              <span>{t("gen_opt_numbers")}</span>
            </label>

            <label class="checkbox-option">
              <input
                type="checkbox"
                checked={specials()}
                onChange={(e) => {
                  setSpecials(e.currentTarget.checked);
                  generate();
                }}
              />
              <span>{t("gen_opt_symbols")}</span>
            </label>

            <label class="checkbox-option checkbox-option-divider">
              <input
                type="checkbox"
                checked={avoidAmbiguous()}
                onChange={(e) => {
                  setAvoidAmbiguous(e.currentTarget.checked);
                  generate();
                }}
              />
              <span>{t("gen_opt_avoid_ambiguous")}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Generator;
