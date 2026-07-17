# Gistwarden - High-Security Personal Password Vault Extension 🔒🔑

[![SolidJS](https://img.shields.io/badge/SolidJS-1.9-2c4f7c?style=for-the-badge&logo=solid&logoColor=white)](https://solidjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Deno](https://img.shields.io/badge/Deno-2.x-black?style=for-the-badge&logo=deno&logoColor=white)](https://deno.com)
[![Esbuild](https://img.shields.io/badge/Esbuild-0.28-ffcf00?style=for-the-badge&logo=esbuild&logoColor=black)](https://esbuild.github.io)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285f4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](https://opensource.org/licenses/ISC)

Gistwarden is an open-source browser extension designed to manage passwords,
one-time passwords (TOTP), secure notes, and passkeys (FIDO2/WebAuthn) securely,
privately, and completely free of charge.

Instead of paying annual fees for third-party cloud servers, Gistwarden provides
an **equivalent alternative** that runs independently, leveraging your personal
**GitHub Gist** as the encrypted database storage. Most importantly, it is
optimized for high security and is fully compatible with Bitwarden exports.

---

## ⚡ Key Features

### 1. 🔒 Absolute Zero-Knowledge Architecture

- **Local Encryption:** All data is encrypted directly on your browser before
  being synced to your GitHub Gist.
- **Privacy First:** No one — including GitHub or the extension developer — can
  read your data without your Master Password.

### 2. ⚡ Passkeys Support (FIDO2/WebAuthn)

- **Passwordless Login:** Create, simulate, and store modern Passkeys right
  inside your extension.
- **Cross-Origin Match Protection:** Features domain match validation to prevent
  cross-origin credentials leaking.

### 3. ⏱️ Dynamic TOTP (2FA) Codes

- **QR Code Parser:** Scan QR codes directly on web pages or upload image files
  to retrieve secret keys.
- **Auto Generator:** Instantly calculates and generates 2-factor authentication
  codes refreshing automatically every 30 seconds.

### 4. 🔄 Bitwarden Data Migration

- **Seamless Export/Import:** Import unencrypted JSON exports from Bitwarden
  seamlessly (logins, secure notes, custom fields, and TOTP keys).
- **Offline Backups:** Decrypt and download your local vault as a JSON backup
  file at any time.

### 5. 🌐 Multilingual Support

- **Dual Languages:** Smoothly toggle between **English 🇬🇧** and **Tiếng Việt
  🇻🇳** directly from the popup.

### 6. 🎨 Premium Modern UI

- **Sleek Aesthetic Design:** Beautiful modern interface with customized
  scrollbars, premium layouts, and seamless transitions.
- **Theme Selection:** Sleek Dark Mode and Light Mode configurations.

---

## 🔒 Security Architecture

### 1. Hardware-Resistant Key Derivation (KDF)

Gistwarden utilizes **Argon2id (WebAssembly)** — the current gold standard in
key derivation and password hashing — to defend against offline brute-force
attacks from hardware-accelerated systems (such as GPUs, FPGAs, and ASICs).

- **Parameters:** Memory: **64 MB**, Iterations: **3 rounds**, Parallelism: **1
  thread** (Optimized for extension environments).
- **Defense Capability:** Requiring 64MB of RAM per attempt completely
  neutralizes GPU advantages, making brute-force attacks economically and
  computationally infeasible.

### 2. Industry-Standard Encryption

Your vault data is protected by:

- **AES-GCM 256-bit:** The industry standard for authenticated symmetric
  encryption (AEAD). Any tampering with the encrypted data on GitHub Gist will
  cause decryption to fail immediately.
- **12-byte Random Initialization Vector (IV):** Generated using
  `crypto.getRandomValues` for each save operation, ensuring ciphertext
  uniqueness.

### 3. Secure WebAssembly Integration (Local WASM Package)

To comply with strict CSP guidelines of Chrome Extension **Manifest V3**:

- The WebAssembly binary of the `hash-wasm` library is **base64-encoded and
  inlined directly** inside the extension's JS bundle.
- The extension **never downloads any external scripts or binaries** over the
  network, eliminating Man-in-the-Middle (MITM) script injection risks.

---

## 🛠️ Installation Guide

Once built, production files are compiled into the `/dist` directory. You can
load this unpacked directory into your browser:

### 1. Google Chrome & Chromium-based Browsers (Edge, Brave, Opera, Coccoc...)

1. Run the build script and ensure you have the `dist/chrome` folder (or extract
   `dist/chrome.zip`).
2. Open Chrome and navigate to [chrome://extensions/](chrome://extensions/).
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the `dist/chrome` folder on your computer.
6. Pin the extension icon to your toolbar.

### 2. Mozilla Firefox

#### Method 1: Temporary Installation (For Development - resets when browser closes)

1. Open Firefox and navigate to
   [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox).
2. Click the **Load Temporary Add-on...** button.
3. Select the `manifest.json` file inside the `dist/firefox` folder.

#### Method 2: Permanent Installation (Requires Firefox Developer Edition or Nightly)

1. Navigate to `about:config` in Firefox.
2. Search for `xpinstall.signatures.required` and set it to `false`.
3. Go to [about:addons](about:addons), click the gear icon, and select **Install
   Add-on From File...**.
4. Choose the `dist/firefox.zip` file to install it permanently.

---

## 🔑 How to Generate a GitHub Token

To securely connect your vault with the cloud, the extension utilizes your
personal GitHub Gists. Follow these simple steps:

1. **Sign In:** Log in to your [GitHub](https://github.com) account.
2. **Quick Token Creation:** Click this link to open the pre-configured token
   generation page:
   [Quick GitHub Token Generation (Gist)](https://github.com/settings/tokens/new?description=Gistwarden%20Sync&scopes=gist).
3. **Configure:**
   - **Note:** Enter a description (e.g., `Gistwarden Vault`).
   - **Expiration:** Select **No expiration** to prevent future sync failures.
   - **Scopes:** Ensure the **gist** scope checkbox is checked (this is the only
     permission required).
4. **Generate:** Scroll to the bottom and click the green **Generate token**
   button.
5. **Save Settings:** Copy the generated token string (starts with `ghp_`). Open
   the extension, click **Settings**, paste it into the GitHub Token field, and
   click **Save**.

> [!WARNING]
> **IMPORTANT SECURITY NOTE:** Never share your GitHub Token with anyone else.
> The extension only stores it locally in your browser's secure storage and
> communicates directly with GitHub Gist APIs. No middleman or third-party
> servers are used.

---

## 📂 Project Structure

```text
totp-generate/
├── .github/              # GitHub Actions workflows configuration
├── dist/                 # Compiled production outputs (Chrome & Firefox)
├── src/                  # Main extension source code
│   ├── components/       # UI Components (SolidJS)
│   │   └── guide/        # Guide page specific tabs
│   ├── domains/          # Domain Logic
│   │   └── github/       # GitHub Gist API client
│   ├── extension/        # Extension Entrypoints
│   │   ├── background.ts # Background script managing OAuth & FIDO2 prompts
│   │   ├── fido2-content-script.ts # Injected scripts detecting WebAuthn credentials
│   │   └── fido2-page-script.ts    # Direct injection page hooks
│   ├── icons/            # Asset SVG icons
│   ├── images/           # Asset images for visual user guide
│   ├── shared/           # Common utilities, constants, locales, and store states
│   │   ├── locales/      # Translation files (en.ts, vi.ts)
│   │   ├── i18n.ts       # Localization engine
│   │   └── store.ts      # Global reactive SolidJS state store
│   ├── views/            # Screen views (Login, Vault, Settings, Welcome onboarding)
│   ├── guide.html        # Detailed user guide HTML anchor
│   ├── popup.html        # Popup window HTML anchor
│   ├── popup-entry.tsx   # SolidJS popup renderer entrypoint
│   └── guide-entry.tsx   # SolidJS guide renderer entrypoint
├── tests/                # Unit test suites (Argon2id, AES verification)
├── build.ts              # esbuild compiler & SCSS post-processor (TypeScript)
├── deno.json             # Deno configuration, tasks, and compiler settings
├── deno.lock             # Deno lock file managing dependencies securely
└── version.ts            # Automatic versioning bumping script (TypeScript)
```

---

## 🏗️ Development & Build Commands

This project uses **Deno** natively to develop, lint, format, and bundle.

### 1. Build the Extension

Compile, bundle, and package the production zip archives:

```bash
deno task build
```

### 2. Live Rebuild (Watch Mode)

Re-compile extension automatically on file modifications:

```bash
deno task watch
```

### 3. Run Linter

Verify code style compliance:

```bash
deno task lint
```

### 4. Code Formatting

Format files to match style guideline:

```bash
deno task fmt
```

### 5. Run Unit Tests

Run standard cryptographic and utility test suites:

```bash
deno task test
```
