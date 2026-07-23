# Tài Liệu Mô Tả Chi Tiết: Chức Năng Gợi Ý Lưu Mật Khẩu (Password Save Suggestion)

Tài liệu này chia nhỏ luồng hoạt động của tính năng **Gợi ý Lưu mật khẩu** thành **4 Giai đoạn chi tiết**, tích hợp các sơ đồ thuật toán (Flowchart) nêu rõ từng bước rẽ nhánh **True / False** và xử lý Edge Cases.

---

## 🛑 GIAI ĐOẠN 1: Bắt Sự Kiện & Trích Xuất Form (Form Detection Phase)

Giai đoạn này diễn ra tại **Content Script** (`src/extension/autofill-core.ts`) lắng nghe các hành vi gửi thông tin của người dùng trên trang web.

```mermaid
flowchart TD
    Phase1Start([Bắt đầu: Người dùng bấm Submit / Click nút Đăng nhập]) --> CheckPassInput{Form có chứa Input Password?}
    CheckPassInput -- False --> IgnoreForm[Bỏ qua - Không xử lý]
    CheckPassInput -- True --> ExtractData[Trích xuất Domain, Username, Password]
    
    ExtractData --> CheckDebounce{Đã gửi thông tin này trong 1000ms qua?}
    CheckDebounce -- True (Trùng lặp Debounce) --> IgnoreDebounce[Bỏ qua - Tránh gửi trùng]
    CheckDebounce -- False --> SendSubmittedMsg[Gửi IPC Message: MSG_CREDENTIALS_SUBMITTED sang Background]
    SendSubmittedMsg --> Phase1End([Kết thúc Giai đoạn 1])
```

---

## 🔄 GIAI ĐOẠN 2: Xử Lý & Kiểm Tra Trùng Lập tại Background (Deduplication Phase)

Giai đoạn này diễn ra tại **Background Service Worker** (`src/extension/background.ts`) để quyết định xem có cần gợi ý hay không và loại gợi ý là gì.

```mermaid
flowchart TD
    Phase2Start([Bắt đầu: Background nhận MSG_CREDENTIALS_SUBMITTED]) --> CheckExactDup{Đối chiếu Vault: Trùng khớp cả Domain + Username + Password?}
    
    CheckExactDup -- True (Đã có tài khoản này) --> IgnoreDup[Bỏ qua - Không hiện gợi ý]
    CheckExactDup -- False --> CheckPasswordChange{Cùng Domain + Username nhưng Mật khẩu KHÁC?}
    
    CheckPasswordChange -- True --> SetUpdateAction[Gán actionType = 'update' - Cập nhật mật khẩu]
    CheckPasswordChange -- False --> SetAddAction[Gán actionType = 'add' - Lưu mật khẩu mới]
    
    SetUpdateAction --> SavePendingState[Lưu Payload vào pendingTabNotifications & lastGlobalPendingNotification]
    SetAddAction --> SavePendingState
    SavePendingState --> Phase2End([Kích hoạt Giai đoạn 3: Điều phối Chống nháy])
```

---

## ⚡ GIAI ĐOẠN 3: Điều Phối Hiển Thị Toast Chống Nháy (Zero-Flicker Rendering Phase)

Giai đoạn này giải quyết triệt để vấn đề chuyển trang HTML (Trang A $\rightarrow$ Trang B) khiến Toast bị nháy hoặc hiển thị trùng lặp.

```mermaid
flowchart TD
    Phase3Start([Bắt đầu Giai đoạn 3: Khởi tạo setTimeout 300ms]) --> CheckNavFast{Trang web có chuyển trang HTML ngay <300ms?}
    
    CheckNavFast -- True (Trang A điều hướng sang Trang B) --> PageBCheck[Trang B nạp xong -> Gửi MSG_CHECK_PENDING_NOTIFICATION]
    PageBCheck --> ConsumeQueue[Background trả về Payload & XÓA Pending Queue]
    ConsumeQueue --> ShowToastPageB[Trang B hiển thị Toast mượt mà 1 lần trên Trang B]
    ShowToastPageB --> Timer300msFast[Sau 300ms: Bộ đếm hết hạn thấy Pending Queue đã bị xóa -> KHÔNG gửi sang Trang A]
    
    CheckNavFast -- False (Form AJAX / SPA hoặc Mạng phản hồi chậm >300ms) --> Timer300msSlow[Sau 300ms: Bộ đếm hết hạn thấy Pending Queue vẫn còn]
    Timer300msSlow --> SendShowMsgPageA[Background gửi MSG_SHOW_NOTIFICATION_BAR sang Trang A]
    SendShowMsgPageA --> ShowToastPageA[Trang A hiển thị Toast mượt mà 1 lần trên Trang A]
```

---

## 🎯 GIAI ĐOẠN 4: Phản Hồi Tương Tác & Lưu Mã Hóa (User Interaction & Vault Encryption)

Giai đoạn này xử lý tương tác của người dùng trên Toast Card và luồng lưu trữ an toàn khi Vault đang Mở khóa hoặc bị Khóa.

