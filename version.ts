import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const manifestPath = join(
  import.meta.dirname || ".",
  "src",
  "manifest.json",
);

if (!existsSync(manifestPath)) {
  console.error("Error: src/manifest.json not found!");
  Deno.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const currentVersion = manifest.version || "";

const now = new Date();
const yyyy = now.getFullYear();
const m = now.getMonth() + 1; // 1-12 (không có số 0 đi đầu)
const d = now.getDate(); // 1-31 (không có số 0 đi đầu)
const datePrefix = `${yyyy}.${m}.${d}`;

let newVersion = datePrefix;

// Nếu phiên bản hiện tại đã bắt đầu bằng ngày hôm nay, tăng revision phụ lên 1 đơn vị
if (currentVersion.startsWith(datePrefix)) {
  const rest = currentVersion.slice(datePrefix.length);
  if (rest === "") {
    newVersion = `${datePrefix}.1`;
  } else if (rest.startsWith(".")) {
    const rev = parseInt(rest.slice(1), 10);
    if (!isNaN(rev)) {
      newVersion = `${datePrefix}.${rev + 1}`;
    } else {
      newVersion = `${datePrefix}.1`;
    }
  }
}

manifest.version = newVersion;
writeFileSync(
  manifestPath,
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8",
);
console.log(`✓ Updated src/manifest.json version to ${newVersion}`);

console.log(
  `\n🎉 Successfully bumped version from ${
    currentVersion || "none"
  } to ${newVersion}`,
);
