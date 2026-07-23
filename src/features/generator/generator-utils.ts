import { wordlist } from "@/core/wordlist.ts";
import { err, ok, type Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

/**
 * Triển khai thuật toán Rejection Sampling (CSPRNG Unbiased Uniform Integer)
 * để sinh số nguyên ngẫu nhiên đều thuộc khoảng [0, max - 1].
 * Thuật toán loại bỏ hoàn toàn Modulo Bias bằng cách loại bỏ phần dư vượt ngưỡng giới hạn.
 */
export function getRandomBoundedInt(max: number): number {
  if (max <= 1) return 0;
  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - (maxUint32 % max);
  const bytes = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(bytes);
    if (bytes[0] < limit) {
      return bytes[0] % max;
    }
  }
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
  const uSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lSet = "abcdefghijklmnopqrstuvwxyz";
  const nSet = "0123456789";
  const sSet = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let availableU = uSet;
  let availableL = lSet;
  let availableN = nSet;
  let availableS = sSet;

  if (options.avoidAmbiguous) {
    const regex = /[Il1O0o]/g;
    availableU = availableU.replace(regex, "");
    availableL = availableL.replace(regex, "");
    availableN = availableN.replace(regex, "");
    availableS = availableS.replace(regex, "");
  }

  let charset = "";
  if (options.uppercase) charset += availableU;
  if (options.lowercase) charset += availableL;
  if (options.numbers) charset += availableN;
  if (options.specials) charset += availableS;

  if (!charset) {
    return err("gen_error_charset_empty");
  }

  const len = options.length;
  const minNum = options.numbers ? options.minNumbers : 0;
  const minSpec = options.specials ? options.minSpecials : 0;

  if (minNum + minSpec > len) {
    return err("gen_error_min_exceeds_length");
  }

  const resultChars: string[] = [];

  const getRandomChar = (str: string) => {
    return str[getRandomBoundedInt(str.length)];
  };

  if (options.numbers && minNum > 0 && availableN.length > 0) {
    for (let i = 0; i < minNum; i++) {
      resultChars.push(getRandomChar(availableN));
    }
  }

  if (options.specials && minSpec > 0 && availableS.length > 0) {
    for (let i = 0; i < minSpec; i++) {
      resultChars.push(getRandomChar(availableS));
    }
  }

  const remaining = len - resultChars.length;
  for (let i = 0; i < remaining; i++) {
    resultChars.push(getRandomChar(charset));
  }

  // Shuffle the result characters using Fisher-Yates with CSPRNG rejection sampling
  for (let i = resultChars.length - 1; i > 0; i--) {
    const j = getRandomBoundedInt(i + 1);
    const temp = resultChars[i];
    resultChars[i] = resultChars[j];
    resultChars[j] = temp;
  }

  return ok(resultChars.join(""));
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
  const words = options.numWords;
  if (words < 3 || words > 20) return err("gen_error_invalid_words_count");

  const chosenWords: string[] = [];

  for (let i = 0; i < words; i++) {
    const wordIndex = getRandomBoundedInt(wordlist.length);
    let word = wordlist[wordIndex];

    if (options.capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }

    chosenWords.push(word);
  }

  if (options.includeNumber) {
    const targetWordIdx = getRandomBoundedInt(chosenWords.length);
    const randomDigit = getRandomBoundedInt(10);
    chosenWords[targetWordIdx] = chosenWords[targetWordIdx] + randomDigit;
  }

  return ok(chosenWords.join(options.wordSeparator));
}
