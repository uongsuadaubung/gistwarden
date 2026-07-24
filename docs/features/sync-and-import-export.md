# Tài Liệu Mô Tả Chi Tiết: Chức Năng Đồng Bộ GitHub Gist & Nhập/Xuất Dữ Liệu (Sync & Import/Export)

Tài liệu này mô tả chi tiết kiến trúc, quy trình xử lý và luồng thuật toán của
tính năng **Đồng bộ GitHub Gist** và **Nhập/Xuất Dữ liệu** (CSV & JSON) trong
Gistwarden.

---

## 1. Tổng Quan (Overview)

Gistwarden sử dụng **GitHub Gist** làm hạ tầng lưu trữ đám mây cá nhân hoàn toàn
miễn phí, riêng tư và độc lập:

- Dữ liệu trước khi tải lên Gist được mã hóa **AES-256-GCM** cục bộ bằng
  `DerivedKey` (Argon2id) của người dùng.
- GitHub chỉ nhìn thấy các chuỗi Ciphertext vô nghĩa (Zero-Knowledge Cloud
  Storage).
- **Hỗ trợ Đầy đủ Nhập & Xuất (Import & Export)** cả 2 dạng định dạng **CSV** và
  **JSON**:
  - **Xuất dữ liệu (Export)**: Tùy chọn xuất thành **Browser CSV**, **Bitwarden
    CSV**, hoặc **Gistwarden JSON**.
  - **Nhập dữ liệu (Import)**: Nhận diện và ánh xạ tự động từ **Browser CSV**,
    **Bitwarden CSV**, hoặc **Gistwarden / Bitwarden JSON**.

---

## 🛑 GIAI ĐOẠN 1: Xác Thực GitHub OAuth & Token (GitHub Auth Phase)

```mermaid
flowchart TD
    AuthStart([Bắt đầu: Cấu hình GitHub Sync]) --> CheckAuthType{Hình thức kết nối GitHub người dùng chọn?}
    
    %% OAuth Flow
    CheckAuthType -- OAuth 2.0 (Khuyên dùng) --> TriggerOAuth[Kích hoạt MSG_START_GITHUB_OAUTH]
    TriggerOAuth --> OpenCloudflareWorker[Bật luồng xác thực qua Cloudflare Worker Worker URL]
    OpenCloudflareWorker --> ExchangeToken[Nhận GitHub Personal Token từ OAuth Callback]
    
    %% Personal Access Token (PAT)
    CheckAuthType -- Nhập Personal Access Token (PAT) thủ công --> ValidatePAT[Gọi MSG_VALIDATE_TOKEN xác thực Token với GitHub API]
    ValidatePAT --> CheckTokenValid{Token hợp lệ và có quyền gist?}
    CheckTokenValid -- False --> ShowAuthError[Hiển thị báo lỗi: Token không hợp lệ]
    CheckTokenValid -- True --> SaveEncryptedToken[Mã hóa Token & Lưu vào AppSettings]
    
    ExchangeToken --> SaveEncryptedToken
    SaveEncryptedToken --> AuthComplete([Hoàn thành Kết nối GitHub thành công!])
```

---

## 🔄 GIAI ĐOẠN 2: Đồng Bộ 2 Chiều với GitHub Gist (Bi-directional Sync Phase)

```mermaid
flowchart TD
    SyncStart([Bắt đầu: Kích hoạt Sync Tự động hoặc Thủ công]) --> CheckGistId{Đã có Gist ID trong Cài đặt chưa?}
    
    CheckGistId -- False (Lần đầu Sync) --> CreateNewGist[Tạo Gist ẩn 'gistwarden_vault.json' mới trên GitHub]
    CreateNewGist --> SaveGistIdSettings[Lưu Gist ID vào Cài đặt AppSettings]
    SaveGistIdSettings --> UploadVaultContent
    
    CheckGistId -- True (Đã có Gist) --> DownloadGistContent[Tải nội dung Gist từ GitHub API]
    DownloadGistContent --> ComputeGistHash[Tính SHA-256 Hash nội dung Gist mới tải]
    ComputeGistHash --> CompareHash{Hash trùng với lastSyncedHash trong Cài đặt?}
    
    CompareHash -- True (Không có thay đổi trên Cloud) --> CheckLocalChanges{Dữ liệu Local có thay đổi mới không?}
    CheckLocalChanges -- False --> SyncUpToDate([Đã đồng bộ mới nhất - Không cần hành động])
    CheckLocalChanges -- True --> UploadVaultContent[Mã hóa AES-GCM & Đẩy Ciphertext mới lên Gist]
    
    CompareHash -- False (Có dữ liệu mới từ Cloud) --> DecryptCloudVault[Dùng DerivedKey giải mã Ciphertext từ Gist]
    DecryptCloudVault --> CheckDecryptSuccess{Giải mã dữ liệu Gist THÀNH CÔNG?}
    CheckDecryptSuccess -- False --> ShowDecryptError[Báo lỗi: Mật khẩu Master không khớp với dữ liệu trên Gist]
    CheckDecryptSuccess -- True --> MergeVaultItems[Trộn dữ liệu Vault giữa Cloud và Local theo RevisionDate]
    MergeVaultItems --> UpdateLocalVault[Cập nhật Vault Local & Lưu lastSyncedHash mới]
    
    UploadVaultContent --> UpdateLocalVault
    UpdateLocalVault --> SyncComplete([Hoàn tất Đồng bộ thành công!])
```

---

## 📥 GIAI ĐOẠN 3: Nhập & Xuất Dữ Liệu CSV & JSON (Import & Export Phase)

