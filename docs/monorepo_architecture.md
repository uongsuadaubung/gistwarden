# 🏛️ Tài liệu Kiến trúc Monorepo & Phân tầng Gistwarden (6-Tier Architecture)

Tài liệu mô tả chi tiết kiến trúc phân tầng Clean Architecture, cơ chế bảo vệ ranh giới kép (Dual-Layer Isolation) và thiết kế Use-case Orchestration trong hệ thống Gistwarden.

---

## 1. 📐 Mô hình Phân tầng Kiến trúc (6-Tier Clean Architecture)

Hệ thống mã nguồn Gistwarden được chia thành 6 tầng rõ ràng với hướng phụ thuộc strictly **1 chiều từ trên xuống dưới**:

```
 ┌─────────────────────────────────────────────────────────┐
 │               Layer 6: Apps (extension / web)           │
 └────────────────────────────┬────────────────────────────┘
                              │
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │               Layer 5: UI (packages/ui)                 │
 └────────────────────────────┬────────────────────────────┘
                              │ (Nghiêm cấm import L2/L3)
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │         Layer 4: Orchestrator (packages/orchestrator)   │
 └──────────────┬────────────────────────────┬─────────────┘
                │                            │
                ▼                            ▼
 ┌─────────────────────────────┐ ┌─────────────────────────┐
 │ Layer 2: Repository         │ │ Layer 3: Network        │
 │ (packages/repository)       │ │ (packages/network)      │
 └──────────────┬──────────────┘ └───────────┬─────────────┘
                │                            │
                └──────────────┬─────────────┘
                               ▼
 ┌─────────────────────────────────────────────────────────┐
 │             Layer 1: Domain (packages/domain)           │
 └─────────────────────────────────────────────────────────┘
```

---

## 2. 📋 Trách nhiệm Chi tiết của từng Tầng

### Layer 1: Domain (`packages/domain`)
- **Vai trò**: Chứa các Entity, Value Objects, Domain Schemas (Zod), thuật toán Mã hóa thuần túy (AES-GCM, PBKDF2, Argon2) và các kiểu dữ liệu dùng chung (`ISyncProvider`, `VaultItem`, `TranslationKey`).
- **Quy tắc**: Thuần túy in-memory, **tuyệt đối không chứa I/O** (không fetch mạng, không gọi LocalStorage/Chrome APIs).

### Layer 2: Repository (`packages/repository`)
- **Vai trò**: Quản lý lưu trữ dữ liệu cục bộ (Web LocalStorage, Extension `chrome.storage.local/session`), chuyển đổi DTO/Schema, và triển khai `LocalStorageProvider`.
- **Quy tắc**: Chỉ phụ thuộc Domain (L1). Không import Network (L3) hay Orchestrator (L4).

### Layer 3: Network (`packages/network`)
- **Vai trò**: Xử lý giao tiếp mạng từ xa (GitHub Gist API, Self-Hosted Server REST API, HaveIBeenPwned Breach API). Triển khai `GithubGistProvider` và `SelfHostedProvider`.
- **Quy tắc**: Chỉ phụ thuộc Domain (L1). Không quản lý state bộ nhớ hay storage cục bộ.

### Layer 4: Orchestrator (`packages/orchestrator`)
- **Vai trò**: Tầng điều phối nghiệp vụ duy nhất (Use-Case Orchestration). Kết nối Domain, Repository và Network để thực thi các luồng công việc E2E (Unlock, Sync, Mutation, Auth).
- **Cấu trúc Module hóa**:
  - `vault-auth-usecases.ts`: Luồng xác thực Vault (Đăng ký, Đăng nhập, Unlock, Master Password, PIN, GitHub OAuth).
  - `sync-usecases.ts`: Thuật toán Merge Payload, Đồng bộ Vault với Remote, và xử lý Messaging Routes.
  - `vault-mutation-usecases.ts`: Đọc/mã hóa Vault payload và thực thi các biến đổi dữ liệu (CRUD Vault Item, Folders, Trash).
  - `sync-provider-registry.ts`: Registry quản lý đa hình các Sync Providers (`github_gist`, `local_storage`, `self_hosted_server`).

