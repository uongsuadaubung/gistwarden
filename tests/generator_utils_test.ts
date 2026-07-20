import {
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  generatePassphrase,
  generatePassword,
} from "../src/features/generator/generator-utils.ts";

Deno.test("generator-utils: generatePassword respects length", () => {
  const pwd = generatePassword({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    specials: true,
    avoidAmbiguous: false,
    minNumbers: 2,
    minSpecials: 2,
  });
  assertEquals(typeof pwd === "string", true);
  if (typeof pwd === "string") {
    assertEquals(pwd.length, 20);
  }
});

Deno.test("generator-utils: generatePassword ensures min constraints", () => {
  const pwd = generatePassword({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    specials: true,
    avoidAmbiguous: false,
    minNumbers: 5,
    minSpecials: 5,
  });
  assertEquals(typeof pwd === "string", true);
  if (typeof pwd === "string") {
    const numMatches = pwd.match(/[0-9]/g);
    assertEquals(numMatches !== null && numMatches.length >= 5, true);

    const specMatches = pwd.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g);
    assertEquals(specMatches !== null && specMatches.length >= 5, true);
  }
});

Deno.test("generator-utils: generatePassphrase respects word count", () => {
  const phrase = generatePassphrase({
    numWords: 5,
    wordSeparator: "-",
    capitalize: false,
    includeNumber: false,
  });
  assertEquals(typeof phrase === "string", true);
  if (typeof phrase === "string") {
    const words = phrase.split("-");
    assertEquals(words.length, 5);
  }
});

Deno.test("generator-utils: generatePassphrase includes numbers if requested", () => {
  const phrase = generatePassphrase({
    numWords: 5,
    wordSeparator: "-",
    capitalize: false,
    includeNumber: true,
  });
  assertEquals(typeof phrase === "string", true);
  if (typeof phrase === "string") {
    assertMatch(phrase, /[0-9]/);
  }
});
