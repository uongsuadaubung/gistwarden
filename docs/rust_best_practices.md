# Expert Rust Engineering Guidelines & Best Practices

A curated, concise reference of production-grade Rust rules and principles,
distilled from industry experts (Rust API Guidelines, _Rust for Rustaceans_ by
Jon Gjengset, _Effective Rust_ by David Drysdale, Mara Bos's _Rust Atomics and
Locks_, and matklad's engineering rules).

---

## 1. Type System & State Modeling

- **Make Invalid States Unrepresentable:**
  - Use ADTs (`enum`) to model state machines so invalid state transitions fail at compile time instead of runtime. For Serde-serialized DTOs, use tagged enums rather than generic Typestate patterns (`struct Order<State>`) to keep serialization simple.
  - ❌ **Bad:**
    ```rust
    struct Order {
        is_paid: bool,
        payment_id: Option<String>,
        shipped_at: Option<u64>,
    }
    ```
  - ✅ **Good:**
    ```rust
    enum OrderState {
        Unpaid,
        Paid { payment_id: String },
        Shipped { payment_id: String, shipped_at: u64 },
    }
    struct Order {
        id: u64,
        state: OrderState,
    }
    ```

- **Leverage the Newtype Pattern:**
  - Wrap primitive types (`struct UserId(u64);`, `struct SecretKey(Vec<u8>);`)
    to prevent domain confusion and accidental argument swapping.
  - ❌ **Bad:** `fn transfer(user_id: u64, amount: u64)`
  - ✅ **Good:**
    ```rust
    struct UserId(u64);
    struct Amount(u64);
    fn transfer(user_id: UserId, amount: Amount)
    ```

- **Implement Standard Traits First:**
  - Derive or implement standard library traits (`Debug`, `Display`, `Clone`,
    `Default`, `AsRef`, `From`/`Into`, `TryFrom`) before creating custom traits.
  - Always derive `Debug` for all public types.
  - ❌ **Bad:**
    ```rust
    struct User { id: u64, name: String }
    impl User {
        fn print(&self) { println!("{}: {}", self.id, self.name); }
    }
    ```
  - ✅ **Good:**
    ```rust
    #[derive(Debug, Clone, PartialEq, Eq, Default)]
    struct User { id: u64, name: String }

    impl std::fmt::Display for User {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{}: {}", self.id, self.name)
        }
    }
    ```

- **Idiomatic Serde Implementations:**
  - Avoid writing manual `impl Serialize` and `impl Deserialize` blocks for
    basic enums or structs unless customized logic is strictly required.
  - Use standard Serde attribute macros (`serde_repr`,
    `#[serde(rename_all = "...")]`, `#[serde(from = "...", into = "...")]`) to
    reduce boilerplate and guarantee correctness.
  - ❌ **Bad:** Manual 40-line `impl<'de> Deserialize<'de>` for custom string enum casing.
  - ✅ **Good:**
    ```rust
    #[derive(Serialize, Deserialize)]
    #[serde(rename_all = "snake_case")]
    enum Status {
        PendingApproval,
        Active,
    }
    ```

---

## 2. Ownership, Borrowing & Memory Efficiency

- **Avoid Fighting the Borrow Checker:**
  - If lifetime annotations (`'a`, `'b`, `'c`) become complex, reconsider the
    data model.
  - Prefer entity IDs or indices over nested references, or split large structs
    into smaller, independent components.
  - ❌ **Bad:**
    ```rust
    struct Node<'a> {
        parent: Option<&'a Node<'a>>,
        children: Vec<&'a Node<'a>>,
    }
    ```
  - ✅ **Good:**
    ```rust
    #[derive(Copy, Clone, PartialEq, Eq, Hash)]
    struct NodeId(usize);

    struct Node {
        parent: Option<NodeId>,
        children: Vec<NodeId>,
    }
    ```

- **Zero-Allocation Mindset in Hot Paths:**
  - Avoid `.clone()`, `.to_string()`, `.to_lowercase()`, or heap allocations
    inside tight loops, iterators (`map`, `filter`, `retain`), and sorting
    comparison closures.
  - Pre-compute string transformations outside loops or perform zero-allocation
    ASCII/case-insensitive comparisons.
  - Use `&str` or `Cow<'a, str>` for read-only string transformations.
  - Use `SmallVec` or `ArrayVec` when buffer size bounds are known at compile
    time.
  - ❌ **Bad:** `items.iter().filter(|x| x.to_lowercase() == "admin")`
  - ✅ **Good:** `items.iter().filter(|x| x.eq_ignore_ascii_case("admin"))`

- **Direct Strongly-Typed Deserialization:**
  - Always perform direct strongly-typed deserialization
    (`serde_json::from_str::<MyStruct>`) instead of parsing into generic
    `serde_json::Value` trees followed by dynamic cloning.
  - Avoid `.clone()` on heavy domain structs during vector/map collection
    transfers when owned instances (`Vec<T>`) can be moved.
  - Use zero-allocation keys (e.g. borrowed tuple slices `(&str, &str)`) instead
    of `format!(...)` string allocations inside tight lookup/comparison loops.
  - ❌ **Bad:**
    ```rust
    let val: serde_json::Value = serde_json::from_str(json)?;
    let name = val["user"]["name"].as_str().unwrap().to_string();
    ```
  - ✅ **Good:**
    ```rust
    #[derive(Deserialize)]
    struct UserPayload { name: String }
    #[derive(Deserialize)]
    struct Envelope { user: UserPayload }
    let data: Envelope = serde_json::from_str(json)?;
    ```

- **Strict Concurrency Safety (`Send` & `Sync`):**
  - Clearly separate ownership transfer across threads (`Send`) from shared
    reference access across threads (`Sync`).
  - ❌ **Bad:** Attempting to share `Rc<RefCell<T>>` across thread boundaries.
  - ✅ **Good:** `Arc<Mutex<T>>` or `Arc<RwLock<T>>` for thread-safe shared mutable state.

---

## 3. Idiomatic Error Handling

- **Recoverable Errors (`Result`) vs Unrecoverable Failures (`panic!`):**
  - Return `Result<T, E>` for recoverable runtime/domain errors.
  - Avoid `.unwrap()` and `.expect()` in production/library code. If an
    invariant guarantees safety, explicitly document it with a `// SAFETY:`
    rationale.
  - ❌ **Bad:** `let config = std::fs::read_to_string("config.toml").unwrap();`
  - ✅ **Good:** `let config = std::fs::read_to_string("config.toml").map_err(AppError::ConfigRead)?;`

- **Standardized Error Keys across FFI/WASM Boundaries:**
  - Prefer standardized error constants/keys (`TranslationKey`) over ad-hoc raw
    error strings across FFI/WASM boundaries to enable clean i18n and
    predictable error handling.
  - ❌ **Bad:** `return Err(JsValue::from_str("Failed to parse JSON string at pos 12"));`
  - ✅ **Good:** `return Err(TranslationKey::ErrInvalidJsonFormat.into());`

- **Library vs Application Error Boundaries:**
  - **Libraries (`crates`):** Use strongly-typed enums (via `thiserror`) and
    expose predictable, domain-specific error types. Do not export `anyhow` in
    public crate APIs.
  - **Applications/Services:** Use `anyhow` or `eyre` for easy error context
    chaining (`.context()`).
  - ❌ **Bad:** Public library API returning `anyhow::Result<T>`.
  - ✅ **Good:**
    - **Library (`thiserror`):**
      ```rust
      #[derive(thiserror::Error, Debug)]
      pub enum VaultError {
          #[error("Item not found: {0}")]
          NotFound(String),
      }
      ```
    - **Application (`anyhow`):**
      ```rust
      let data = read_vault().context("Failed to read vault during startup")?;
      ```

- **Flat Error Propagation:**
  - Use the `?` operator combined with `.map_err()` for clean, flat control flow
    without deep nested `match` statements.
  - ❌ **Bad:**
    ```rust
    match open_file() {
        Ok(file) => match read_header(file) {
            Ok(header) => Ok(header),
            Err(e) => Err(e),
        },
        Err(e) => Err(e),
    }
    ```
  - ✅ **Good:**
    ```rust
    let file = open_file()?;
    let header = read_header(file)?;
    Ok(header)
    ```

---

## 4. Architecture & Layer Boundaries

- **Avoid Premature Abstraction (YAGNI):**
  - Do not create traits for single implementations unless required for unit
    test mocking.
  - Keep code simple and explicit; optimize performance only after profiling
    (`flamegraph`, `criterion`).
  - ❌ **Bad:** Creating `trait UserStore` and `struct UserStoreImpl` when there is only one concrete implementation and no dynamic dispatch or mocking required.
  - ✅ **Good:** `pub struct UserStore { ... }` with direct methods.

- **Decoupled Architecture & Boundary Isolation:**
  - Isolate pure domain logic (in-memory state, calculations) from I/O
    dependencies (Database, Network, File System, WASM boundary). Domain modules
    must never depend directly on I/O drivers.
  - ❌ **Bad:**
    ```rust
    impl User {
        pub async fn save(&self, db: &sqlx::PgPool) -> Result<(), SqlError> { ... }
    }
    ```
  - ✅ **Good:**
    ```rust
    // Domain entity is pure memory state
    pub struct User { pub id: UserId, pub name: String }
    // Repository handles database I/O
    pub struct UserRepository { pool: PgPool }
    impl UserRepository {
        pub async fn save(&self, user: &User) -> Result<(), SqlError> { ... }
    }
    ```

- **Locale-Agnostic Core Modules:**
  - Core modules (such as WASM or domain crates) MUST remain strictly
    locale-agnostic and free from hardcoded UI/presentation fallback strings
    (e.g., hardcoded default presentation names). Presentation formatting and
    localization must be handled at the i18n/UI layer.
  - ❌ **Bad:** Core domain returning localized presentation string: `"Danh mục mặc định"` or `"Invalid password length"`.
  - ✅ **Good:** Core domain returning programmatic enum keys (`FolderKind::Default`, `TranslationKey::ErrPasswordTooShort`). Presentation layer handles i18n mapping.

- **Strict `unsafe` Boundary Governance:**
  - Encapsulate all `unsafe` blocks inside safe, public API abstractions.
  - Every `unsafe` block must be accompanied by a `// SAFETY:` comment proving
    memory invariants.
  - ❌ **Bad:**
    ```rust
    pub fn get_slice<'a>(ptr: *const u8, len: usize) -> &'a [u8] {
        unsafe { std::slice::from_raw_parts(ptr, len) }
    }
    ```
  - ✅ **Good:**
    ```rust
    pub fn get_slice<'a>(ptr: *const u8, len: usize) -> &'a [u8] {
        // SAFETY: Caller guarantees `ptr` is non-null, aligned, points to `len`
        // initialized bytes, and remains valid for lifetime `'a`.
        unsafe { std::slice::from_raw_parts(ptr, len) }
    }
    ```

---

## 5. Tooling & Quality Assurance

- **Automated Clippy Enforcement:**
  - Run `cargo clippy -- -D warnings` on every CI build.
  - Enable `#![warn(clippy::pedantic)]` at crate root where appropriate to catch
    anti-patterns early.
  - ❌ **Bad:** `#![allow(clippy::all)]` or ignoring clippy warnings in CI.
  - ✅ **Good:** In `main.rs`/`lib.rs`: `#![warn(clippy::pedantic)]`, and in CI pipeline: `cargo clippy -- -D warnings`.

