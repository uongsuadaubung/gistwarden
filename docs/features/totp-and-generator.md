# Tài Liệu Mô Tả Chi Tiết: Chức Năng Mã Xác Thực TOTP (2FA) & Trình Sinh Mật Khẩu (Password & Passphrase Generator)

Tài liệu này mô tả chi tiết kiến trúc, công thức toán học mật mã và luồng thuật
toán rẽ nhánh **True / False** của công cụ **Tính mã TOTP 2FA** và **Trình sinh
Mật khẩu / Cụm mật khẩu an toàn (Generator)** trong Gistwarden.

---

## 1. Tổng Quan (Overview)

1. **Bộ tính mã TOTP (Time-based One-Time Password)**:
   - Tuân thủ chuẩn quốc tế **RFC 6238** (HMAC-SHA1, chu kỳ 30 giây, 6 chữ số).
   - Hỗ trợ phân tích chuỗi URI dạng `otpauth://totp/...` hoặc mã Base32 Secret
     thô.
   - Tự động tính toán và hiển thị thanh đếm ngược đĩa tròn (Progress Ring 30s).
   - Hỗ trợ cấu hình lệch giờ máy chủ `timeOffset` (Drift Correction).

2. **Trình sinh Mật khẩu & Cụm mật khẩu (Generator Engine)**:
   - Sinh chuỗi Mật khẩu ngẫu nhiên (Random Password) hoặc Cụm từ mật khẩu
     (Passphrase / EFF Wordlist).
   - Sử dụng bộ sinh số ngẫu nhiên an toàn tuyệt đối của trình duyệt
     `crypto.getRandomValues()` (`getRandomBoundedInt`).
   - Đảm bảo tuân thủ nghiêm ngặt các ràng buộc tối thiểu (tối thiểu chữ hoa,
     chữ thường, số, ký tự đặc biệt).

---

## 🛑 GIAI ĐOẠN 1: Thuật Toán Tính Mã TOTP 2FA (TOTP Engine Phase)

```mermaid
flowchart TD
    TotpStart([Bắt đầu: Cần hiển thị hoặc copy mã TOTP]) --> ExtractSecret[Phân tích chuỗi Secret từ otpauth URI hoặc Base32 thô]
    ExtractSecret --> CheckSecretValid{Secret Base32 có hợp lệ?}
    
    CheckSecretValid -- False --> ShowTotpError[Báo lỗi: Mã Secret TOTP không hợp lệ]
    CheckSecretValid -- True --> DecodeBase32[Giải mã chuỗi Base32 sang mảng bytes]
    
    DecodeBase32 --> GetCurrentTime[Lấy thời gian hiện tại Unix Timestamp + timeOffset]
    GetCurrentTime --> ComputeTimeStep[Tính bước thời gian Counter = Math.floor time / 30]
    
    ComputeTimeStep --> CalculateHMAC[Tính HMAC-SHA1 giữa Counter và Key bytes]
    CalculateHMAC --> DynamicTruncation[Cắt động Dynamic Truncation lấy 4 bytes cuối]
    DynamicTruncation --> Compute6DigitCode[Lấy giá trị mod 1000000 -> Chuỗi mã OTP 6 chữ số]
    
    Compute6DigitCode --> CalculateRemainingTime[Tính thời gian còn lại = 30 - time % 30]
    CalculateRemainingTime --> RenderUiProgressRing[Hiển thị Mã OTP & Cập nhật Vòng tròn đếm ngược Progress Ring]
    RenderUiProgressRing --> TotpComplete([Hoàn thành Tính mã TOTP!])
```

---

## 🎲 GIAI ĐOẠN 2: Trình Sinh Mật Khẩu & Cụm Mật Khẩu (Generator Engine Phase)