### Layer 5: UI (`packages/ui`)
- **Vai trò**: Chứa các Component giao diện SolidJS, trạng thái UI (Store) và i18n.
- **Quy tắc nghiêm ngặt**: **Chỉ được phép import từ Orchestrator (L4) và Domain (L1)**. Bị cấm hoàn toàn không được import trực tiếp Repository (L2) hoặc Network (L3).

### Layer 6: Apps (`apps/extension`, `apps/web`, `apps/worker`)
- **`apps/extension`**: Entrypoints đóng gói ứng dụng Extension Manifest V3 (Service Worker, Content Scripts, Popup, Guide, Autofill).
- **`apps/web`**: Standalone Zero-Knowledge Web App chạy trực tiếp trên trình duyệt.
- **`apps/worker`**: Cloudflare Edge API Worker xây dựng bằng Hono Framework kết hợp cơ sở dữ liệu Cloudflare D1 (Serverless SQLite), cung cấp backend đồng bộ két mật khẩu E2EE và proxy xác thực GitHub OAuth.

---

## 3. 🛡️ Cơ chế Bảo vệ Ranh giới Kép (Dual-Layer Isolation)

Để ngăn ngừa vi phạm ranh giới tầng trong quá trình phát triển dài hạn, hệ thống thiết lập 2 lớp phòng thủ:

### Lớp 1: TypeScript Project References (Compile-Time)
Mỗi package/app có file `tsconfig.json` riêng chứa cấu hình `"composite": true` và danh sách `"references"` chính xác:

- `packages/domain/tsconfig.json`: `"references": []`
- `packages/repository/tsconfig.json`: `"references": [{ "path": "../domain" }]`
- `packages/network/tsconfig.json`: `"references": [{ "path": "../domain" }]`
- `packages/orchestrator/tsconfig.json`: `"references": [{ "path": "../domain" }, { "path": "../repository" }, { "path": "../network" }]`
- `packages/ui/tsconfig.json`: `"references": [{ "path": "../domain" }, { "path": "../orchestrator" }]` *(Không có L2/L3)*
- `apps/worker/tsconfig.json`: `"composite": true` *(Độc lập, chạy trên môi trường Edge Runtime)*

**Hiệu quả**: Khi bất kỳ file nào trong `packages/ui` cố tình import từ `@gistwarden/repository` hoặc `@gistwarden/network`, lệnh `bun run typecheck` (`tsc -b`) sẽ báo lỗi ngay lập tức:
```
error TS6307: File 'packages/repository/...' is not listed within the file list of project 'packages/ui/tsconfig.json'.
```

### Lớp 2: AST Custom Linter (Syntax-Time)
`scripts/custom_linter.ts` quét qua cây cú pháp mã nguồn trong lệnh `bun run lint`:
- Kiểm tra ma trận `ALLOWED_TARGET_LAYERS` đối với các đường dẫn import tương đối.
- Cấm sử dụng `any`, `@ts-ignore`, `@ts-expect-error`.
- Bảo vệ SolidJS reactivity (cấm destructure `props`).
- Chặn inline style objects trong TSX.

---

## 4. 🚀 Quy trình Kiểm tra & Triển Khai (Verification & Deploy Commands)

```bash
# 1. Kiểm tra Linter & AST Import Rules (256 file TS + 24 file CSS)
bun run lint

# 2. Kiểm tra Type-check với TypeScript Project References (Build Mode)
bun run typecheck

# 3. Chạy 93 Unit & E2E Tests
bun test tests/

# 4. Đóng gói Extension & Web App (Dev Mode)
bun run build

# 5. Triển khai Cloudflare Worker Backend lên Edge
bun run worker:deploy
```