```mermaid
flowchart TD
    IEStart([Bắt đầu: Thao tác Nhập / Xuất Dữ liệu]) --> CheckTaskType{Loại thao tác người dùng chọn?}
    
    %% Xuất Dữ liệu (Export)
    CheckTaskType -- Xuất Dữ liệu (Export) --> ChooseExportFormat{Chọn định dạng xuất dữ liệu?}
    ChooseExportFormat -- Gistwarden JSON --> ExportJSONFormat[Chuyển mảng VaultItems sang file .json chuẩn Gistwarden]
    ChooseExportFormat -- Bitwarden CSV --> ExportBitwardenCSV[Chuyển VaultItems sang chuẩn Bitwarden CSV]
    ChooseExportFormat -- Browser CSV (Chrome/Firefox) --> ExportBrowserCSV[Chuyển VaultItems sang chuẩn Browser CSV]
    
    ExportJSONFormat --> TriggerDownload[Tải file .json / .csv về máy người dùng]
    ExportBitwardenCSV --> TriggerDownload
    ExportBrowserCSV --> TriggerDownload
    TriggerDownload --> ExportEnd([Hoàn tất Xuất dữ liệu])
    
    %% Nhập Dữ liệu (Import)
    CheckTaskType -- Nhập Dữ liệu (Import) --> UploadFile[Người dùng chọn file .csv hoặc .json từ máy]
    UploadFile --> DetectFileFormat{Hệ thống tự nhận diện Định dạng File?}
    
    DetectFileFormat -- Bitwarden CSV --> ParseBitwardenCSV[Parser Bitwarden CSV: Ánh xạ Login, SecureNote, Card, Identity...]
    DetectFileFormat -- Browser CSV (Chrome/Firefox) --> ParseBrowserCSV[Parser Browser CSV: Ánh xạ url, username, password...]
    DetectFileFormat -- JSON (Bitwarden / Gistwarden) --> ParseJSON[Parser JSON: Ánh xạ các thuộc tính Vault Items]
    
    ParseBitwardenCSV --> ValidateItems[Kiểm tra Chống trùng lặp & Validate Zod Schema]
    ParseBrowserCSV --> ValidateItems
    ParseJSON --> ValidateItems
    
    ValidateItems --> BatchInsertVault[Lưu Batch tất cả tài khoản vào Vault]
    BatchInsertVault --> AutoSyncAfterImport[Tự động Trigger Đồng bộ Gist]
    AutoSyncAfterImport --> ImportEnd([Hoàn tất Nhập dữ liệu!])
```

---

## 📊 TÓM TẮT QUY TRÌNH XỬ LÝ ĐIỀU KIỆN TỔNG HỢP (Decision Matrix)

| Bước    | Câu hỏi điều kiện                              | Kết quả TRUE                                                 | Kết quả FALSE                                       |
| :------ | :--------------------------------------------- | :----------------------------------------------------------- | :-------------------------------------------------- |
| **1.1** | Token GitHub API có hợp lệ và có quyền `gist`? | Mã hóa Token & Lưu Cài đặt                                   | Hiển thị báo lỗi Token không hợp lệ                 |
| **2.1** | Đã có Gist ID trong Cài đặt (AppSettings)?     | Tải nội dung Gist từ GitHub                                  | Tự động tạo Gist ẩn mới trên GitHub                 |
| **2.2** | Hash nội dung Gist trùng với `lastSyncedHash`? | Không có thay đổi từ Cloud $\rightarrow$ Kiểm tra Local      | Có dữ liệu mới từ Cloud $\rightarrow$ Tải & Giải mã |
| **2.3** | Giải mã Ciphertext từ Gist thành công?         | Trộn dữ liệu theo RevisionDate & Lưu Local                   | Báo lỗi Master Password không khớp                  |
| **3.1** | Định dạng Xuất dữ liệu (Export) chọn?          | **Gistwarden JSON**, **Bitwarden CSV**, hoặc **Browser CSV** | N/A                                                 |
| **3.2** | File Nhập (Import) hợp lệ chuẩn CSV/JSON?      | Ánh xạ mục Vault, Validate & Lưu Batch                       | Báo lỗi định dạng file không hợp lệ                 |

---

## 📁 Danh Sách File Mã Nguồn Liên Quan

1. **[`src/features/sync/ExportAccounts.tsx`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/features/sync/ExportAccounts.tsx)**:
   Giao diện và logic Xuất dữ liệu cả 3 định dạng: **JSON**, **Bitwarden CSV**,
   và **Browser CSV**.
2. **[`src/features/sync/ImportAccounts.tsx`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/features/sync/ImportAccounts.tsx)**:
   Giao diện Nhập dữ liệu tự động nhận diện file CSV và JSON.
3. **[`src/features/sync/github-api.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/features/sync/github-api.ts)**:
   Các hàm giao tiếp REST API của GitHub Gist (`createGist`, `updateGist`,
   `getGist`).
4. **[`src/features/sync/github-auth.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/features/sync/github-auth.ts)**:
   Xử lý luồng GitHub OAuth 2.0 via Cloudflare Worker (`startGithubOAuth`).
5. **[`src/features/sync/sync-service.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/features/sync/sync-service.ts)**:
   Điều phối đồng bộ 2 chiều (`syncVaultWithGist`, `uploadToGist`,
   `downloadFromGist`).
6. **[`src/features/sync/csv-import.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/features/sync/csv-import.ts)**:
   Parser RFC 4180 đọc file CSV trình duyệt và Bitwarden CSV.
7. **[`src/features/sync/csv-export.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/features/sync/csv-export.ts)**:
   Xuất dữ liệu Vault thành chuẩn Bitwarden CSV và Browser CSV.
8. **[`src/features/sync/json-import.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/features/sync/json-import.ts)**:
   Nhập và ánh xạ file sao lưu JSON.
