import { type Component, createSignal, Index, onMount, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { Header } from "@/components/ui/Header.tsx";
import Input from "@/components/ui/Input.tsx";
import Checkbox from "@/components/ui/Checkbox.tsx";
import FormField from "@/components/ui/FormField.tsx";
import { CopyIcon, RefreshIcon } from "@/icons/svg/index.ts";
import {
  generatePassphrase,
  generatePassword,
} from "@/features/generator/generator-utils.ts";

export const Generator: Component = () => {
  const [activeTab, setActiveTab] = createSignal<"password" | "passphrase">(
    "password",
  );
  const [password, setPassword] = createSignal("");

  // Password State
  const [length, setLength] = createSignal<number | string>(15);
  const [uppercase, setUppercase] = createSignal(true);
  const [lowercase, setLowercase] = createSignal(true);
  const [numbers, setNumbers] = createSignal(true);
  const [specials, setSpecials] = createSignal(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = createSignal(false);
  const [minNumbers, setMinNumbers] = createSignal(6);
  const [minSpecials, setMinSpecials] = createSignal(1);

  // Passphrase State
  const [numWords, setNumWords] = createSignal<number | string>(6);
  const [wordSeparator, setWordSeparator] = createSignal("-");
  const [capitalize, setCapitalize] = createSignal(false);
  const [includeNumber, setIncludeNumber] = createSignal(false);

  const [copied, setCopied] = createSignal(false);

  onMount(() => {
    generate();
  });

  const generate = () => {
    if (activeTab() === "password") {
      handleGeneratePassword();
    } else if (activeTab() === "passphrase") {
      handleGeneratePassphrase();
    }
  };

  const handleGeneratePassword = () => {
    const finalLen = Number(length());
    if (isNaN(finalLen) || finalLen < 9 || finalLen > 128) return;

    const res = generatePassword({
      length: finalLen,
      uppercase: uppercase(),
      lowercase: lowercase(),
      numbers: numbers(),
      specials: specials(),
      avoidAmbiguous: avoidAmbiguous(),
      minNumbers: minNumbers(),
      minSpecials: minSpecials(),
    });

    if (res.isErr()) {
      setPassword(t(res.error));
    } else {
      setPassword(res.value);
    }
  };

  const handleGeneratePassphrase = () => {
    const finalWords = Number(numWords());
    if (isNaN(finalWords) || finalWords < 3 || finalWords > 20) return;

    const res = generatePassphrase({
      numWords: finalWords,
      wordSeparator: wordSeparator(),
      capitalize: capitalize(),
      includeNumber: includeNumber(),
    });

    if (res.isErr()) {
      return;
    } else {
      setPassword(res.value);
    }
  };

  const handleCopy = async () => {
    const pwd = password();
    if (
      !pwd || pwd === t("gen_error_charset_empty") ||
      pwd === t("gen_error_min_exceeds_length")
    ) {
      return;
    }
    await navigator.clipboard.writeText(pwd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Password Options Handlers
  const handleLengthChange = (val: number | string) => {
    if (val === "") {
      setLength("");
      return;
    }
    const num = typeof val === "string" ? parseInt(val, 10) : val;
    if (!isNaN(num)) {
      setLength(num);
      if (num >= 9 && num <= 128) generate();
    }
  };

  const handleMinNumbersChange = (val: number) => {
    setMinNumbers(val);
    if (val > 0) {
      setNumbers(true);
    } else {
      setNumbers(false);
    }
    generate();
  };

  const handleMinSpecialsChange = (val: number) => {
    setMinSpecials(val);
    if (val > 0) {
      setSpecials(true);
    } else {
      setSpecials(false);
    }
    generate();
  };

  // Passphrase Options Handlers
  const handleNumWordsChange = (val: number | string) => {
    if (val === "") {
      setNumWords("");
      return;
    }
    const num = typeof val === "string" ? parseInt(val, 10) : val;
    if (!isNaN(num)) {
      setNumWords(num);
      if (num >= 3 && num <= 20) generate();
    }
  };

  const handleWordSeparatorChange = (val: string) => {
    setWordSeparator(val);
    generate();
  };

  const renderHighlightedPassword = (pwd: string) => {
    if (
      pwd === t("gen_error_charset_empty") ||
      pwd === t("gen_error_min_exceeds_length")
    ) {
      return <span class="text-error font-sz-13">{pwd}</span>;
    }

    const chars = () => pwd.split("");
    const sep = wordSeparator();
    const isPass = activeTab() === "passphrase";

    return (
      <Index each={chars()}>
        {(char) => {
          let charClass = "pwd-alpha";
          const c = char();

          if (isPass && c === sep) {
            charClass = "pwd-special";
          } else if (/[0-9]/.test(c)) {
            charClass = "pwd-digit";
          } else if (!isPass && /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(c)) {
            charClass = "pwd-special";
          }

          return <span class={charClass}>{c}</span>;
        }}
      </Index>
    );
  };

  return (
    <div class="app-container">
      <Header title={t("nav_generator")} />
      <div class="app-body">
        {/* Segmented Tab Bar */}
        <div class="generator-tabs">
          <button
            type="button"
            class={`generator-tab ${
              activeTab() === "password" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("password");
              generate();
            }}
          >
            {t("gen_tab_password")}
          </button>
          <button
            type="button"
            class={`generator-tab ${
              activeTab() === "passphrase" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("passphrase");
              generate();
            }}
          >
            {t("gen_tab_passphrase")}
          </button>
        </div>

        <Show when={activeTab() === "password"}>
          {/* Output */}
          <div class="generator-output">
            <div class="output-value">
              {renderHighlightedPassword(password())}
            </div>
            <div class="output-actions-inline">
              <button
                type="button"
                class="icon-btn"
                onClick={generate}
                title={t("gen_btn_generate")}
              >
                <RefreshIcon />
              </button>
              <button
                type="button"
                class="icon-btn"
                onClick={handleCopy}
                title={copied() ? t("btn_copied") : t("btn_copy")}
              >
                <CopyIcon />
              </button>
            </div>
          </div>

          {/* Options */}
          <div class="options-title">{t("gen_options_title")}</div>

          <div class="card mb-16 overflow-visible">
            {/* Length input */}
            <FormField
              id="gen-length"
              label={t("gen_label_length")}
            >
              <Input
                id="gen-length"
                type="number"
                min="9"
                max="128"
                value={length()}
                onInput={(e) => handleLengthChange(e.currentTarget.value)}
                onBlur={() => {
                  let num = Number(length());
                  if (isNaN(num) || num < 9) num = 9;
                  if (num > 128) num = 128;
                  setLength(num);
                  generate();
                }}
              />
              <div class="options-hint">Value must be between 9 and 128.</div>
            </FormField>
          </div>

          <div class="card mb-16 overflow-visible">
            {/* Include checkboxes */}
            <div class="options-group-title">
              {t("gen_include_title")}
            </div>
            <div class="checkbox-grid">
              <Checkbox
                id="opt-uppercase"
                checked={uppercase()}
                onChange={(val) => {
                  setUppercase(val);
                  generate();
                }}
                label="A-Z"
              />
              <Checkbox
                id="opt-lowercase"
                checked={lowercase()}
                onChange={(val) => {
                  setLowercase(val);
                  generate();
                }}
                label="a-z"
              />
              <Checkbox
                id="opt-numbers"
                checked={numbers()}
                onChange={(val) => {
                  setNumbers(val);
                  if (val) {
                    if (minNumbers() === 0) setMinNumbers(1);
                  } else {
                    setMinNumbers(0);
                  }
                  generate();
                }}
                label="0-9"
              />
              <Checkbox
                id="opt-specials"
                checked={specials()}
                onChange={(val) => {
                  setSpecials(val);
                  if (val) {
                    if (minSpecials() === 0) setMinSpecials(1);
                  } else {
                    setMinSpecials(0);
                  }
                  generate();
                }}
                label="!@#$%^&*"
              />
            </div>

            {/* Minimum numbers and special */}
            <div class="grid-2">
              <FormField
                id="gen-min-numbers"
                label={t("gen_min_numbers")}
              >
                <Input
                  id="gen-min-numbers"
                  type="number"
                  min="0"
                  max="9"
                  value={minNumbers()}
                  onInput={(e) => handleMinNumbersChange(
                    parseInt(e.currentTarget.value) || 0,
                  )}
                />
              </FormField>
              <FormField
                id="gen-min-specials"
                label={t("gen_min_specials")}
              >
                <Input
                  id="gen-min-specials"
                  type="number"
                  min="0"
                  max="9"
                  value={minSpecials()}
                  onInput={(e) =>
                    handleMinSpecialsChange(
                      parseInt(e.currentTarget.value) || 0,
                    )}
                />
              </FormField>
            </div>

            {/* Avoid ambiguous characters */}
            <Checkbox
              id="opt-avoid-ambiguous"
              checked={avoidAmbiguous()}
              onChange={(val) => {
                setAvoidAmbiguous(val);
                generate();
              }}
              label={t("gen_opt_avoid_ambiguous")}
              class="mt-16"
            />
          </div>
        </Show>

        <Show when={activeTab() === "passphrase"}>
          {/* Output */}
          <div class="generator-output">
            <div class="output-value">
              {renderHighlightedPassword(password())}
            </div>
            <div class="output-actions-inline">
              <button
                type="button"
                class="icon-btn"
                onClick={generate}
                title={t("gen_btn_generate")}
              >
                <RefreshIcon />
              </button>
              <button
                type="button"
                class="icon-btn"
                onClick={handleCopy}
                title={copied() ? t("btn_copied") : t("btn_copy")}
              >
                <CopyIcon />
              </button>
            </div>
          </div>

          {/* Options */}
          <div class="options-title">{t("gen_options_title")}</div>

          <div class="card mb-16 overflow-visible">
            {/* Number of words input */}
            <FormField
              id="gen-num-words"
              label={t("gen_label_num_words")}
            >
              <Input
                id="gen-num-words"
                type="number"
                min="3"
                max="20"
                value={numWords()}
                onInput={(e) => handleNumWordsChange(e.currentTarget.value)}
                onBlur={() => {
                  let num = Number(numWords());
                  if (isNaN(num) || num < 3) num = 3;
                  if (num > 20) num = 20;
                  setNumWords(num);
                  generate();
                }}
              />
              <div class="options-hint">
                {t("gen_passphrase_hint")}
              </div>
            </FormField>
          </div>

          <div class="card mb-16 overflow-visible">
            {/* Word separator input */}
            <FormField
              id="gen-word-separator"
              label={t("gen_label_word_separator")}
              class="mb-16"
            >
              <Input
                id="gen-word-separator"
                type="text"
                value={wordSeparator()}
                onInput={(e) =>
                  handleWordSeparatorChange(e.currentTarget.value)}
              />
            </FormField>

            <Checkbox
              id="opt-capitalize"
              checked={capitalize()}
              onChange={(val) => {
                setCapitalize(val);
                generate();
              }}
              label={t("gen_opt_capitalize")}
              class="mb-12"
            />

            <Checkbox
              id="opt-include-number"
              checked={includeNumber()}
              onChange={(val) => {
                setIncludeNumber(val);
                generate();
              }}
              label={t("gen_opt_include_number")}
            />
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Generator;