```mermaid
flowchart TD
    Phase4Start([Bắt đầu: Toast Card hiển thị trên màn hình]) --> UserAction{Người dùng tương tác thế nào?}
    
    UserAction -- Nút X / Phím Escape / Hết 5s đếm ngược --> SlideOutAnim[Chạy Outro Slide Animation 0.2s]
    SlideOutAnim --> UnmountToast[Gỡ Toast khỏi DOM & Xóa Pending Queue]
    UnmountToast --> EndDismiss([Kết thúc: Bỏ qua không lưu])
    
    UserAction -- Di chuột vào Toast Card --> PauseTimer[Tạm dừng đếm ngược 5s & Progress Bar - Pause on hover]
    PauseTimer --> Phase4Start
    
    UserAction -- Bấm nút 'Lưu mật khẩu' / 'Cập nhật' --> SendSaveMsg[Gửi MSG_SAVE_CREDENTIAL_ACTION confirm]
    SendSaveMsg --> CheckVaultUnlocked{Kho dữ liệu Vault hiện tại có đang MỞ KHÓA không?}
    
    CheckVaultUnlocked -- True (Đã Đăng Nhập) --> ReadCryptoKey[Đọc CryptoKey giải mã AES-GCM]
    ReadCryptoKey --> EncryptVaultData[Cập nhật mảng VaultItems & Mã hóa lại AES-GCM]
    EncryptVaultData --> UploadToGist[Lưu Session Storage & Tự động Upload GitHub Gist]
    UploadToGist --> EndDirectSaveSuccess([Hoàn thành: Lưu & Sync Gist công khai thành công!])
    
    CheckVaultUnlocked -- False (Vault bị Khóa / Chưa Đăng Nhập) --> AddToPendingQueue[Thêm tài khoản vào Queue: STORAGE_KEY_UNAPPROVED_PENDING_LOGINS]
    AddToPendingQueue --> CallOpenPopupAPI[Tự động kích hoạt API: chrome.action.openPopup]
    CallOpenPopupAPI --> DisplayExtensionPopup[Bật Cửa sổ Extension Popup góc trên bên phải]
    DisplayExtensionPopup --> CheckUserUnlock{Người dùng nhập PIN / Master Password mở khóa?}
    
    CheckUserUnlock -- False (Hủy mở khóa) --> KeepPendingQueue[Dữ liệu vẫn nằm an toàn trong Queue cho lần mở khóa sau]
    CheckUserUnlock -- True (Mở khóa thành công) --> ProcessPendingQueue[Hàm processPendingUnapprovedCredentials tự động chạy]
    ProcessPendingQueue --> BatchEncryptAndSync[Mã hóa AES-GCM tất cả tài khoản trong Queue & Sync Gist]
    BatchEncryptAndSync --> ClearQueueStorage[Xóa sạch Queue unapproved_pending_logins khỏi chrome.storage.local]
    ClearQueueStorage --> EndBatchSaveSuccess([Hoàn thành: Tự động lưu Batch thành công!])
```

---

## 📊 TÓM TẮT QUY TRÌNH RẼ NHÁNH TỔNG HỢP (Decision Matrix)

| Bước | Câu hỏi điều kiện | Kết quả TRUE | Kết quả FALSE |
| :--- | :--- | :--- | :--- |
| **1.1** | Form có chứa input `password`? | Trích xuất dữ liệu | Bỏ qua hoàn toàn |
| **1.2** | Đã submit thông tin này trong 1000ms qua? | Bỏ qua (Chống duplicate submit) | Gửi `MSG_CREDENTIALS_SUBMITTED` |
| **2.1** | Trùng cả Domain + Username + Password? | Bỏ qua (Đã có sẵn tài khoản này) | Kiểm tra rẽ nhánh 2.2 |
| **2.2** | Cùng Domain + Username nhưng Mật khẩu KHÁC? | Gán `actionType = "update"` | Gán `actionType = "add"` |
| **3.1** | Trang chuyển hướng HTML sang Trang B trong <300ms? | Hiện Toast 1 lần ở Trang B | Hiện Toast 1 lần ở Trang A sau 300ms |
| **4.1** | Di chuột vào Toast Card? | Tạm dừng 5s timer (Pause on hover) | Tiếp tục đếm ngược 5s |
| **4.2** | Vault hiện tại đang Mở khóa (Unlocked)? | Mã hóa AES-GCM & Sync Gist ngay | Đưa vào Queue & Tự mở Popup |
| **4.3** | Mở khóa Extension Popup thành công? | Tự động rút Queue, lưu Batch & Sync Gist | Giữ Queue an toàn cho lần mở khóa sau |

---

## 📁 Danh Sách File Mã Nguồn Liên Quan

1. **[`src/features/notification/NotificationToast.tsx`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/features/notification/NotificationToast.tsx)**: SolidJS Component giao diện Toast Card, đếm ngược, pause-on-hover, phím Escape và Native Event Listeners.
2. **[`src/features/notification/notification-bar.tsx`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/features/notification/notification-bar.tsx)**: Quản lý vòng đời Shadow DOM.
3. **[`src/extension/background.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/extension/background.ts)**: Điều phối sự kiện submit, hoãn 300ms chống nháy, quản lý Queue và `chrome.action.openPopup()`.
4. **[`src/extension/autofill-core.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/extension/autofill-core.ts)**: Bắt sự kiện submit form và debounce 1000ms.
5. **[`src/core/types.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/core/types.ts)** & **[`src/core/i18n.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/core/i18n.ts)**: Định nghĩa kiểu dữ liệu và từ điển dịch thuật đa ngôn ngữ.
