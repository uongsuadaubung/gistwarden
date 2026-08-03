import { assertEquals, assertMatch, test } from "./assert.ts";
import {
  generatePassphrase,
  generatePassword,
  getRandomBoundedInt,
} from "@gistwarden/domain";

test("generator-utils: generatePassword respects length", async () => {
  const pwd = await generatePassword({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    specials: true,
    avoidAmbiguous: false,
    minNumbers: 2,
    minSpecials: 2,
  });
  assertEquals(pwd.isOk(), true);
  if (pwd.isOk()) {
    assertEquals(pwd.value.length, 20);
  }
});

test("generator-utils: generatePassword ensures min constraints", async () => {
  const pwd = await generatePassword({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    specials: true,
    avoidAmbiguous: false,
    minNumbers: 5,
    minSpecials: 5,
  });
  assertEquals(pwd.isOk(), true);
  if (pwd.isOk()) {
    const numMatches = pwd.value.match(/[0-9]/g);
    assertEquals(numMatches !== null && numMatches.length >= 5, true);

    const specMatches = pwd.value.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g);
    assertEquals(specMatches !== null && specMatches.length >= 5, true);
  }
});

test("generator-utils: generatePassphrase respects word count", async () => {
  const phrase = await generatePassphrase({
    numWords: 5,
    wordSeparator: "-",
    capitalize: false,
    includeNumber: false,
  });
  assertEquals(phrase.isOk(), true);
  if (phrase.isOk()) {
    const words = phrase.value.split("-");
    assertEquals(words.length, 5);
  }
});

test("generator-utils: generatePassphrase includes numbers if requested", async () => {
  const phrase = await generatePassphrase({
    numWords: 5,
    wordSeparator: "-",
    capitalize: false,
    includeNumber: true,
  });
  assertEquals(phrase.isOk(), true);
  if (phrase.isOk()) {
    assertMatch(phrase.value, /[0-9]/);
  }
});

test("generator-utils: getRandomBoundedInt stays strictly within bounds [0, max-1]", () => {
  for (let i = 0; i < 100; i++) {
    const val = getRandomBoundedInt(10);
    assertEquals(val >= 0 && val < 10, true);
  }
});
