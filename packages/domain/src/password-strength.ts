import { Options, ZxcvbnFactory } from "@zxcvbn-ts/core";
import { ENGLISH_WORDLIST } from "./wordlist.ts";
import { VIETNAMESE_WORDLIST } from "./vietnamese-wordlist.ts";

const options = new Options({
  dictionary: {
    english: ENGLISH_WORDLIST,
    vietnamese: VIETNAMESE_WORDLIST,
  },
});

const zxcvbnFactory = new ZxcvbnFactory(options);
export const zxcvbnOptions = options;
export const zxcvbn = (pass: string, userInputs?: string[]) =>
  zxcvbnFactory.check(pass, userInputs);

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  entropy: number;
  guesses: number;
  warning?: string;
}

export function evaluatePasswordStrength(
  pass: string,
  userInputs: string[] = [],
): PasswordStrengthResult {
  if (!pass || pass.length === 0) {
    return { score: 0, entropy: 0, guesses: 1, warning: "pwd_strength_empty" };
  }

  // Đánh giá bằng zxcvbn tích hợp bộ wordlist Tiếng Anh + Tiếng Việt sẵn có trong Gistwarden
  const result = zxcvbn(pass, userInputs);

  let score: 0 | 1 | 2 | 3 | 4 = 0;
  const rawScore = Number(result.score);
  if (rawScore === 1) {
    score = 1;
  } else if (rawScore === 2) {
    score = 2;
  } else if (rawScore === 3) {
    score = 3;
  } else if (rawScore === 4) {
    score = 4;
  }

  const guesses = result.guesses || 1;
  const entropy = Math.max(0, Math.round(Math.log2(Math.max(guesses, 1))));

  let warning: string | undefined;
  if (score === 0) {
    warning = "pwd_warning_very_weak";
  } else if (score === 1) {
    warning = "pwd_warning_weak";
  } else if (score === 2) {
    warning = "pwd_warning_fair";
  }

  return {
    score,
    entropy,
    guesses,
    warning,
  };
}
