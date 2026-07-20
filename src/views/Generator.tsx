import { type Component, createSignal, Index, onMount, Show } from "solid-js";
import { isTranslationKey, t } from "@/shared/i18n.ts";
import { Header } from "@/components/Header.tsx";
import Input from "@/components/Input.tsx";
import Checkbox from "@/components/Checkbox.tsx";
import FormField from "@/components/FormField.tsx";
import { CopyIcon, RefreshIcon } from "@/icons/svg/index.ts";
import { generatePassword, generatePassphrase } from "@/shared/generator-utils.ts";

export const Generator: Component = () => {
  const [activeTab, setActiveTab] = createSignal<"password" | "passphrase">(
    "password",
  );
  const [password, setPassword] = createSignal("");

  // Password State
  const [length, setLength] = createSignal(15);
  const [uppercase, setUppercase] = createSignal(true);
  const [lowercase, setLowercase] = createSignal(true);
  const [numbers, setNumbers] = createSignal(true);
  const [specials, setSpecials] = createSignal(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = createSignal(false);
  const [minNumbers, setMinNumbers] = createSignal(6);
  const [minSpecials, setMinSpecials] = createSignal(1);

  // Passphrase State
  const [numWords, setNumWords] = createSignal(6);
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
    const res = generatePassword({
      length: length(),
      uppercase: uppercase(),
      lowercase: lowercase(),
      numbers: numbers(),
      specials: specials(),
      avoidAmbiguous: avoidAmbiguous(),
      minNumbers: minNumbers(),
      minSpecials: minSpecials(),
    });

    if (typeof res !== "string") {
      setPassword(isTranslationKey(res.error) ? t(res.error) : res.error);
    } else {
      setPassword(res);
    }
  };

  const handleGeneratePassphrase = () => {
    const res = generatePassphrase({
      numWords: numWords(),
      wordSeparator: wordSeparator(),
      capitalize: capitalize(),
      includeNumber: includeNumber(),
    });

    if (typeof res !== "string") {
      return;
    } else {
      setPassword(res);
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
  const handleLengthChange = (val: number) => {
    setLength(val);
    generate();
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
  const handleNumWordsChange = (val: number) => {
    setNumWords(val);
    generate();
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
                onInput={(e) =>
                  handleLengthChange(parseInt(e.currentTarget.value) || 0)}
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
                onInput={(e) =>
                  handleNumWordsChange(parseInt(e.currentTarget.value) || 0)}
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
