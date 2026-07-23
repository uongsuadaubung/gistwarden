# Tài Liệu Mô Tả Chi Tiết: Luồng Khởi Tạo Ứng Dụng & Vòng Đời Boot (App Initialization & Boot Lifecycle)

Tài liệu này mô tả chi tiết kiến trúc, thứ tự ưu tiên nạp module và luồng thuật
toán rẽ nhánh **True / False** của **Luồng Khởi Tạo Ứng Dụng (App
Initialization)** trong Gistwarden từ lúc mở Popup / Extension cho tới khi hoàn
tất nạp kho dữ liệu.

---

## 1. Tổng Quan (Overview)

Luồng khởi tạo của Gistwarden đóng vai trò cốt lõi trong việc đảm bảo tính bảo
mật và trải nghiệm tức thì cho người dùng:

- **Tốc độ nạp tức thì (Instant Startup)**: Ngôn ngữ mặc định và Giao diện
  (Theme) được thiết lập đồng bộ ngay tại bước nạp module để chống giật/nháy
  giao diện.
- **Xác thực phiên an toàn (Session Management)**: Kiểm tra thông minh trạng
  thái khóa trong `chrome.storage.session` để quyết định mở thẳng Vault hay yêu
  cầu mở khóa bằng Master Password / Mã PIN.
- **Tự động xử lý Hàng chờ (Auto Queue Drain)**: Tự động gom và mã hóa các tài
  khoản được yêu cầu lưu trước đó khi Vault bị khóa ngay khi ứng dụng boot thành
  công.

---

## 🛑 GIAI ĐOẠN 1: Nạp Module & Khởi Tạo Môi Trường (Module Boot & Environment Phase)

Giai đoạn này diễn ra ngay khi mở Popup (`src/popup-entry.tsx`) hoặc trang Hướng
dẫn (`src/guide-entry.tsx`).

```mermaid
flowchart TD
    AppStart([Bắt đầu: Mở Cửa sổ Popup / Extension Page]) --> SetSyncDefaults[Khởi tạo Ngôn ngữ mặc định & Theme giao diện]
    SetSyncDefaults --> ApplyThemeDOM[Gắn class 'dark' hoặc 'light' vào thẻ html DOM]
    ApplyThemeDOM --> AsyncInitI18n[Gọi initI18n nạp cấu hình ngôn ngữ lưu trong Storage]
    
    AsyncInitI18n --> LoadAllSettings[Gọi getAllSettings đọc toàn bộ Cài đặt AppSettings]
    LoadAllSettings --> CheckSettingsLoaded{Cài đặt AppSettings nạp thành công?}
    
    CheckSettingsLoaded -- False --> ShowInitError[Hiển thị báo lỗi không thể nạp Cài đặt]
    CheckSettingsLoaded -- True --> PopulateSettingsStore[Nạp Cài đặt vào SolidJS Store store.isLoaded = true]
    PopulateSettingsStore --> Phase1Complete([Kích hoạt Giai đoạn 2: Kiểm tra Phiên làm việc])
```

---

## 🔓 GIAI ĐOẠN 2: Kiểm Tra Trạng Thái Phiên & Mở Khóa Vault (Session & Lock Check Phase)

Giai đoạn này xác định xem kho lưu trữ Vault đã được giải mã sẵn trong Session
hay cần mở khóa.

```mermaid
flowchart TD
    Phase2Start([Bắt đầu Giai đoạn 2: Kiểm tra Session Storage]) --> ReadSessionStorage[Đọc key sessionUnlocked & encryptedVault từ chrome.storage.session]
    ReadSessionStorage --> CheckSessionUnlocked{Session sessionUnlocked === 'true' & có Vault cache?}
    
    %% Đã Mở khóa sẵn trong Phiên
    CheckSessionUnlocked -- True (Vault đã Mở khóa sẵn) --> DecryptSessionCache[Dùng DerivedKey trong Session giải mã Vault cache]
    DecryptSessionCache --> CheckDecryptCachePass{Giải mã Cache THÀNH CÔNG?}
    
    CheckDecryptCachePass -- True --> PopulateVaultStore[Nạp danh sách VaultItems vào Store: store.isLocked = false]
    PopulateVaultStore --> RestoreLastView[Khôi phục View trước đó SESSION_KEY_LAST_VIEW hoặc mở View.Vault]
    RestoreLastView --> Phase2UnlockedComplete([Chuyển sang Giai đoạn 3: Xử lý Queue & Sync])
    
    CheckDecryptCachePass -- False --> LockVaultState[Chuyển trạng thái kho sang KHÓA: store.isLocked = true]
    
    %% Chưa Mở khóa Phiên
    CheckSessionUnlocked -- False (Kho đang KHÓA) --> LockVaultState
    LockVaultState --> CheckPinEnabled{Mở khóa bằng Mã PIN đang BẬT?}
    
    CheckPinEnabled -- False --> ShowMasterPassScreen[Hiển thị Màn hình nhập Mật khẩu Master]
    CheckPinEnabled -- True --> CheckRestartRule{Cấu hình requireMasterPasswordOnRestart đang BẬT?}
    
    CheckRequireMasterRule -- True & Vừa Restart --> ShowMasterPassScreen
    CheckRequireMasterRule -- False / Đã unlock phiên --> ShowPinScreen[Hiển thị Màn hình nhập Mã PIN Code]
    
    ShowMasterPassScreen --> WaitUserAuth([Chờ người dùng mở khóa])
    ShowPinScreen --> WaitUserAuth
```

