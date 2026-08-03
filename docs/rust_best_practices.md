# Expert Rust Engineering Guidelines & Best Practices

A curated, concise reference of production-grade Rust rules and principles,
distilled from industry experts (Rust API Guidelines, _Rust for Rustaceans_ by
Jon Gjengset, _Effective Rust_ by David Drysdale, and matklad's engineering
rules).

---

## 1. Type System & State Modeling

- **Make Invalid States Unrepresentable:**
  - Use ADTs (`enum`) and the **Typestate Pattern** (compile-time state
    machines) so invalid state transitions fail at compile time instead of
    runtime.
- **Leverage the Newtype Pattern:**
  - Wrap primitive types (`struct UserId(u64);`, `struct SecretKey(Vec<u8>);`)
    to prevent domain confusion and accidental argument swapping.
- **Implement Standard Traits First:**
  - Derive or implement standard library traits (`Debug`, `Display`, `Clone`,
    `Default`, `AsRef`, `From`/`Into`, `TryFrom`) before creating custom traits.
  - Always derive `Debug` for all public types.
- **Idiomatic Serde Implementations:**
  - Avoid writing manual `impl Serialize` and `impl Deserialize` blocks for
    basic enums or structs unless customized logic is strictly required.
  - Use standard Serde attribute macros (`serde_repr`,
    `#[serde(rename_all = "...")]`, `#[serde(from = "...", into = "...")]`) to
    reduce boilerplate and guarantee correctness.

---

## 2. Ownership, Borrowing & Memory Efficiency

- **Avoid Fighting the Borrow Checker:**
  - If lifetime annotations (`'a`, `'b`, `'c`) become complex, reconsider the
    data model.
  - Prefer entity IDs or indices over nested references, or split large structs
    into smaller, independent components.
- **Zero-Allocation Mindset in Hot Paths:**
  - Avoid `.clone()`, `.to_string()`, `.to_lowercase()`, or heap allocations
    inside tight loops, iterators (`map`, `filter`, `retain`), and sorting
    comparison closures.
  - Pre-compute string transformations outside loops or perform zero-allocation
    ASCII/case-insensitive comparisons.
  - Use `&str` or `Cow<'a, str>` for read-only string transformations.
  - Use `SmallVec` or `ArrayVec` when buffer size bounds are known at compile
    time.
- **Direct Strongly-Typed Deserialization:**
  - Always perform direct strongly-typed deserialization
    (`serde_json::from_str::<MyStruct>`) instead of parsing into generic
    `serde_json::Value` trees followed by dynamic cloning.
  - Avoid `.clone()` on heavy domain structs during vector/map collection
    transfers when owned instances (`Vec<T>`) can be moved.
  - Use zero-allocation keys (e.g. borrowed tuple slices `(&str, &str)`) instead
    of `format!(...)` string allocations inside tight lookup/comparison loops.
- **Strict Concurrency Safety (`Send` & `Sync`):**
  - Clearly separate ownership transfer across threads (`Send`) from shared
    reference access across threads (`Sync`).

---

## 3. Idiomatic Error Handling

- **Recoverable Errors (`Result`) vs Unrecoverable Failures (`panic!`):**
  - Return `Result<T, E>` for recoverable runtime/domain errors.
  - Avoid `.unwrap()` and `.expect()` in production/library code. If an
    invariant guarantees safety, explicitly document it with a `// SAFETY:`
    rationale.
- **Standardized Error Keys across FFI/WASM Boundaries:**
  - Prefer standardized error constants/keys (`TranslationKey`) over ad-hoc raw
    error strings across FFI/WASM boundaries to enable clean i18n and
    predictable error handling.
- **Library vs Application Error Boundaries:**
  - **Libraries (`crates`):** Use strongly-typed enums (via `thiserror`) and
    expose predictable, domain-specific error types. Do not export `anyhow` in
    public crate APIs.
  - **Applications/Services:** Use `anyhow` or `eyre` for easy error context
    chaining (`.context()`).
- **Flat Error Propagation:**
  - Use the `?` operator combined with `.map_err()` for clean, flat control flow
    without deep nested `match` statements.

---

## 4. Architecture & Layer Boundaries

- **Avoid Premature Abstraction (YAGNI):**
  - Do not create traits for single implementations unless required for unit
    test mocking.
  - Keep code simple and explicit; optimize performance only after profiling
    (`flamegraph`, `criterion`).
- **Decoupled Architecture & Boundary Isolation:**
  - Isolate pure domain logic (in-memory state, calculations) from I/O
    dependencies (Database, Network, File System, WASM boundary). Domain modules
    must never depend directly on I/O drivers.
- **Locale-Agnostic Core Modules:**
  - Core modules (such as WASM or domain crates) MUST remain strictly
    locale-agnostic and free from hardcoded UI/presentation fallback strings
    (e.g., hardcoded default presentation names). Presentation formatting and
    localization must be handled at the i18n/UI layer.
