# Gistwarden - High-Security Personal Password Vault Extension

Gistwarden is an open-source browser extension designed to manage passwords,
one-time passwords (TOTP), secure notes, and passkeys (FIDO2/WebAuthn) securely,
privately, and completely free of charge.

## 📌 Motivation

The project was born out of a real-world personal need: **My Bitwarden Premium
subscription expired, and the renewal price was too expensive.**

Instead of paying annual fees for third-party cloud servers, Gistwarden was
developed to provide an **equivalent alternative** that runs independently,
leveraging your personal **GitHub Gist** as the encrypted database storage. Most
importantly, it is optimized for high security and is fully compatible with
Bitwarden exports.

---

## 🔒 Security Architecture

Gistwarden adopts a strict **Zero-Knowledge** architecture. All your data is
encrypted directly on your browser before being synced to your GitHub Gist. No
one — including GitHub or the extension developer — can read your data without
your Master Password.

### 1. Hardware-Resistant Key Derivation (KDF)

Instead of using the aging PBKDF2 algorithm which is highly susceptible to
brute-force attacks via hardware-accelerated systems (such as GPUs, FPGAs, and
ASICs), Gistwarden utilizes **Argon2id (WebAssembly)** — the winner of the
Password Hashing Competition and the current gold standard in key derivation.

- **Parameters:**
  - Memory: **64 MB**
  - Iterations: **3 rounds**
  - Parallelism: **1 thread** (Optimized for single-threaded extension
    environment).
- **Defense Capability:** Requiring 64MB of RAM for every single password
  attempt completely neutralizes GPU and ASIC advantages, making brute-force
  attacks economically and computationally infeasible.

### 2. Industry-Standard Encryption

Once the encryption key is derived using Argon2id, your vault data is protected
by:

- **AES-GCM 256-bit:** The industry standard for authenticated symmetric
  encryption (AEAD). It provides both confidentiality and data integrity. Any
  tampering with the encrypted data on GitHub Gist will cause decryption to fail
  immediately, preventing data injection or tampering attacks.
- **12-byte Random Initialization Vector (IV):** Generated using the browser's
  cryptographically secure random number generator API
  (`crypto.getRandomValues`) for each save operation. This ensures that even if
  you save identical passwords, the resulting ciphertexts stored on Gist will be
  completely different.

### 3. Secure WebAssembly Integration (Local WASM Package)

To comply with the strict Content Security Policy (CSP) guidelines of Chrome
Extension **Manifest V3**:

- The WebAssembly binary of the `hash-wasm` library is **base64-encoded and
  inlined directly** inside the extension's JS bundle.
- The extension is committed to **never downloading any external scripts or
  binaries** over the network. This eliminates the risk of Man-in-the-Middle
  (MITM) script injection attacks.

---

## 🔄 Compatibility with Bitwarden

Gistwarden supports direct imports of unencrypted JSON files exported from
Bitwarden:

- **Full Data Types Support:** Handles logins, secure notes, custom fields, and
  TOTP keys seamlessly.
- **Passkeys Support (FIDO2/WebAuthn):** Allows simulating, storing, and syncing
  passkeys securely via your GitHub Gist.
