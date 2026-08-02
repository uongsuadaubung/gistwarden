import { writeFileSync } from "node:fs";

const url = "https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt";
console.log("Fetching EFF large wordlist from:", url);

try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  const text = await response.text();
  const lines = text.split("\n");
  const words: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const word = parts[1].toLowerCase();
      if (/^[a-z]+$/.test(word)) {
        words.push(word);
      }
    }
  }

  console.log(`Successfully fetched and filtered ${words.length} words.`);

  const content = words.join("\n");

  writeFileSync("./crates/gistwarden-wasm/src/wordlist.txt", content, "utf8");
  console.log("Saved to ./crates/gistwarden-wasm/src/wordlist.txt");
} catch (error) {
  console.error("Error fetching wordlist:", error);
}