```mermaid
flowchart TD
    GenStart([Bắt đầu: Người dùng mở công cụ Sinh Mật khẩu]) --> CheckGenType{Loại Generator người dùng chọn?}
    
    %% Sinh Mật khẩu Ngẫu nhiên (Password)
    CheckGenType -- Mật khẩu Ngẫu nhiên (Password) --> BuildCharset[Xây dựng bảng ký tự Charset theo cấu hình: Uppercase, Lowercase, Digits, Symbols]
    BuildCharset --> LoopPasswordLength[Vòng lặp sinh từng ký tự theo độ dài mong muốn length]
    LoopPasswordLength --> CallGetCryptoRandom[Gọi crypto.getRandomValues lấy số ngẫu nhiên an toàn]
    CallGetCryptoRandom --> MapToCharset[Ánh xạ số ngẫu nhiên vào bảng ký tự Charset]
    MapToCharset --> CheckMinConstraints{Chuỗi sinh ra đã thỏa mãn Ràng buộc Tối thiểu minUppercase, minDigits...?}
    
    CheckMinConstraints -- False (Thiếu loại ký tự bắt buộc) --> ReGeneratePassword[Sinh lại mật khẩu mới thỏa mãn ràng buộc]
    ReGeneratePassword --> CheckMinConstraints
    CheckMinConstraints -- True --> ReturnGeneratedPassword[Trả về Mật khẩu Ngẫu nhiên An toàn]
    
    %% Sinh Cụm từ (Passphrase)
    CheckGenType -- Cụm từ mật khẩu (Passphrase) --> LoadWordlist[Nạp danh sách từ vựng EFF Wordlist]
    LoadWordlist --> LoopWordCount[Vòng lặp chọn wordCount từ vựng từ Wordlist]
    LoopWordCount --> CallCryptoRandomWord[Gọi crypto.getRandomValues chọn chỉ số từ ngẫu nhiên]
    CallCryptoRandomWord --> CapitalizeWord[In hoa chữ cái đầu nếu capitalize = true]
    CapitalizeWord --> JoinWords[Nối các từ lại bằng Ký tự phân cách separator]
    
    JoinWords --> CheckIncludeNumber{Cấu hình includeNumber = true?}
    CheckIncludeNumber -- True --> AppendRandomDigit[Chèn ngẫu nhiên 1 chữ số vào cuối Cụm từ]
    CheckIncludeNumber -- False --> ReturnPassphrase
    AppendRandomDigit --> ReturnPassphrase[Trả về Cụm từ Mật khẩu Dễ nhớ & An toàn]
    
    ReturnGeneratedPassword --> DisplayResult[Hiển thị kết quả & Đánh giá Độ mạnh Mật khẩu Strength Meter]
    ReturnPassphrase --> DisplayResult
    DisplayResult --> GenComplete([Hoàn tất Sinh Mật khẩu!])
```

---

## 📊 TÓM TẮT QUY TRÌNH RẼ NHÁNH TỔNG HỢP (Decision Matrix)

| Bước    | Câu hỏi điều kiện                                                                 | Kết quả TRUE                             | Kết quả FALSE                        |
| :------ | :-------------------------------------------------------------------------------- | :--------------------------------------- | :----------------------------------- |
| **1.1** | Chuỗi TOTP Secret Base32 hợp lệ?                                                  | Giải mã Base32, tính HMAC-SHA1 & Mã 6 số | Hiển thị báo lỗi Secret không hợp lệ |
| **2.1** | Mật khẩu sinh ra thỏa mãn các ràng buộc tối thiểu (`minDigits`, `minSymbols`...)? | Chấp nhận Mật khẩu & Hiển thị            | Tự động sinh lại chuỗi mới đạt chuẩn |
| **2.2** | Passphrase có bật tùy chọn chèn chữ số (`includeNumber`)?                         | Chèn chữ số ngẫu nhiên vào Cụm từ        | Giữ nguyên cụm từ từ Wordlist        |

---

## 📁 Danh Sách File Mã Nguồn Liên Quan

1. **[`src/core/crypto.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/core/crypto.ts)**:
   Hàm tính toán mã TOTP HMAC-SHA1 (`generateTotpCode`, `parseTotpSecret`).
2. **[`src/features/generator/generator-utils.ts`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/features/generator/generator-utils.ts)**:
   Bộ sinh Mật khẩu ngẫu nhiên (`generatePassword`), Cụm từ
   (`generatePassphrase`) và hàm sinh số ngẫu nhiên an toàn tuyệt đối
   (`getRandomBoundedInt`).
3. **[`src/features/generator/Generator.tsx`](file:///c:/Users/kien.hm/Desktop/totp%20generate/src/features/generator/Generator.tsx)**:
   Component giao diện công cụ Generator, tùy chỉnh độ dài và thanh đánh giá độ
   mạnh Mật khẩu.
