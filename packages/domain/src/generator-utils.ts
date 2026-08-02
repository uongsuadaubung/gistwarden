import { err, ok, Result } from "neverthrow";
import { toTranslationKey, type TranslationKey } from "./i18n.ts";
import {
  generatePassphraseWasm,
  generatePasswordWasm,
  getRandomBoundedIntWasm,
} from "./wasm/index.ts";

/**
 * Re-export 100% trực tiếp hàm CSPRNG Rejection Sampling từ Rust WebAssembly.
 */
export function getRandomBoundedInt(max: number): number {
  return getRandomBoundedIntWasm(max);
}

export interface GeneratePasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  specials: boolean;
  avoidAmbiguous: boolean;
  minNumbers: number;
  minSpecials: number;
}

export function generatePassword(
  options: GeneratePasswordOptions,
): Result<string, TranslationKey> {
  try {
    const pwd = generatePasswordWasm(
      options.length,
      options.uppercase,
      options.lowercase,
      options.numbers,
      options.specials,
      options.avoidAmbiguous,
      options.minNumbers,
      options.minSpecials,
    );
    return ok(pwd);
  } catch (e: unknown) {
    const errorStr = typeof e === "string" ? e : String(e);
    return err(toTranslationKey(errorStr));
  }
}

export interface GeneratePassphraseOptions {
  numWords: number;
  wordSeparator: string;
  capitalize: boolean;
  includeNumber: boolean;
}

export function generatePassphrase(
  options: GeneratePassphraseOptions,
): Result<string, TranslationKey> {
  try {
    const passphrase = generatePassphraseWasm(
      options.numWords,
      options.wordSeparator,
      options.capitalize,
      options.includeNumber,
    );
    return ok(passphrase);
  } catch (e: unknown) {
    const errorStr = typeof e === "string" ? e : String(e);
    return err(toTranslationKey(errorStr));
  }
}
