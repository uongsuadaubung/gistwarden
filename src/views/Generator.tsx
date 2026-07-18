import { type Component, createSignal, Index, onMount, Show } from "solid-js";
import { t } from "@/shared/i18n.ts";
import Input from "@/components/Input.tsx";
import Checkbox from "@/components/Checkbox.tsx";
import FormField from "@/components/FormField.tsx";
import { CopyIcon, RefreshIcon } from "@/icons/svg/index.ts";
import { wordlist } from "@/shared/wordlist.ts";

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
      generatePassword();
    } else if (activeTab() === "passphrase") {
      generatePassphrase();
    }
  };

  const generatePassword = () => {
    const uSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lSet = "abcdefghijklmnopqrstuvwxyz";
    const nSet = "0123456789";
    const sSet = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    let availableU = uSet;
    let availableL = lSet;
    let availableN = nSet;
    let availableS = sSet;

    if (avoidAmbiguous()) {
      const regex = /[Il1O0o]/g;
      availableU = availableU.replace(regex, "");
      availableL = availableL.replace(regex, "");
      availableN = availableN.replace(regex, "");
      availableS = availableS.replace(regex, "");
    }

    let charset = "";
    if (uppercase()) charset += availableU;
    if (lowercase()) charset += availableL;
    if (numbers()) charset += availableN;
    if (specials()) charset += availableS;

    if (!charset) {
      setPassword(t("gen_error_charset_empty"));
      return;
    }

    const len = length();
    const minNum = numbers() ? minNumbers() : 0;
    const minSpec = specials() ? minSpecials() : 0;

    if (minNum + minSpec > len) {
      setPassword(
        t("gen_error_min_exceeds_length") || "Min options exceed length",
      );
      return;
    }

    const resultChars: string[] = [];

    const getRandomChar = (str: string) => {
      const bytes = new Uint32Array(1);
      crypto.getRandomValues(bytes);
      return str[bytes[0] % str.length];
    };

    if (numbers() && minNum > 0 && availableN.length > 0) {
      for (let i = 0; i < minNum; i++) {
        resultChars.push(getRandomChar(availableN));
      }
    }

    if (specials() && minSpec > 0 && availableS.length > 0) {
      for (let i = 0; i < minSpec; i++) {
        resultChars.push(getRandomChar(availableS));
      }
    }

    const remaining = len - resultChars.length;
    for (let i = 0; i < remaining; i++) {
      resultChars.push(getRandomChar(charset));
    }

    for (let i = resultChars.length - 1; i > 0; i--) {
      const bytes = new Uint32Array(1);
      crypto.getRandomValues(bytes);
      const j = bytes[0] % (i + 1);
      const temp = resultChars[i];
      resultChars[i] = resultChars[j];
      resultChars[j] = temp;
    }

    setPassword(resultChars.join(""));
  };

  const generatePassphrase = () => {
    const words = numWords();
    if (words < 3 || words > 20) return;

    const chosenWords: string[] = [];
    const bytes = new Uint32Array(words);
    crypto.getRandomValues(bytes);

    for (let i = 0; i < words; i++) {
      const wordIndex = bytes[i] % wordlist.length;
      let word = wordlist[wordIndex];

      if (capitalize()) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }

      chosenWords.push(word);
    }

    if (includeNumber()) {
      const idxBytes = new Uint32Array(2);
      crypto.getRandomValues(idxBytes);
      const targetWordIdx = idxBytes[0] % chosenWords.length;
      const randomDigit = idxBytes[1] % 10;
      chosenWords[targetWordIdx] = chosenWords[targetWordIdx] + randomDigit;
    }

    setPassword(chosenWords.join(wordSeparator()));
  };

  const handleCopy = async () => {
    const pwd = password();
    if (
      !pwd || pwd === t("gen_error_charset_empty") ||
      pwd === (t("gen_error_min_exceeds_length") || "Min options exceed length")
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
      pwd === (t("gen_error_min_exceeds_length") || "Min options exceed length")
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
            {t("gen_tab_password") || "Password"}
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
            {t("gen_tab_passphrase") || "Passphrase"}
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
          <div class="options-title">{t("gen_options_title") || "Options"}</div>

          <div class="card mb-16 overflow-visible">
            {/* Length input */}
            <FormField
              id="gen-length"
              label={t("gen_label_length") || "Length"}
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
              {t("gen_include_title") || "Include"}
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
                label={t("gen_min_numbers") || "Minimum numbers"}
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
                label={t("gen_min_specials") || "Minimum special"}
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
              label={t("gen_opt_avoid_ambiguous") ||
                "Avoid ambiguous characters"}
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
          <div class="options-title">{t("gen_options_title") || "Options"}</div>

          <div class="card mb-16 overflow-visible">
            {/* Number of words input */}
            <FormField
              id="gen-num-words"
              label={t("gen_label_num_words") || "Number of words"}
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
                {t("gen_passphrase_hint") ||
                  "Value must be between 3 and 20. Use 6 words or more to generate a strong passphrase."}
              </div>
            </FormField>
          </div>

          <div class="card mb-16 overflow-visible">
            {/* Word separator input */}
            <FormField
              id="gen-word-separator"
              label={t("gen_label_word_separator") || "Word separator"}
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
              label={t("gen_opt_capitalize") || "Capitalize"}
              class="mb-12"
            />

            <Checkbox
              id="opt-include-number"
              checked={includeNumber()}
              onChange={(val) => {
                setIncludeNumber(val);
                generate();
              }}
              label={t("gen_opt_include_number") || "Include number"}
            />
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Generator;
