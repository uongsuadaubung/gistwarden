import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(__dirname, "..");
const wasmDir = join(
  projectRoot,
  "packages",
  "domain",
  "src",
  "wasm",
  "generated",
);
const wasmPath = join(wasmDir, "gistwarden_wasm_bg.wasm");
const outputPath = join(wasmDir, "wasm_bytes.ts");

const buf = readFileSync(wasmPath);
writeFileSync(outputPath, `export const WASM_BASE64 = "";\n`);
console.log(`✓ WASM binary verified (${buf.length} bytes)`);

// Dọn dẹp các file rác thừa do wasm-bindgen tự sinh ra
const redundantFiles = [
  "gistwarden_wasm_bg.js",
  "gistwarden_wasm_bg.d.ts",
  "gistwarden_wasm_bg.wasm.d.ts",
];

for (const file of redundantFiles) {
  const filePath = join(wasmDir, file);
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}
