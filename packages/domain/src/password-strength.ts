import { estimatePasswordStrengthWasm } from "./wasm/index.ts";

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  entropy: number;
  guesses: number;
  warning?: string;
}

/**
 * Đánh giá độ mạnh yếu mật khẩu và tính toán Entropy ủy quyền 100% cho Rust WASM zxcvbn.
 */
export function evaluatePasswordStrength(
  pass: string,
  userInputs: string[] = [],
): PasswordStrengthResult {
  if (!pass || pass.length === 0) {
    return { score: 0, entropy: 0, guesses: 1, warning: "pwd_strength_empty" };
  }

  const result = estimatePasswordStrengthWasm(pass, userInputs);

  function isScore(val: number): val is 0 | 1 | 2 | 3 | 4 {
    return val === 0 || val === 1 || val === 2 || val === 3 || val === 4;
  }

  const rawScore = Number(result.score);
  const score: 0 | 1 | 2 | 3 | 4 = isScore(rawScore) ? rawScore : 0;

  const guesses = result.guesses || 1;
  const entropy = Math.max(
    0,
    Math.round(result.entropy || Math.log2(Math.max(guesses, 1))),
  );

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