---

## ⚙️ GIAI ĐOẠN 3: Đặt Giờ Timeout, Xử Lý Queue & Đồng Bộ Gist (Post-Boot & Background Sync Phase)

Giai đoạn này diễn ra ngay sau khi kho Vault được mở khóa thành công.

```mermaid
flowchart TD
    Phase3Start([Bắt đầu Giai đoạn 3: Vault đã Mở khóa thành công]) --> ResetTimeoutAlarm[Đặt lại Bộ đếm thời gian tự động khóa Vault Alarm]
    ResetTimeoutAlarm --> ScanPendingQueue[Đọc Hàng chờ unapproved_pending_logins từ chrome.storage.local]
    
    ScanPendingQueue --> CheckQueueEmpty{Hàng chờ Queue có chứa Tài khoản chờ lưu không?}
    
    CheckQueueEmpty -- True (Có tài khoản trong Queue) --> DrainQueue[Chạy hàm processPendingUnapprovedCredentials]
    DrainQueue --> BatchEncryptQueue[Mã hóa AES-GCM tất cả tài khoản Queue vào mảng VaultItems]
    BatchEncryptQueue --> ClearQueueStorage[Xóa sạch key unapproved_pending_logins khỏi local storage]
    ClearQueueStorage --> TriggerBackgroundSync[Kích hoạt Đồng bộ ngầm GitHub Gist]
    
    CheckQueueEmpty -- False (Hàng chờ trống) --> TriggerBackgroundSync
    TriggerBackgroundSync --> CheckGithubToken{Đã cấu hình GitHub Token hợp lệ?}
    
    CheckGithubToken -- True --> SyncVaultGist[Gọi syncVaultWithGist đồng bộ 2 chiều với GitHub Cloud]
    CheckGithubToken -- False --> BootFinished([Hoàn tất Khởi tạo Ứng dụng thành công!])
    SyncVaultGist --> BootFinished
```

---

## 📊 TÓM TẮT QUY TRÌNH RẼ NHÁNH TỔNG HỢP (Decision Matrix)

| Bước    | Câu hỏi điều kiện                                        | Kết quả TRUE                                    | Kết quả FALSE                                 |
| :------ | :------------------------------------------------------- | :---------------------------------------------- | :-------------------------------------------- |
| **1.1** | Cài đặt `AppSettings` nạp thành công từ Storage?         | Nạp Cài đặt vào Store, chuyển sang Giai đoạn 2  | Báo lỗi không thể nạp Cài đặt                 |
| **2.1** | `sessionUnlocked === "true"` & có Vault Cache?           | Giải mã Vault cache & Nạp thẳng kho dữ liệu     | Đặt `store.isLocked = true` (Chuyển sang 2.2) |
| **2.2** | Cấu hình Mở khóa bằng PIN (`pinUnlockEnabled`) BẬT?      | Kiểm tra quy định khi khởi động lại trình duyệt | Hiển thị màn hình nhập Mật khẩu Master        |
| **3.1** | Hàng chờ Queue `unapproved_pending_logins` có tài khoản? | Tự động lưu Batch vào Vault & Xóa Queue         | Chuyển sang bước kiểm tra Đồng bộ Gist        |
| **3.2** | Đã cấu hình GitHub Token hợp lệ?                         | Tự động chạy `syncVaultWithGist` đồng bộ Gist   | Hoàn tất khởi tạo, ứng dụng sẵn sàng          |

---

## 📁 Danh Sách File Mã Nguồn Liên Quan

1. **[`src/popup-entry.tsx`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/popup-entry.tsx)**:
   File khởi tạo chính của Cửa sổ Popup Extension.
2. **[`src/guide-entry.tsx`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/guide-entry.tsx)**:
   File khởi tạo của Trang Hướng dẫn & Cài đặt mở rộng.
3. **[`src/core/store.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/core/store.ts)**:
   Quản lý trạng thái toàn cục SolidJS Store (`store.isLocked`,
   `store.isLoaded`, `store.vaultItems`...).
4. **[`src/core/i18n.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/core/i18n.ts)**:
   Nạp cấu hình ngôn ngữ từ Storage qua `initI18n()`.
5. **[`src/features/auth/session-service.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/features/auth/session-service.ts)**:
   Quản lý chìa khóa và Vault cache trong `chrome.storage.session`.
6. **[`src/extension/background.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/extension/background.ts)**:
   Lắng nghe sự kiện khởi động trình duyệt (`onStartup`/`onInstalled`) và tự
   động giải phóng Hàng chờ `processPendingUnapprovedCredentials`.
