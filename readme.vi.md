# Gistwarden - Tiện ích Két sắt Mật khẩu Cá nhân Bảo mật Cao

Gistwarden là một tiện ích mở rộng (Browser Extension) mã nguồn mở, được thiết
kế để quản lý mật khẩu, mã OTP (TOTP), ghi chú bảo mật và mã khóa khóa đăng nhập
(Passkeys) hoàn toàn miễn phí, an toàn và riêng tư tuyệt đối.

## 📌 Lý do ra đời

Dự án này được tạo ra bắt nguồn từ nhu cầu thực tế: **Tài khoản Bitwarden
Premium cá nhân hết hạn và chi phí gia hạn quá đắt đỏ.**

Thay vì phải trả phí duy trì hàng năm cho server đám mây của bên thứ ba,
Gistwarden được phát triển nhằm mang lại một giải pháp **thay thế tương đương**,
hoạt động độc lập, tận dụng kho lưu trữ cá nhân **GitHub Gist** làm cơ sở dữ
liệu và đặc biệt là tối ưu hóa bảo mật ở mức cao nhất, có khả năng tương thích
tuyệt đối với dữ liệu xuất ra từ Bitwarden.

---

## 🔒 Kiến trúc Bảo mật Tối tân (Security Architecture)

Gistwarden áp dụng nguyên lý **Zero-Knowledge** (Kiến thức bằng Không). Mọi dữ
liệu của bạn đều được mã hóa ngay tại trình duyệt trước khi đồng bộ lên đám mây
GitHub. Không một ai — kể cả GitHub hay nhà phát triển tiện ích — có thể đọc
được dữ liệu của bạn nếu không có Master Password.

### 1. Cơ chế Sinh khóa Kháng Phần cứng (Key Derivation)

Thay vì sử dụng thuật toán cũ PBKDF2 vốn dễ bị tấn công brute-force bằng các
thiết bị phần cứng chuyên dụng (như GPU, FPGA, ASIC), Gistwarden sử dụng
**Argon2id (WebAssembly)** - thuật toán chiến thắng giải _Password Hashing
Competition_ và là tiêu chuẩn bảo mật tối tân nhất hiện nay.

- **Thông số cấu hình:**
  - Bộ nhớ (Memory): **64 MB**
  - Số vòng lặp (Iterations): **3 vòng**
  - Luồng song song (Parallelism): **1 luồng** (Tối ưu cho môi trường Extension
    đơn luồng).
- **Khả năng phòng thủ:** Việc yêu cầu 64MB bộ nhớ RAM cho mỗi lần thử mật khẩu
  khiến các thiết bị phần cứng đào coin/dò mật khẩu chuyên dụng (GPU/ASIC) bị
  nghẽn cổ chai RAM và tăng chi phí tấn công lên hàng triệu lần, bảo vệ Master
  Password của bạn trước mọi đòn tấn công offline.

### 2. Tiêu chuẩn Mã hóa Quân đội (Data Encryption)

Sau khi khóa mã hóa được sinh ra từ Argon2id, dữ liệu của bạn sẽ được bảo vệ
bởi:

- **AES-GCM 256-bit:** Chuẩn mã hóa đối xứng xác thực (AEAD) tiên tiến nhất. Nó
  không chỉ che giấu dữ liệu (confidentiality) mà còn xác thực tính toàn vẹn
  (integrity). Bất kỳ sự thay đổi trái phép nào đối với file mã hóa trên Gist sẽ
  làm quá trình giải mã thất bại ngay lập tức, ngăn chặn đòn tấn công chèn/sửa
  đổi gói tin.
- **Vector khởi tạo (IV) ngẫu nhiên 12-byte:** Được sinh ra bởi API mã hóa ngẫu
  nhiên an toàn của trình duyệt (`crypto.getRandomValues`) cho mỗi lần lưu, đảm
  bảo không có hai file mã hóa nào giống nhau cho dù dữ liệu mật khẩu bên trong
  trùng khớp.

### 3. Tích hợp WebAssembly An toàn (Local WASM Package)

Để tuân thủ tiêu chuẩn Content Security Policy (CSP) cực kỳ khắt khe của Chrome
Extension **Manifest V3**:

- Nhân WebAssembly của thư viện mã hóa `hash-wasm` được **mã hóa base64 và nhúng
  trực tiếp** vào bên trong extension.
- Tiện ích cam kết **không tải bất kỳ tập lệnh (scripts) hoặc nhị phân
  (binaries) từ bên ngoài** qua internet trong quá trình hoạt động. Điều này
  loại bỏ hoàn toàn nguy cơ bị tấn công thay thế file trung gian
  (Man-in-the-middle).

---

## 🔄 Tương thích với Bitwarden

Gistwarden hỗ trợ nhập (import) trực tiếp file dữ liệu xuất ra từ Bitwarden
(định dạng `.json` không mã hóa):

- **Hỗ trợ đầy đủ các loại dữ liệu:** Tài khoản đăng nhập (Logins), Ghi chú bảo
  mật (Secure Notes), các trường thông tin tự định nghĩa (Custom Fields) và đặc
  biệt là mã OTP (TOTP).
- **Hỗ trợ Passkeys (FIDO2/WebAuthn):** Cho phép giả lập và lưu trữ Passkeys an
  toàn, đồng bộ mượt mà thông qua GitHub Gist.