- **Strict `unsafe` Boundary Governance:**
  - Encapsulate all `unsafe` blocks inside safe, public API abstractions.
  - Every `unsafe` block must be accompanied by a `// SAFETY:` comment proving
    memory invariants.

---

## 5. Tooling & Quality Assurance

- **Automated Clippy Enforcement:**
  - Run `cargo clippy -- -D warnings` on every CI build.
  - Enable `#![warn(clippy::pedantic)]` at crate root where appropriate to catch
    anti-patterns early.
- **Runnable Documentation Tests (`doctests`):**
  - Write doc comments (`///`) with executable code blocks. Verify docs stay in
    sync via `cargo test`.
- **Standard Formatting:**
  - Enforce `cargo fmt` formatting across all workspace crates.

---

## 6. WebAssembly (WASM) & FFI Boundaries

- **WASM Binary Size Optimization Profile:**
  - Enforce standard release profile optimization in `Cargo.toml`
    (`opt-level = "z"`, `lto = true`, `codegen-units = 1`, `panic = "abort"`,
    `strip = true`) to minimize binary payload size.
  - _(Source:
    [Rust & WebAssembly Book — Shrinking .wasm Code Size](https://rustwasm.github.io/docs/book/reference/code-size.html))_
- **Direct `JsValue` Memory Transfers:**
  - For high-frequency FFI calls or large payloads, use `serde-wasm-bindgen`
    with direct `JsValue` serialization instead of double JSON string parsing
    (`serde_json::to_string` / `from_str`).
  - _(Source:
    [wasm-bindgen Guide — Serde Support](https://rustwasm.github.io/wasm-bindgen/))_
- **FFI Boundary Exception Safety:**
  - Never allow an uncaught `panic!` to cross the WASM boundary into JS.
    Exported `#[wasm_bindgen]` functions must return `Result<T, E>` and map
    errors into predictable JS representations or standardized error keys
    (`TranslationKey`).
  - _(Source:
    [Rust & WebAssembly Book — Error Handling](https://rustwasm.github.io/docs/book/))_

---

## 7. Cryptography & Security Memory Rules

- **Constant-Time Comparison for Secret Tokens & Hashes:**
  - Always compare secret buffers, password hashes, and HMAC tokens using
    constant-time equality primitives (`subtle::ConstantTimeEq`) to prevent
    side-channel timing attack exploits.
  - _(Source: [RustCrypto Working Group — subtle crate](https://docs.rs/subtle)
    & Effective Rust)_
- **Sensitive RAM Zeroization on Drop:**
  - Overwrite sensitive materials (master password bytes, private key slices,
    encryption keys) in RAM immediately after use via `zeroize::Zeroize` /
    `ZeroizeOnDrop` to prevent leakage in heap dumps or memory inspections.
  - _(Source:
    [RustCrypto Working Group — zeroize crate](https://docs.rs/zeroize))_

---

## 8. Collection Pre-allocation & Iterators

- **Collection Capacity Pre-allocation:**
  - Pre-allocate vector and map buffers using `Vec::with_capacity(n)` and
    `HashMap::with_capacity(n)` when allocation bounds are known, preventing
    heap fragmentation and reallocation overhead in hot loops.
  - _(Source: _Rust for Rustaceans_ — Jon Gjengset, Chapter 3: Memory
    Efficiency)_
- **Idiomatic Iterator Chains over Manual Indexing:**
  - Prefer iterator combinators (`filter_map`, `fold`, `collect`, `try_fold`)
    over indexed loops (`for i in 0..len`). Iterators eliminate bounds check
    overhead and allow LLVM auto-vectorization optimizations.
  - _(Source: _Effective Rust_ — David Drysdale, Item 9: Iterators & matklad's
    Engineering Rules)_

---

## 9. Domain Extension Traits & Ergonomic Accessors

- **Extension Traits for Domain Encapsulation:**
  - Define extension traits (`pub trait VaultItemExt`) to provide uniform, clean
    accessors across domain entities without exposing internal struct fields
    directly or forcing nested `if let Some` checks at call sites.
- **Standard `Display` and `AsRef` Coercions:**
  - Implement `std::fmt::Display` and `AsRef<str>` for domain wrappers
    (`ItemType`, `Folder`, `LoginUri`) to support natural string formatting
    (`to_string()`, `println!`) and zero-allocation slice coercions
    (`u.as_ref()`).
  - _(Source:
    [Rust API Guidelines — C-CONV & C-TRAIT](https://rust-lang.github.io/api-guidelines/naming.html#c-conv)
    & _Effective Rust_ — Item 12: Extension Traits)_

---

## Key References

- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [Rust & WebAssembly Book](https://rustwasm.github.io/docs/book/) — Official
  Rust WASM Working Group
- _Rust for Rustaceans_ — Jon Gjengset
- _Effective Rust: 35 Specific Ways to Improve Your Rust Code_ — David Drysdale
- Aleksey Kladov (matklad) Blog —
  [matklad.github.io](https://matklad.github.io/)
- [RustCrypto Working Group Documentation](https://github.com/RustCrypto)
