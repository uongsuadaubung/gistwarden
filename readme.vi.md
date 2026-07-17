# Gistwarden - Tiện ích Két sắt Mật khẩu Cá nhân Bảo mật Cao 🔒🔑

[![SolidJS](https://img.shields.io/badge/SolidJS-1.9-2c4f7c?style=for-the-badge&logo=solid&logoColor=white)](https://solidjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Deno](https://img.shields.io/badge/Deno-2.x-black?style=for-the-badge&logo=deno&logoColor=white)](https://deno.com)
[![Esbuild](https://img.shields.io/badge/Esbuild-0.28-ffcf00?style=for-the-badge&logo=esbuild&logoColor=black)](https://esbuild.github.io)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285f4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](https://opensource.org/licenses/ISC)

Gistwarden là một tiện ích mở rộng (Browser Extension) mã nguồn mở, được thiết
kế để quản lý mật khẩu, mã OTP (TOTP), ghi chú bảo mật và mã khóa đăng nhập
(Passkeys) hoàn toàn miễn phí, an toàn và riêng tư tuyệt đối.

Thay vì phải trả phí duy trì hàng năm cho server đám mây của bên thứ ba,
Gistwarden được phát triển nhằm mang lại một giải pháp **thay thế tương đương**,
hoạt động độc lập, tận dụng kho lưu trữ cá nhân **GitHub Gist** làm cơ sở dữ
liệu và đặc biệt là tối ưu hóa bảo mật ở mức cao nhất, có khả năng tương thích
tuyệt đối với dữ liệu xuất ra từ Bitwarden.

---

## ⚡ Các tính năng chính

### 1. 🔒 Kiến trúc Bảo mật Zero-Knowledge tuyệt đối

- **Mã hóa cục bộ:** Toàn bộ dữ liệu két sắt được mã hóa ngay tại trình duyệt
  trước khi đồng bộ lên GitHub Gist.
- **Riêng tư tối đa:** Không một ai — kể cả GitHub hay nhà phát triển tiện ích —
  có thể đọc được dữ liệu của bạn nếu không có Mật khẩu Master.

### 2. ⚡ Hỗ trợ Passkeys (FIDO2/WebAuthn)

- **Đăng nhập không mật khẩu:** Khởi tạo, giả lập và lưu trữ các khóa đăng nhập
  Passkeys hiện đại trực tiếp ngay bên trong extension.
- **Bảo vệ chống rò rỉ chéo tên miền:** Tích hợp kiểm tra tên miền khớp chéo để
  bảo vệ tài khoản không bị rò rỉ thông tin khóa.

### 3. ⏱️ Mã xác thực OTP động (TOTP/2FA)

- **Quét mã QR tự động:** Hỗ trợ quét mã QR trực tiếp trên trang web hoặc nạp
  ảnh chụp mã QR để tự phân tích khóa bí mật.
- **Tự động sinh mã:** Tính toán và hiển thị mã bảo mật 2 lớp cập nhật tự động
  sau mỗi 30 giây.

### 4. 🔄 Nhập xuất dữ liệu từ Bitwarden dễ dàng

- **Nhập dữ liệu mượt mà:** Nhập trực tiếp tệp JSON không mã hóa từ Bitwarden
  (bao gồm cả mật khẩu, ghi chú, custom fields và khóa TOTP).
- **Sao lưu ngoại tuyến:** Giải mã và tải xuống cơ sở dữ liệu két sắt dưới dạng
  file JSON backup bất cứ lúc nào.

### 5. 🌐 Hỗ trợ đa ngôn ngữ

- **Song ngữ:** Dễ dàng chuyển đổi linh hoạt giữa **Tiếng Anh 🇬🇧** và **Tiếng
  Việt 🇻🇳** trực tiếp từ giao diện cài đặt hoặc màn hình chào mừng.

### 6. 🎨 Giao diện hiện đại & cao cấp

- **Thiết kế Tinh tế & Hiện đại:** Giao diện trực quan đẹp mắt, thanh cuộn tùy
  chỉnh mượt mà và các hiệu ứng chuyển cảnh tự nhiên.
- **Chế độ Sáng/Tối:** Hỗ trợ cấu hình chủ đề Dark Mode và Light Mode thời
  thượng.

---

## 🔒 Kiến trúc Bảo mật

### 1. Cơ chế Sinh khóa Kháng Phần cứng (Key Derivation - KDF)

Gistwarden sử dụng **Argon2id (WebAssembly)** - thuật toán chiến thắng giải
_Password Hashing Competition_ và là tiêu chuẩn bảo mật tốt nhất hiện nay - giúp
kháng lại mọi hình thức dò mật khẩu (brute-force) bằng thiết bị phần cứng chuyên
dụng (như GPU, FPGA, ASIC).

- **Thông số:** Bộ nhớ: **64 MB**, Vòng lặp: **3 vòng**, Luồng song song: **1
  luồng** (Tối ưu cho môi trường Extension đơn luồng).
- **Khả năng phòng thủ:** Yêu cầu 64MB RAM cho mỗi lần thử mật khẩu khiến các
  thiết bị đào coin/GPU bị nghẽn cổ chai RAM và tăng chi phí tấn công lên hàng
  triệu lần, bảo vệ mật khẩu Master trước mọi đòn tấn công ngoại tuyến.

### 2. Tiêu chuẩn Mã hóa Quân đội

Dữ liệu của bạn được bảo vệ bởi các tiêu chuẩn:

- **AES-GCM 256-bit:** Chuẩn mã hóa đối xứng xác thực (AEAD) tiên tiến nhất. Bất
  kỳ sự thay đổi trái phép nào đối với file mã hóa trên Gist sẽ làm quá trình
  giải mã thất bại ngay lập tức, chống tấn công chèn hay sửa đổi file dữ liệu.
- **Vector khởi tạo (IV) ngẫu nhiên 12-byte:** Được sinh ra bởi API ngẫu nhiên
  bảo mật của trình duyệt (`crypto.getRandomValues`) cho mỗi lần lưu, đảm bảo
  ciphertext luôn độc nhất cho dù dữ liệu mật khẩu bên trong trùng khớp.

### 3. Tích hợp WebAssembly An toàn (Local WASM Package)

Để tuân thủ tiêu chuẩn Content Security Policy (CSP) cực kỳ khắt khe của Chrome
Extension **Manifest V3**:

- Nhân WebAssembly của thư viện mã hóa `hash-wasm` được **mã hóa base64 và nhúng
  trực tiếp** vào bên trong bundle JS của extension.
- Tiện ích cam kết **không tải bất kỳ tập lệnh (scripts) hoặc nhị phân
  (binaries) từ bên ngoài** qua internet trong quá trình hoạt động, loại bỏ hoàn
  toàn nguy cơ bị tấn công trung gian (MITM).

---

## 🛠️ Hướng dẫn cài đặt

Sau khi biên dịch, các file sản phẩm sẽ được tạo trong thư mục `/dist`. Bạn có
thể nạp thư mục đã giải nén này vào trình duyệt của mình:

### 1. Google Chrome & các trình duyệt nhân Chromium (Edge, Brave, Opera, Cốc Cốc...)

1. Chạy lệnh build tiện ích và đảm bảo bạn có thư mục `dist/chrome` (hoặc giải
   nén từ tệp `dist/chrome.zip`).
2. Mở Chrome và truy cập đường dẫn [chrome://extensions/](chrome://extensions/).
3. Bật **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải.
4. Bấm nút **Tải tiện ích đã giải nén (Load unpacked)** ở góc trên bên trái.
5. Chọn thư mục `dist/chrome` trên máy tính của bạn.
6. Ghim biểu tượng extension lên thanh công cụ để sử dụng.

### 2. Mozilla Firefox

#### Cách 1: Cài đặt tạm thời (Để phát triển - sẽ mất khi tắt trình duyệt)

1. Mở Firefox và truy cập
   [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox).
2. Bấm nút **Load Temporary Add-on...** (Tải tiện ích tạm thời).
3. Chọn file `manifest.json` nằm trong thư mục `dist/firefox`.

#### Cách 2: Cài đặt vĩnh viễn (Yêu cầu Firefox Developer Edition hoặc Firefox Nightly)

1. Truy cập `about:config` trên Firefox.
2. Tìm từ khóa `xpinstall.signatures.required` và nhấp đúp để đổi giá trị thành
   `false`.
3. Truy cập [about:addons](about:addons), bấm vào biểu tượng bánh răng ở góc
   trên bên phải, chọn **Install Add-on From File...** (Cài đặt tiện ích từ
   file).
4. Chọn tệp `dist/firefox.zip` để cài đặt vĩnh viễn.

---

## 🔑 Cách tạo GitHub Personal Access Token

Để liên kết két sắt an toàn với đám mây, tiện ích sử dụng kho lưu trữ GitHub
Gists cá nhân của bạn. Thực hiện theo các bước đơn giản sau:

1. **Đăng nhập:** Đăng nhập vào tài khoản [GitHub](https://github.com) của bạn.
2. **Tạo nhanh mã Token:** Bấm vào liên kết được cấu hình sẵn quyền hạn này:
   [Trang tạo nhanh GitHub Token (Gist)](https://github.com/settings/tokens/new?description=Gistwarden%20Sync&scopes=gist).
3. **Cấu hình thiết lập:**
   - **Note:** Nhập mô tả (ví dụ: `Gistwarden Vault`).
   - **Expiration:** Chọn **No expiration** (Không bao giờ hết hạn) để tránh lỗi
     đồng bộ trong tương lai.
   - **Scopes:** Đảm bảo checkbox quyền **gist** đã được chọn (đây là quyền duy
     nhất tiện ích cần).
4. **Tạo mã:** Cuộn xuống cuối trang và bấm nút xanh **Generate token** (Tạo
   token).
5. **Lưu cấu hình:** Sao chép chuỗi mã Token vừa được tạo (bắt đầu bằng `ghp_`).
   Mở tiện ích Gistwarden, vào phần **Cài đặt**, dán mã vào ô GitHub Token và
   bấm **Lưu**.

> [!WARNING]
> **LƯU Ý BẢO MẬT QUAN TRỌNG:** Tuyệt đối không chia sẻ mã GitHub Token của bạn
> cho bất kỳ ai. Tiện ích chỉ lưu mã này cục bộ trong bộ nhớ trình duyệt và giao
> tiếp trực tiếp với máy chủ GitHub API. Không có bất kỳ máy chủ trung gian nào
> của bên thứ ba được sử dụng.

---

## 📂 Cấu trúc thư mục dự án

```text
totp-generate/
├── .github/              # Cấu hình GitHub Actions chạy tự động hóa
├── dist/                 # Thư mục đầu ra sản phẩm (Chrome & Firefox)
├── src/                  # Mã nguồn chính của extension
│   ├── components/       # Các component giao diện SolidJS
│   │   └── guide/        # Các tab nội dung trang hướng dẫn sử dụng
│   ├── domains/          # Logic nghiệp vụ
│   │   └── github/       # Client gọi API GitHub Gist
│   ├── extension/        # Điểm khởi chạy extension
│   │   ├── background.ts # Script chạy ngầm quản lý OAuth và FIDO2
│   │   ├── fido2-content-script.ts # Script chèn phát hiện khóa WebAuthn
│   │   └── fido2-page-script.ts    # Script can thiệp trang web tạo/xác thực khóa
│   ├── icons/            # File icon dạng SVG
│   ├── images/           # Ảnh minh họa trực quan cho trang hướng dẫn
│   ├── shared/           # Tiện ích chung, hằng số, locales và trạng thái store
│   │   ├── locales/      # File dịch thuật tiếng Anh (en.ts) và tiếng Việt (vi.ts)
│   │   ├── i18n.ts       # Công cụ xử lý đa ngôn ngữ
│   │   └── store.ts      # Quản lý trạng thái SolidJS store
│   ├── views/            # Các màn hình chính (Đăng nhập, Két sắt, Cài đặt, Chào mừng)
│   ├── guide.html        # Khung HTML trang Hướng dẫn sử dụng
│   ├── popup.html        # Khung HTML giao diện popup nhỏ
│   ├── popup-entry.tsx   # Điểm render SolidJS cho cửa sổ popup
│   └── guide-entry.tsx   # Điểm render SolidJS cho trang hướng dẫn
├── tests/                # Bộ kiểm thử đơn vị (kiểm tra Argon2id, mã hóa AES)
├── build.ts              # Script biên dịch esbuild và xử lý SCSS (TypeScript)
├── deno.json             # File cấu hình task Deno và trình biên dịch
├── deno.lock             # File khóa phiên bản thư viện Deno an toàn
└── version.ts            # Script tự động nâng số phiên bản (TypeScript)
```

---

## 🏗️ Các lệnh phát triển và đóng gói

Dự án sử dụng **Deno** nguyên bản để phát triển, kiểm tra cú pháp, định dạng và
biên dịch.

### 1. Đóng gói Extension

Biên dịch mã nguồn, SCSS và đóng gói thành các tệp ZIP hoàn chỉnh:

```bash
deno task build
```

### 2. Chế độ Watch (Tự động biên dịch khi sửa file)

```bash
deno task watch
```

### 3. Kiểm tra cú pháp (Linter)

```bash
deno task lint
```

### 4. Tự động định dạng mã nguồn (Formatter)

```bash
deno task fmt
```

### 5. Chạy bộ kiểm thử (Unit Tests)

```bash
deno task test
```
