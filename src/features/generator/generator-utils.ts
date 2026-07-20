import { wordlist } from "@/core/wordlist.ts";

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
): string | { error: string } {
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
    return { error: "gen_error_charset_empty" };
  }

  const len = options.length;
  const minNum = options.numbers ? options.minNumbers : 0;
  const minSpec = options.specials ? options.minSpecials : 0;

  if (minNum + minSpec > len) {
    return { error: "gen_error_min_exceeds_length" };
  }

  const resultChars: string[] = [];

  const getRandomChar = (str: string) => {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return str[bytes[0] % str.length];
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

  // Shuffle the result characters
  for (let i = resultChars.length - 1; i > 0; i--) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const j = bytes[0] % (i + 1);
    const temp = resultChars[i];
    resultChars[i] = resultChars[j];
    resultChars[j] = temp;
  }

  return resultChars.join("");
}

export interface GeneratePassphraseOptions {
  numWords: number;
  wordSeparator: string;
  capitalize: boolean;
  includeNumber: boolean;
}

export function generatePassphrase(
  options: GeneratePassphraseOptions,
): string | { error: string } {
  const words = options.numWords;
  if (words < 3 || words > 20) return { error: "invalid_words_count" };

  const chosenWords: string[] = [];
  const bytes = new Uint32Array(words);
  crypto.getRandomValues(bytes);

  for (let i = 0; i < words; i++) {
    const wordIndex = bytes[i] % wordlist.length;
    let word = wordlist[wordIndex];

    if (options.capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }

    chosenWords.push(word);
  }

  if (options.includeNumber) {
    const idxBytes = new Uint32Array(2);
    crypto.getRandomValues(idxBytes);
    const targetWordIdx = idxBytes[0] % chosenWords.length;
    const randomDigit = idxBytes[1] % 10;
    chosenWords[targetWordIdx] = chosenWords[targetWordIdx] + randomDigit;
  }

  return chosenWords.join(options.wordSeparator);
}
