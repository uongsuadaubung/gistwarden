import { type Component, createMemo } from "solid-js";
import { t } from "@/core/i18n.ts";

interface PasswordStrengthMeterProps {
  password: string;
}

type StrengthLabel =
  | "pwd_strength_weak"
  | "pwd_strength_fair"
  | "pwd_strength_good"
  | "pwd_strength_strong";

interface StrengthResult {
  score: number;
  label: StrengthLabel;
  className: string;
}

export const PasswordStrengthMeter: Component<PasswordStrengthMeterProps> = (
  props,
) => {
  const evaluateStrength = (pass: string): StrengthResult => {
    let score = 0;
    if (!pass) {
      return { score: 0, label: "pwd_strength_weak", className: "pwd-strength-0" };
    }

    if (pass.length > 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) {
      return { score, label: "pwd_strength_weak", className: "pwd-strength-weak" };
    }
    if (score <= 4) {
      return { score, label: "pwd_strength_fair", className: "pwd-strength-fair" };
    }
    if (score === 5) {
      return { score, label: "pwd_strength_good", className: "pwd-strength-good" };
    }
    return { score, label: "pwd_strength_strong", className: "pwd-strength-strong" };
  };

  const strength = createMemo(() => evaluateStrength(props.password));

  return (
    <div class="pwd-strength-container">
      <div class="pwd-strength-bar">
        <div class={`pwd-strength-progress ${strength().className}`} />
        <div class="pwd-strength-divider div-1" />
        <div class="pwd-strength-divider div-2" />
        <div class="pwd-strength-divider div-3" />
      </div>
      <div class={`pwd-strength-text ${strength().className}`}>
        {t(strength().label)}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