- **Runnable Documentation Tests (`doctests`):**
  - Write doc comments (`///`) with executable code blocks. Verify docs stay in
    sync via `cargo test`.
  - ❌ **Bad:** `/// ```text` code blocks or non-compiling doc examples.
  - ✅ **Good:**
    ```rust
    /// Adds two numbers together.
    ///
    /// ```rust
    /// use my_crate::add;
    /// assert_eq!(add(2, 3), 5);
    /// ```
    pub fn add(a: i32, b: i32) -> i32 { a + b }
    ```

- **Standard Formatting:**
  - Enforce `cargo fmt` formatting across all workspace crates.
  - ❌ **Bad:** Inconsistent indentation or mixed formatting styles across workspace files.
  - ✅ **Good:** Enforce standard formatting in CI with `cargo fmt --check`.

---

## 6. WebAssembly (WASM) & FFI Boundaries

- **WASM Binary Size Optimization Profile:**
  - Enforce standard release profile optimization in `Cargo.toml`
    (`opt-level = "z"`, `lto = true`, `codegen-units = 1`, `panic = "abort"`,
    `strip = true`) to minimize binary payload size.
  - _(Source:
    [Rust & WebAssembly Book — Shrinking .wasm Code Size](https://rustwasm.github.io/docs/book/reference/code-size.html))_
  - ❌ **Bad:** Default release settings resulting in 2MB+ `.wasm` files.
  - ✅ **Good:**
    ```toml
    [profile.release]
    opt-level = "z"
    lto = true
    codegen-units = 1
    panic = "abort"
    strip = true
    ```

- **Direct `JsValue` Memory Transfers:**
  - For high-frequency FFI calls or large payloads, use `serde-wasm-bindgen`
    with direct `JsValue` serialization instead of double JSON string parsing
    (`serde_json::to_string` / `from_str`).
  - _(Source:
    [wasm-bindgen Guide — Serde Support](https://rustwasm.github.io/wasm-bindgen/))_
  - ❌ **Bad:**
    ```rust
    #[wasm_bindgen]
    pub fn process_data(data: &str) -> String {
        let val: MyData = serde_json::from_str(data).unwrap();
        serde_json::to_string(&val).unwrap()
    }
    ```
  - ✅ **Good:**
    ```rust
    #[wasm_bindgen]
    pub fn process_data(val: JsValue) -> Result<JsValue, JsValue> {
        let data: MyData = serde_wasm_bindgen::from_value(val)?;
        let result = serde_wasm_bindgen::to_value(&data)?;
        Ok(result)
    }
    ```

- **FFI Boundary Exception Safety:**
  - Never allow an uncaught `panic!` to cross the WASM boundary into JS.
    Exported `#[wasm_bindgen]` functions must return `Result<T, E>` and map
    errors into predictable JS representations or standardized error keys
    (`TranslationKey`).
  - _(Source:
    [Rust & WebAssembly Book — Error Handling](https://rustwasm.github.io/docs/book/))_
  - ❌ **Bad:** `#[wasm_bindgen] pub fn run() { panic!("unrecoverable error"); }`
  - ✅ **Good:**
    ```rust
    #[wasm_bindgen]
    pub fn run() -> Result<(), JsValue> {
        let res = perform_work().map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(res)
    }
    ```

---

## 7. Cryptography & Security Memory Rules

- **Constant-Time Comparison for Secret Tokens & Hashes:**
  - Always compare secret buffers, password hashes, and HMAC tokens using
    constant-time equality primitives (`subtle::ConstantTimeEq`) to prevent
    side-channel timing attack exploits.
  - _(Source: [RustCrypto Working Group — subtle crate](https://docs.rs/subtle)
    & Effective Rust)_
  - ❌ **Bad:** `if user_token == secret_hash { ... }` (vulnerable to timing attacks)
  - ✅ **Good:**
    ```rust
    use subtle::ConstantTimeEq;
    if user_token.ct_eq(&secret_hash).into() { ... }
    ```

- **Sensitive RAM Zeroization on Drop:**
  - Overwrite sensitive materials (master password bytes, private key slices,
    encryption keys) in RAM immediately after use via `zeroize::Zeroize` /
    `ZeroizeOnDrop` to prevent leakage in heap dumps or memory inspections.
  - _(Source:
    [RustCrypto Working Group — zeroize crate](https://docs.rs/zeroize))_
  - ❌ **Bad:**
    ```rust
    struct MasterKey([u8; 32]);
    ```
  - ✅ **Good:**
    ```rust
    use zeroize::ZeroizeOnDrop;

    #[derive(ZeroizeOnDrop)]
    struct MasterKey([u8; 32]);
    ```

---

## 8. Collection Pre-allocation & Iterators

- **Collection Capacity Pre-allocation:**
  - Pre-allocate vector and map buffers using `Vec::with_capacity(n)` and
    `HashMap::with_capacity(n)` when allocation bounds are known, preventing
    heap fragmentation and reallocation overhead in hot loops.
  - _(Source: _Rust for Rustaceans_ — Jon Gjengset, Chapter 3: Memory
    Efficiency)_
  - ❌ **Bad:** `let mut vec = Vec::new(); for i in 0..10_000 { vec.push(i); }`
  - ✅ **Good:** `let mut vec = Vec::with_capacity(10_000); for i in 0..10_000 { vec.push(i); }`

- **Idiomatic Iterator Chains over Manual Indexing:**
  - Prefer iterator combinators (`filter_map`, `fold`, `collect`, `try_fold`)
    over indexed loops (`for i in 0..len`). Iterators eliminate bounds check
    overhead and allow LLVM auto-vectorization optimizations.
  - ❌ **Bad:**
    ```rust
    let mut out = Vec::new();
    for i in 0..items.len() {
        if items[i].is_active {
            out.push(items[i].id);
        }
    }
    ```
  - ✅ **Good:**
    ```rust
    let out: Vec<_> = items.iter()
        .filter(|item| item.is_active)
        .map(|item| item.id)
        .collect();
    ```

- **LLVM Scalar Evolution (SCEV) & SIMD Auto-Vectorization:**
  - Indexed loops (`vec[i]`) force the compiler to insert runtime bounds checks (`panic_bounds_check`). These conditional panic branches disrupt the Control Flow Graph (CFG), preventing LLVM from performing SIMD auto-vectorization (AVX2/AVX-512). Iterator chains (`.iter()`, `.map()`, `.filter()`) allow LLVM's Scalar Evolution (SCEV) pass to mathematically prove bounds safety, completely eliminating bounds checks and triggering automatic SIMD vectorization.
  - _(Source: LLVM Vectorizer & Scalar Evolution Documentation)_
  - ❌ **Bad:**
    ```rust
    let mut sum = 0;
    for i in 0..data.len() {
        sum += data[i]; // Bounds check in each loop iteration prevents SIMD
    }
    ```
  - ✅ **Good:**
    ```rust
    let sum: u64 = data.iter().sum(); // SCEV proves bounds safety, enables SIMD vectorization
    ```

---

## 9. Domain Extension Traits & Ergonomic Accessors

- **Extension Traits for Domain Encapsulation:**
  - Define extension traits (`pub trait VaultItemExt`) to provide uniform, clean
    accessors across domain entities without exposing internal struct fields
    directly or forcing nested `if let Some` checks at call sites.
  - ❌ **Bad:** Repeating nested pattern matches across call sites:
    ```rust
    if let Some(sec) = &item.security {
        if let Some(key) = &sec.api_key { ... }
    }
    ```
  - ✅ **Good:**
    ```rust
    pub trait VaultItemExt {
        fn api_key(&self) -> Option<&str>;
    }

    impl VaultItemExt for VaultItem {
        fn api_key(&self) -> Option<&str> {
            self.security.as_ref()?.api_key.as_deref()
        }
    }
    ```

- **Standard `Display` and `AsRef` Coercions:**
  - Implement `std::fmt::Display` and `AsRef<str>` for domain wrappers
    (`ItemType`, `Folder`, `LoginUri`) to support natural string formatting
    (`to_string()`, `println!`) and zero-allocation slice coercions
    (`u.as_ref()`).
  - _(Source:
    [Rust API Guidelines — C-CONV & C-TRAIT](https://rust-lang.github.io/api-guidelines/naming.html#c-conv)
    & _Effective Rust_ — Item 12: Extension Traits)_
  - ❌ **Bad:** Creating custom methods `item.to_string_custom()` or `item.get_raw_slice()`
  - ✅ **Good:**
    ```rust
    impl std::fmt::Display for UserId {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{}", self.0)
        }
    }

    impl AsRef<str> for UserId {
        fn as_ref(&self) -> &str { &self.0 }
    }
    ```

---

## 10. Single-Threaded WebAssembly Async & Non-Blocking Execution

- **Single-Threaded WASM Execution (`wasm32-unknown-unknown`):**
  - Client-side extension WASM modules execute inside the browser single-threaded environment without `std::thread`.
  - Avoid multi-threaded async runtimes (such as `tokio` or `async-std`). Keep WASM functions synchronous where possible, or return `js_sys::Promise` / single-threaded futures.
  - ❌ **Bad:** Pulling `tokio` runtime dependencies into single-threaded WASM extension crates.
  - ✅ **Good:** Exporting synchronous WASM functions or using lightweight single-threaded WebAssembly futures without `Send + Sync` bounds.

- **Prefer Native Async Traits over Boxed Futures:**
  - In modern Rust 2024, use native `async fn` in traits instead of `#[async_trait]` macro dependencies where async traits are required.

---

## 11. Testing, Fuzzing & Verification

- **Faster, More Reliable Test Runs:**
  - Use `cargo-nextest` in CI instead of `cargo test` for better isolation (each
    test in its own process), clearer failure output, and faster parallel
    execution.
  - ❌ **Bad:** Relying on `cargo test` when individual tests race over global shared environment or file locks.
  - ✅ **Good:** Using `cargo nextest run` to run each test in its own isolated process.

- **Property-Based Testing:**
  - For invariants that should hold across a wide input space (parsers,
    serialization round-trips, math), use `proptest` or `quickcheck` rather than
    relying solely on hand-picked example-based unit tests.
  - ❌ **Bad:** Testing parsers with 2 hardcoded example inputs.
  - ✅ **Good:**
    ```rust
    use proptest::prelude::*;

    proptest! {
        #[test]
        fn test_parse_roundtrip(s in "\\PC*") {
            let encoded = encode(&s);
            let decoded = decode(&encoded).unwrap();
            prop_assert_eq!(s, decoded);
        }
    }
    ```

- **Detecting Undefined Behavior in `unsafe` Code:**
  - Run `cargo miri test` in CI for any crate containing `unsafe` blocks to
    catch UB (uninitialized reads, data races, invalid pointer use) that normal
    test runs cannot detect.
  - ❌ **Bad:** Relying on `cargo test` passing to verify `unsafe` raw pointer arithmetic.
  - ✅ **Good:** Running `cargo miri test` in CI to detect memory leaks, unaligned reads, or invalid pointer aliases.

- **Fuzzing Untrusted Input Boundaries:**
  - Use `cargo-fuzz` (libFuzzer-based) on parsers, deserializers, and any code
    that processes untrusted or external input.
  - ❌ **Bad:** Only running unit tests with valid JSON payloads.
  - ✅ **Good:**
    ```rust
    #![no_main]
    use libfuzzer_sys::fuzz_target;

    fuzz_target!(|data: &[u8]| {
        let _ = parse_payload(data);
    });
    ```

- **Snapshot Testing for Complex Output:**
  - For large structured output (generated code, rendered templates, complex
    data structures), use `insta` snapshot tests instead of manually asserting
    on individual fields.
  - ❌ **Bad:** Writing 50 lines of `assert_eq!(ast.nodes[0].kind, ...)`
  - ✅ **Good:**
    ```rust
    #[test]
    fn test_ast_output() {
        let ast = parse_source("fn main() {}");
        insta::assert_yaml_snapshot!(ast);
    }
    ```

---

## 12. Dependency & Supply-Chain Management

- **License and Advisory Policy Enforcement:**
  - Use `cargo-deny` in CI to enforce license allowlists, ban duplicate or
    explicitly disallowed crates, and check for security advisories in one pass.
  - ❌ **Bad:** Unmonitored dependencies with unknown licenses entering the codebase.
  - ✅ **Good:** Configured `deny.toml` and executing `cargo deny check` in CI pipelines.

- **Vulnerability Scanning:**
  - Run `cargo-audit` against the RustSec Advisory Database in CI to catch known
    vulnerabilities in the dependency tree.
  - ❌ **Bad:** Ignoring security advisories for crates in `Cargo.lock`.
  - ✅ **Good:** Adding `cargo audit` to daily or PR CI workflows.

- **SemVer Compliance Checks:**
  - Run `cargo-semver-checks` (e.g. `cargo semver-checks`) before publishing to
    catch accidental breaking changes against the last published version.
    Configure per-lint `level` (`deny`/`warn`/`allow`) and `required-update`
    (`major`/`minor`) at the workspace or package level rather than relying on
    manual review alone.
  - ❌ **Bad:** Accidentally introducing breaking API signature changes in minor package releases.
  - ✅ **Good:** Running `cargo semver-checks` before publishing crate releases.

- **Pin and Verify MSRV:**
  - Declare the Minimum Supported Rust Version via the `rust-version` field in
    `Cargo.toml`, and verify it with a dedicated CI job pinned to that toolchain
    — don't let MSRV drift silently as new syntax gets used.
  - ❌ **Bad:** Relying on bleeding-edge compiler features without documenting or testing the minimum required version.
  - ✅ **Good:** Defining `rust-version = "1.80"` in `Cargo.toml` and testing on toolchain `1.80` in CI.

---

## 13. Observability & Diagnostics

- **Structured, Span-Based Logging:**
  - Prefer the `tracing` crate over `log` for anything concurrent or async —
    `tracing` captures causally-related spans (e.g. "this log line happened
    during this request's handling on this task"), which plain flat log lines
    cannot represent.
  - ❌ **Bad:** `log::info!("User {} logged in from IP {}", user_id, ip);`
  - ✅ **Good:** `tracing::info!(user_id = %user_id, ip = %ip, "User logged in");`

- **Instrument Rather Than Manually Log:**
  - Use `#[tracing::instrument]` on key functions to automatically capture
    entry/exit, arguments, and timing, instead of scattering manual log/println
    calls through the function body.
  - ❌ **Bad:**
    ```rust
    fn handle_req(req: &Request) {
        log::info!("Starting request {:?}", req.id);
        // work
        log::info!("Finished request {:?}", req.id);
    }
    ```
  - ✅ **Good:**
    ```rust
    #[tracing::instrument(skip(req), fields(req_id = %req.id))]
    fn handle_req(req: &Request) {
        // automatic span entry/exit & timing
    }
    ```

---

## 14. Generics, Dispatch & API Design

- **Static Dispatch by Default, Dynamic Dispatch at Boundaries:**
  - Prefer generics / `impl Trait` (static dispatch, monomorphized, inlinable)
    in hot paths and internal APIs. Reach for `dyn Trait` (dynamic dispatch) at
    plugin boundaries, heterogeneous collections, or where compile-time
    monomorphization cost/binary size is a concern.
  - ❌ **Bad:** `fn process(handler: Box<dyn Handler>)` when static dispatch is sufficient.
  - ✅ **Good:** `fn process(handler: impl Handler)` or `fn process<H: Handler>(handler: H)`.

- **Full Rust API Guidelines Naming Conventions:**
  - Beyond casing (`C-CASE`), follow the full naming checklist: conversion
    method prefixes encode cost and ownership (`as_` = cheap borrow, `to_` =
    expensive/owned copy, `into_` = consuming conversion); getters omit a `get_`
    prefix (`C-GETTER`); iterator constructors follow
    `iter`/`iter_mut`/`into_iter` conventions (`C-ITER`).
  - ❌ **Bad:** `fn get_user_name(&self) -> String`
  - ✅ **Good:** `fn user_name(&self) -> &str`

- **Builder Pattern for Complex Construction:**
  - For structs with several optional or many-combination fields, prefer a
    builder (`XyzBuilder`) over multiple constructor overloads or long
    positional-argument constructors.
  - ❌ **Bad:** `Config::new(host, port, ssl, timeout, retries, pool_size, cache)`
  - ✅ **Good:**
    ```rust
    ConfigBuilder::default()
        .host(host)
        .port(port)
        .ssl(ssl)
        .build()
    ```

---

## 15. Module & Workspace Organization

- **Cargo Workspaces for Layer Isolation:**
  - Use a Cargo workspace to split a large project into focused crates whose
    boundaries mirror the architectural isolation described in Section 4 (domain
    crate, I/O/driver crates, application crate) rather than relying on
    module-level discipline alone within one crate.
  - ❌ **Bad:** Single monolithic crate mixing database schemas, WASM bindings, and core domain logic.
  - ✅ **Good:** Workspace layout: `crates/domain`, `crates/db`, `crates/wasm`.

- **Minimal Visibility by Default:**
  - Default to `pub(crate)` (or narrower, e.g. `pub(super)`) and only widen to
    `pub` when an item is intentionally part of the crate's external API — this
    keeps the real public surface (and thus the semver contract) deliberate
    rather than accidental.
  - ❌ **Bad:** Marking internal helper functions and structs as `pub`.
  - ✅ **Good:** Using `pub(crate)` or `pub(super)` for internal crate items.

---

## 16. Build Profiles, Binary Size & CI Optimization

- **Cargo Release Profiles:**
  - Configure split profiles in `Cargo.toml`: use `opt-level = 0` for fast local
    dev/test cycles, and `opt-level = "z"` / `3` with LTO (`lto = true`) and
    binary stripping (`strip = true`) for production release binaries.
  - ❌ **Bad:** Default release profile with full debug info and un-optimized binary size.
  - ✅ **Good:**
    ```toml
    [profile.release]
    opt-level = "z"
    lto = true
    codegen-units = 1
    panic = "abort"
    strip = true
    ```

- **Dependency Caching in CI:**
  - Use `swatinem/rust-cache` or `sccache` in CI build workflows to cache
    compiled dependency artifacts across pipeline runs, cutting CI build
    execution times by up to 70%.
  - ❌ **Bad:** Re-downloading and re-compiling all dependencies on every CI trigger.
  - ✅ **Good:** Using `swatinem/rust-cache` action step in GitHub Actions.

---

## 17. Idiomatic Rust Syntax & Control Flow Patterns (With Code Examples)

- **Early Exit with `let-else` (Rust 1.65+ / Rust 2024):**
  - Use `let-else` statements to unwrap and extract values for happy-path execution, avoiding nested `if let` pyramids or verbose `match` blocks. The `else` block must diverge (`return`, `break`, `continue`, or `panic!`).
  - ❌ **Bad:**
    ```rust
    let name = if let Some(val) = option_val {
        val
    } else {
        return Err(Error::MissingName);
    };
    ```
  - ✅ **Good:**
    ```rust
    let Some(name) = option_val else {
        return Err(Error::MissingName);
    };
    ```

- **Borrow Coercion in Function Parameters (API Flexibility):**
  - Accept borrowed slice types (`&str`, `&[T]`, `&Path`) instead of owned container references (`&String`, `&Vec<T>`, `&PathBuf`), or generic `impl AsRef<Path>`/`impl AsRef<str>`. This enables callers to pass borrowed literals, slices, or owned types without converting.
  - ❌ **Bad:** `fn process_user(name: &String, tags: &Vec<String>, path: &PathBuf)`
  - ✅ **Good:** `fn process_user(name: &str, tags: &[String], path: &Path)` or `fn process_user(path: impl AsRef<Path>)`

- **Lazy Evaluation for Fallbacks (`unwrap_or_else` & `ok_or_else`):**
  - Prefer `unwrap_or_else(|| ...)` and `ok_or_else(|| ...)` over `unwrap_or(...)` / `ok_or(...)` when the fallback requires heap allocation (`String::from`), function computation, or error construction. Eager fallback arguments are evaluated regardless of whether the `Option`/`Result` is populated.
  - ❌ **Bad:** `opt.unwrap_or(String::from("default_expensive_string"))`
  - ✅ **Good:** `opt.unwrap_or_else(|| String::from("default_expensive_string"))`

- **Idiomatic Ownership & Field Extraction (`Option::take`, `mem::take`, `mem::replace`):**
  - Use `Option::take()` or `std::mem::take(&mut field)` to take ownership out of a mutable reference or struct field leaving `Default::default()`, avoiding verbose `std::mem::replace(&mut opt, None)` calls.
  - ❌ **Bad:** `let old = std::mem::replace(&mut self.opt_data, None);`
  - ✅ **Good:** `let old = self.opt_data.take();`
  - ❌ **Bad:** `let old = std::mem::replace(&mut self.buffer, Vec::new());`
  - ✅ **Good:** `let old = std::mem::take(&mut self.buffer);`

- **Standard Reference Conversions (`.as_deref()`, `.copied()`, `.cloned()`):**
  - Use `.as_deref()` to convert `Option<String>` -> `Option<&str>` or `Option<Vec<T>>` -> `Option<&[T]>`. Use `.copied()` for types implementing `Copy` instead of `.cloned()`.
  - ❌ **Bad:** `opt_str.as_ref().map(|s| s.as_str())` or `opt_str.as_ref().map(|s| &**s)`
  - ✅ **Good:** `opt_str.as_deref()`
  - ❌ **Bad:** `opt_u32.cloned()`
  - ✅ **Good:** `opt_u32.copied()`

- **Idiomatic Combinators over Explicit `match` Blocks:**
  - Use functional combinators (`.map()`, `.and_then()`, `.or_else()`, `.inspect()`, `.filter()`) for straight-forward data transformations instead of explicit `match` blocks.
  - ❌ **Bad:**
    ```rust
    match opt {
        Some(val) => Some(val.to_lowercase()),
        None => None,
    }
    ```
  - ✅ **Good:** `opt.map(|val| val.to_lowercase())`

- **Slice Pattern Matching for Protocol & Binary Parsing:**
  - Prefer Slice Patterns (`[head1, head2, payload @ ..]`) over manual length checks and indexing (`slice[0]`, `slice[1]`, `&slice[2..]`). Slice patterns generate a single optimized decision tree and eliminate runtime bounds checks.
  - ❌ **Bad:**
    ```rust
    if packet.len() >= 2 && packet[0] == 0xAA && packet[1] == 0xBB {
        let payload = &packet[2..];
    }
    ```
  - ✅ **Good:**
    ```rust
    match packet {
        [0xAA, 0xBB, payload @ ..] => process_payload(payload),
        _ => handle_invalid_packet(),
    }
    ```

- **On-Stack Dynamic Dispatch (`&dyn Trait`):**
  - When short-lived polymorphism is needed within a local stack frame, create stack instances and bind a fat reference (`&dyn Trait`) instead of allocating heap memory with `Box<dyn Trait>`.
  - ❌ **Bad:**
    ```rust
    let renderer: Box<dyn Renderer> = if use_opengl {
        Box::new(OpenGlRenderer) // Heap allocation
    } else {
        Box::new(CpuRenderer)    // Heap allocation
    };
    ```
  - ✅ **Good:**
    ```rust
    let (opengl, cpu) = (OpenGlRenderer, CpuRenderer);
    let renderer: &dyn Renderer = if use_opengl { &opengl } else { &cpu }; // 0 heap allocations
    ```

- **Treating `Option` as an Iterator (`extend` / `chain`):**
  - Leverage `Option`'s implementation of `IntoIterator` to append or chain optional values into collection pipelines without manual `if let Some` branches.
  - ❌ **Bad:**
    ```rust
    if let Some(val) = maybe_value {
        vec.push(val);
    }
    ```
  - ✅ **Good:** `vec.extend(maybe_value);` or `iter.chain(maybe_value)`

- **Freezing Mutability via Rebinding (`let data = data;`):**
  - After initializing and mutating a variable, rebind it as immutable (`let data = data;`) to freeze mutation privileges for the remainder of the scope. This prevents accidental mutations and enables LLVM register optimizations.
  - ❌ **Bad:** Keeping `let mut config = ...;` mutable across 100+ lines of logic after setup.
  - ✅ **Good:**
    ```rust
    let mut config = load_config();
    config.port = 9000;
    let config = config; // Mutability frozen
    ```

---

## 18. Modern Rust 2024 Edition Features & Async Idioms

- **Native Async Fn & RPITIT in Traits (Rust 2024):**
  - Rust 2024 natively supports `async fn` and Return Position Impl Trait in Traits (RPITIT). Avoid adding `#[async_trait]` macro dependencies unless dynamic dispatch (`dyn Trait` object safety) is strictly required.
  - ❌ **Bad:** `#[async_trait]` on every trait definition in Rust 2024.
  - ✅ **Good:** `trait Storage { async fn save(&self, data: &[u8]); }`

- **Precise Lifetime Capturing (`use<'a>`) in `impl Trait`:**
  - By default in Rust 2024, `impl Trait` in return types captures all lifetimes in scope. Use precise capturing syntax (`impl Trait + use<'a>`) to restrict captured lifetimes explicitly when returning borrowed data.
  - ❌ **Bad:** `fn process<'a, 'b>(x: &'a str, y: &'b str) -> impl Trait` (captures `'b` unintentionally in Rust 2024)
  - ✅ **Good:** `fn process<'a, 'b>(x: &'a str, y: &'b str) -> impl Trait + use<'a>`

- **Native Async Closures:**
  - Prefer native async closure syntax (`async || { ... }`) in Rust 2024 instead of manually returning pinned boxed futures (`Box::pin(async move { ... })`).
  - ❌ **Bad:** `let closure = || Box::pin(async move { compute().await });`
  - ✅ **Good:** `let closure = async || { compute().await };`

- **Strict `unsafe` Governance in Rust 2024:**
  - `extern` blocks and safety-critical attributes (`#[no_mangle]`, `#[export_name]`, `#[link_section]`) require the `unsafe` keyword in Rust 2024. `unsafe_op_in_unsafe_fn` is active by default: explicit `unsafe { ... }` blocks are required inside `unsafe fn`.
  - ❌ **Bad:**
    ```rust
    unsafe fn call_ffi() {
        raw_c_function(); // Missing inner unsafe block in Rust 2024
    }
    ```
  - ✅ **Good:**
    ```rust
    unsafe fn call_ffi() {
        // SAFETY: raw_c_function is thread-safe and parameters are valid
        unsafe { raw_c_function(); }
    }
    ```

---

## 19. Prioritized Code Review & Audit Checklist (Deterministic Audit Flow)

To ensure every code review yields **reproducible, consistent results** without varying focus across runs, reviewers must execute audits strictly in the following 5-step order:

1. **Step 1 — Safety & Boundary Invariants:**
   - Verify every `unsafe` block has a sound `// SAFETY:` rationale.
   - Ensure WASM/FFI exported functions catch panics and return `Result<T, E>`.
   - Check cryptography buffers for constant-time comparisons (`subtle`) and `ZeroizeOnDrop`.
2. **Step 2 — Error Propagation & Correctness:**
   - Audit for unhandled `.unwrap()` / `.expect()` in non-test production paths.
   - Verify error propagation uses `?` and standard `Result` / `TranslationKey` error mappings.
3. **Step 3 — Control Flow & Syntax Idioms:**
   - Replace nested `if let` / `match` early exits with `let-else`.
   - Replace `.as_ref().map(...)` with `.as_deref()`.
   - Replace eager fallbacks in `unwrap_or`/`ok_or` with lazy `unwrap_or_else`/`ok_or_else`.
   - Replace `std::mem::replace(&mut opt, None)` with `opt.take()`.
4. **Step 4 — API Signatures & Borrow Coercion:**
   - Verify function parameters accept borrowed slices (`&str`, `&[T]`, `&Path`, `impl AsRef<T>`) rather than owned references (`&String`, `&Vec<T>`).
   - Ensure standard traits (`Debug`, `Display`, `Default`, `Clone`) are implemented or derived appropriately.
5. **Step 5 — Memory Layout, Allocations & Async Safety:**
   - Audit hot loops for `.clone()`, `format!`, or dynamic heap allocations. Pre-allocate collections via `Vec::with_capacity`.
   - Check large enums for bloated payload variants and box them (`Box<T>`).
   - Audit `Option<T>` fields for `NonZero*` niche optimizations and convert immutable long-lived storage to `Box<str>` / `Box<[T]>`.
   - Ensure async functions never invoke blocking I/O without `tokio::task::spawn_blocking`.
   - Check cancellation safety on `tokio::select!` branches.

---

## 20. Advanced Memory Layout & Allocation Optimization

- **Large Enum Variant Boxing (`clippy::large_enum_variant`):**
  - Enums are sized to fit the largest variant plus the discriminant tag. If one variant payload is significantly larger than the others, box the large payload variant to prevent bloating the memory footprint across all instances of the enum.
  - ❌ **Bad:**
    ```rust
    enum Event {
        Ping,
        Message(String),
        BulkData([u8; 4096]), // Bloats Event to 4097+ bytes for ALL variants
    }
    ```
  - ✅ **Good:**
    ```rust
    enum Event {
        Ping,
        Message(String),
        BulkData(Box<[u8; 4096]>), // Shrinks Event to ~24 bytes
    }
    ```

- **Niche Optimization & `NonZero*` Types:**
  - Leverage types with niches (`NonZeroU64`, `NonZeroU32`, `NonNull<T>`, `&T`, `Box<T>`) so `Option<T>` achieves Zero-Cost Null Pointer Optimization (NPO) without extra discriminant bytes or memory padding.
  - ❌ **Bad:** `struct UserId(u64);` -> `Option<UserId>` consumes 16 bytes (8-byte value + 8-byte padded tag)
  - ✅ **Good:** `struct UserId(std::num::NonZeroU64);` -> `Option<UserId>` consumes exactly 8 bytes

- **Small Vector & Small String Optimization (SVO / SSO):**
  - For high-frequency collections with small upper bounds ($N \le 8$ or $16$), use `SmallVec<[T; N]>` or `ArrayVec<[T; N]>` to keep elements on the stack. For small strings ($N \le 22\text{ bytes}$), use `compact_str` or `smol_str` to avoid heap allocations.
  - ❌ **Bad:** `let mut tags: Vec<String> = Vec::new();` (heap allocation even for 1-2 elements)
  - ✅ **Good:** `let mut tags: smallvec::SmallVec<[String; 4]> = smallvec::SmallVec::new();`

- **Arena Allocation for Phase-Based Bulk Data (`bumpalo`):**
  - For parser ASTs, request-scoped pipelines, or short-lived graph nodes, use an arena allocator (`bumpalo::Bump`) to allocate contiguous memory blocks with single-pointer bump increments, avoiding thousands of individual `malloc`/`free` calls.

- **Immutable Heap Storage Optimization (`Box<str>` / `Box<[T]>`):**
  - For long-lived immutable strings or arrays stored in memory (such as symbol tables, routing tables, or static caches), convert owned `String` / `Vec<T>` to `Box<str>` / `Box<[T]>`. This drops the `capacity` field, saving 8 bytes per instance on 64-bit architectures (16 bytes vs 24 bytes).
  - ❌ **Bad:** `struct RouteEntry { path: String, tags: Vec<String> }` (48 bytes overhead on stack)
  - ✅ **Good:** `struct RouteEntry { path: Box<str>, tags: Box<[Box<str>]> }` (32 bytes overhead)

- **Struct Alignment & Padding in FFI / Fixed Layouts (`#[repr(C)]`):**
  - The Rust compiler automatically reorders fields in standard Rust structs (`#[repr(Rust)]`) to minimize padding. However, when using `#[repr(C)]` for FFI or binary protocols, order fields manually from largest alignment (`usize`, `u64`, pointers) to smallest (`u8`, `bool`) to prevent wasted padding gaps.

---

## 21. Atomics & Lock-Free Concurrency Memory Ordering

- **Precise Memory Ordering (`Ordering::Relaxed`, `Acquire`/`Release`, `SeqCst`):**
  - Avoid defaulting to `Ordering::SeqCst` for all atomic operations. `SeqCst` enforces a globally consistent memory ordering across all threads, inserting expensive CPU memory fence instructions. Use `Ordering::Relaxed` for independent metrics/counters, and `Acquire`/`Release` pairing for flag synchronization.
  - _(Source: _Rust Atomics and Locks_ — Mara Bos, Chapter 3: Memory Ordering)_
  - ❌ **Bad:**
    ```rust
    use std::sync::atomic::{AtomicU64, Ordering};
    let counter = AtomicU64::new(0);
    // Unnecessary SeqCst bus locking for a simple metric counter
    counter.fetch_add(1, Ordering::SeqCst);
    ```
  - ✅ **Good:**
    ```rust
    use std::sync::atomic::{AtomicU64, Ordering};
    let counter = AtomicU64::new(0);
    // Relaxed is sufficient for independent counter increments
    counter.fetch_add(1, Ordering::Relaxed);
    ```

- **Flag Synchronization with `Acquire` / `Release` Pairing:**
  - When signaling state readiness between threads, use `Release` on store and `Acquire` on load to guarantee prior memory writes become visible to the acquiring thread without full `SeqCst` overhead.
  - ❌ **Bad:**
    ```rust
    // Thread 1:
    READY.store(true, Ordering::Relaxed); // Race: data write may reorder after flag!
    // Thread 2:
    if READY.load(Ordering::Relaxed) { read_payload(); }
    ```
  - ✅ **Good:**
    ```rust
    // Thread 1:
    READY.store(true, Ordering::Release); // Guarantees prior writes are published
    // Thread 2:
    if READY.load(Ordering::Acquire) { read_payload(); } // Acquires published memory state
    ```

---

## 22. Panic Safety, Unwind Invariants & Catch Unwind

- **Preserving Invariants Across Panic Boundaries (`catch_unwind`):**
  - When using `std::panic::catch_unwind` to contain panics (e.g., inside worker pools or plugin runners), ensure data structures modified before the panic are not left in a broken or inconsistent state.
  - ❌ **Bad:** Leaving a shared collection partially mutated when a closure panics.
  - ✅ **Good:**
    ```rust
    use std::panic::{catch_unwind, AssertUnwindSafe};

    let mut state = DataState::new();
    let result = catch_unwind(AssertUnwindSafe(|| {
        state.prepare_mutation();
        perform_risky_operation()
    }));

    if result.is_err() {
        state.rollback_to_safe_invariant(); // Restore valid state on panic
    }
    ```

- **Library Unwind Safety vs Binary Panic Abort:**
  - Libraries MUST remain unwind-safe and clean up resources during stack unwinding. Production binaries and WebAssembly modules should configure `panic = "abort"` in `Cargo.toml` to minimize binary size and eliminate unwinding tables.

---

## 23. Foreign Function Interface (FFI) C-ABI Stability & Raw Pointers

- **Explicit `#[repr(C)]` & `extern "C"` Signatures:**
  - All structs and functions exposed across C/C++ FFI boundaries MUST use `#[repr(C)]` for fixed memory layout and `extern "C"` for ABI calling convention stability.
  - ❌ **Bad:** Exposing standard Rust `#[repr(Rust)]` structs across FFI.
  - ✅ **Good:**
    ```rust
    #[repr(C)]
    pub struct FfiUser {
        pub id: u64,
        pub status: u32,
    }

    #[no_mangle]
    pub extern "C" fn process_ffi_user(user: *const FfiUser) -> i32 {
        if user.is_null() { return -1; }
        // SAFETY: user is checked non-null and aligned
        let u = unsafe { &*user };
        u.status as i32
    }
    ```

- **Safe Raw Pointer Memory Transfers (`Box::into_raw` & `Box::from_raw`):**
  - Transfer heap ownership across FFI boundaries by converting owned types to raw pointers via `Box::into_raw`. Reclaim and free memory on the Rust side using `Box::from_raw`. Never allow foreign C code to `free()` Rust heap pointers directly.
  - ❌ **Bad:** Passing Rust `String` or `Vec` directly to C code or letting C call `free()`.
  - ✅ **Good:**
    ```rust
    #[no_mangle]
    pub extern "C" fn create_context() -> *mut MyContext {
        Box::into_raw(Box::new(MyContext::default()))
    }

    #[no_mangle]
    pub extern "C" fn free_context(ptr: *mut MyContext) {
        if !ptr.is_null() {
            // SAFETY: Reclaims ownership of raw pointer to deallocate via Rust allocator
            unsafe { drop(Box::from_raw(ptr)); }
        }
    }
    ```

---

## 24. Declarative Macro Hygiene & Performance (`macro_rules!`)

- **Macro Hygiene & Full Path Qualification (`$crate::...`):**
  - Always qualify macro internal types, functions, and standard traits with `$crate::` or full module paths (`$crate::std::result::Result`). Unqualified macro expansions fail when imported into crates with different module namespaces or conflicting imports.
  - ❌ **Bad:**
    ```rust
    macro_rules! my_log {
        ($msg:expr) => { println!("{}", $msg); }; // Fails if println is shadowed or in no_std
    }
    ```
  - ✅ **Good:**
    ```rust
    macro_rules! my_log {
        ($msg:expr) => {
            $crate::std::println!("{}", $msg);
        };
    }
    ```

- **Prefer `macro_rules!` over Procedural Macros for Simple Utilities:**
  - Procedural macro crates (`syn`/`quote`) add significant compile-time overhead (compiling separate host build dependencies). Prefer lightweight `macro_rules!` for simple code generation or repetitive patterns.

---

## 25. Generic Variance & Type Markers (`PhantomData`)

- **Covariance, Invariance & `PhantomData` Markers:**
  - Use `PhantomData<T>` to convey phantom ownership of generic parameters or lifetimes without storing actual instances. Use `PhantomData<fn() -> T>` for covariance, `PhantomData<fn(T) -> T>` for invariance, and `PhantomData<*const T>` to explicitly opt-out of `Send` / `Sync` auto-traits for raw handles.
  - ❌ **Bad:** Storing raw pointer handles that accidentally auto-implement `Send` / `Sync`.
  - ✅ **Good:**
    ```rust
    use std::marker::PhantomData;

    pub struct ThreadLocalHandle<T> {
        ptr: *const u8,
        _marker: PhantomData<*const T>, // Disables automatic Send + Sync
    }
    ```

---

## 26. High-Performance Memory Allocators & CPU Cache Line Alignment

- **Custom Global Allocators (`mimalloc` / `jemalloc`):**
  - OS default allocators (`glibc malloc` / MSVC `HeapAlloc`) suffer from lock contention and heap fragmentation under heavy multi-threaded allocation loads. Use high-performance allocators like `mimalloc` or `jemalloc` to boost allocation speed by 15-30%.
  - ❌ **Bad:** Relying on default system allocator for high-throughput multi-threaded servers.
  - ✅ **Good:**
    ```rust
    #[global_allocator]
    static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;
    ```

- **Preventing CPU L1 Cache Line False Sharing (`#[repr(align(64))]`):**
  - When independent atomic variables accessed by different threads share the same 64-byte L1 CPU cache line, updates by one thread invalidate the cache line for all other threads (False Sharing). Use `#[repr(align(64))]` or `crossbeam::utils::CachePadded` to align atomics onto separate cache lines.
  - ❌ **Bad:** `struct Workers { head: AtomicUsize, tail: AtomicUsize }` (shares same 64-byte cache line)
  - ✅ **Good:**
    ```rust
    use crossbeam::utils::CachePadded;
    use std::sync::atomic::AtomicUsize;

    struct Workers {
        head: CachePadded<AtomicUsize>,
        tail: CachePadded<AtomicUsize>,
    }
    ```

- **Zero-Copy Deserialization (`rkyv` / `zerocopy`):**
  - For ultra-high performance data access from disk/mmap buffers, use zero-copy deserialization crates (`rkyv` / `zerocopy`) to borrow and inspect data directly from byte slices with zero deserialization overhead ($0\text{ ns}$).
  - ❌ **Bad:** Parsing giant JSON or Bincode payloads into newly allocated heap structures.
  - ✅ **Good:** `let archived = rkyv::check_archived_root::<MyStruct>(bytes)?;`

---

## 27. Advanced Security Hardening & Memory Protection

- **Locking RAM Against OS Page Swapping (`mlock` / `VirtualLock`):**
  - Memory buffers containing sensitive materials (master passwords, private keys) may be swapped to disk (`pagefile.sys` / `swapfile`) by the OS as unencrypted plaintext. Lock sensitive RAM pages using `mlock` or `region` to prevent swapping.
  - ❌ **Bad:** Leaving sensitive memory buffers unlocked, allowing the OS memory manager to page them to disk.
  - ✅ **Good:**
    ```rust
    use region::Protection;

    pub fn lock_secret_memory(ptr: *mut u8, len: usize) -> Result<(), region::Error> {
        // Lock RAM pages so OS cannot swap them to disk
        unsafe { region::lock(ptr, len) }
    }
    ```

- **Preventing Stack Overflow in Deep Recursion (`stacker`):**
  - Deep recursive algorithms (such as complex AST parsers or graph traversals) can exceed stack size limits and panic. Use `stacker::maybe_grow` to dynamically allocate stack extension segments on the heap.
  - ❌ **Bad:** Deeply recursive functions risking stack overflow on untrusted nested input.
  - ✅ **Good:**
    ```rust
    fn parse_nested_ast(node: &Node) {
        stacker::maybe_grow(32 * 1024, 1024 * 1024, || {
            for child in &node.children {
                parse_nested_ast(child);
            }
        });
    }
    ```

- **Constant-Time Scalar Arithmetic:**
  - Avoid value-dependent branching (`if secret_bit == 1`) or variable-time division `/` on secret scalar operations. Use constant-time arithmetic libraries (`crypto-bigint`) to prevent side-channel timing attacks.

---

## 28. Idiomatic Rust Domain Modeling Patterns

- **Parse, Don't Validate (Type-Driven Domain Validation):**
  - Do not use generic string primitive types (`String`) for constrained domain concepts and re-validate with `is_valid()` checks across call sites. Encapsulate validation into newtypes with private fields that can only be instantiated via `TryFrom`.
  - ❌ **Bad:** `fn send_email(email: String) { if !email.contains('@') { return; } }`
  - ✅ **Good:**
    ```rust
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct Email(String);

    impl TryFrom<&str> for Email {
        type Error = &'static str;
        fn try_from(val: &str) -> Result<Self, Self::Error> {
            if val.contains('@') {
                Ok(Self(val.to_string()))
            } else {
                Err("Invalid email format")
            }
        }
    }
    ```

- **RAII Guard Pattern for Automatic Resource Management:**
  - Leverage `Drop` implementation on custom guard structs to automatically release resources (closing temporary files, unlocking mutexes, stopping background timers) when going out of scope.
  - ❌ **Bad:** Manual `cleanup()` calls at every exit point of a function.
  - ✅ **Good:**
    ```rust
    pub struct TempFileGuard { path: std::path::PathBuf }

    impl Drop for TempFileGuard {
        fn drop(&mut self) {
            let _ = std::fs::remove_file(&self.path); // Guaranteed cleanup on drop
        }
    }
    ```

- **Sealed Trait Pattern for Public Crate API Encapsulation:**
  - Prevent downstream callers from implementing public extension traits on external types by requiring a private supertrait (`Sealed`). This protects SemVer contract guarantees.
  - ❌ **Bad:** `pub trait MyExt { ... }` allowing external crates to implement `MyExt` on arbitrary types.
  - ✅ **Good:**
    ```rust
    mod private { pub trait Sealed {} }

    pub trait MyExt: private::Sealed {
        fn helper(&self);
    }
    ```

---

## Key References

- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [Rust & WebAssembly Book](https://rustwasm.github.io/docs/book/) — Official
  Rust WASM Working Group
- [Rust 2024 Edition Guide](https://doc.rust-lang.org/edition-guide/rust-2024/)
  — Official Rust Edition Reference
- [The Rust Performance Book](https://rust-lang.github.io/perf-book/) — Official
  Performance Guidelines
- _Rust for Rustaceans_ — Jon Gjengset
- _Effective Rust: 35 Specific Ways to Improve Your Rust Code_ — David Drysdale
- _Rust Atomics and Locks_ — Mara Bos
- Aleksey Kladov (matklad) Blog —
  [matklad.github.io](https://matklad.github.io/)
- [RustCrypto Working Group Documentation](https://github.com/RustCrypto)
- [Tokio Ecosystem Documentation](https://tokio.rs/) & The Async Book
- [cargo-nextest](https://nexte.st/) ·
  [cargo-deny](https://embarkstudios.github.io/cargo-deny/) ·
  [cargo-audit](https://github.com/RustSec/rustsec) ·
  [cargo-semver-checks](https://github.com/obi1kenobi/cargo-semver-checks)
- [tracing](https://docs.rs/tracing) &
  [tokio-console](https://github.com/tokio-rs/console)
