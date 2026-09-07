# 🚀 GistWarden Cloudflare API Worker (Hono + Cloudflare D1)

Hệ thống API Backend hợp nhất dành cho **GistWarden**, được xây dựng trên nền tảng **Cloudflare Workers** sử dụng **Hono Framework** và cơ sở dữ liệu quan hệ phân tán **Cloudflare D1 (Serverless SQLite)**.

---

## 🌟 Tính Năng Nổi Bật

1. **Chuẩn Hono Framework Hiện Đại**:
   - Tốc độ phản hồi cực nhanh, cold-start xấp xỉ 0ms, kích thước bundle < 15KB.
   - Định tuyến API phân tầng rõ ràng (`/auth`, `/vault`, `/oauth`, `/time`).
   - Tích hợp Middleware CORS tự động cho phép mọi Origin của Extension và Web App.

2. **Cơ Chế Xác Thực Đăng Ký / Đăng Nhập Tin Cậy**:
   - **Mã hóa mật khẩu**: Sử dụng chuẩn **PBKDF2-SHA256** với 50.000 vòng lặp + salt ngẫu nhiên 16 bytes (Web Crypto API gốc), an toàn tuyệt đối trước các cuộc tấn công Rainbow Table hay Brute-force.
   - **Xác định trạng thái đăng nhập**: Cấp **Stateless JWT** (ký HMAC-SHA256). Khi client gửi token qua header `Authorization: Bearer <token>`, server xác thực tính hợp lệ ngay lập tức và endpoint `GET /user` kiểm tra trực tiếp trạng thái tài khoản trong Database D1.
   - **Mã hóa két mật khẩu (E2EE)**: Server chỉ lưu dữ liệu mã hóa (`salt`, `iv`, `ciphertext`). Server không bao giờ biết Master Password của người dùng.

3. **Triển Khai 1-Click Bằng Terminal CLI (Wrangler)**:
   - Chấm dứt hoàn toàn việc phải mở dashboard Cloudflare để copy-paste code thủ công!
   - Chỉ cần chạy `bun run worker:deploy`, Wrangler CLI sẽ tự động compile TypeScript và đẩy thẳng lên Cloudflare Edge.

---

## 🌐 Máy Chủ Chính Thức Sẵn Dùng (Official Live Deployment)

Nếu bạn không muốn tự dựng máy chủ VPS hay tạo tài khoản Cloudflare riêng, hệ sinh thái GistWarden đã cung cấp sẵn một máy chủ Edge phân tán toàn cầu hoàn toàn miễn phí:
- **Live Endpoint**: `https://gistwarden.uongsuadaubung.workers.dev`
- **Cơ sở dữ liệu**: Cloudflare D1 Serverless SQLite (APAC region).
- **Bảo mật E2EE**: Két mật khẩu luôn được nén Zlib và mã hóa cục bộ bằng AES-256-GCM tại Client trước khi gửi lên máy chủ. Bạn chỉ cần chọn provider **Self-Hosted Server** trên GistWarden và nhập URL trên là có thể dùng ngay lập tức!

---

## 🛠️ Hướng Dẫn Thiết Lập & Triển Khai Từ Terminal

### Bước 1: Đăng nhập tài khoản Cloudflare (Chỉ làm 1 lần duy nhất)

Mở terminal tại thư mục gốc của dự án và chạy:
```bash
bunx wrangler login
```
Trình duyệt sẽ tự động mở trang Cloudflare để bạn xác nhận cấp quyền (Authorize). Sau khi thành công, terminal sẽ báo `Successfully logged in`.

---

### Bước 2: Tạo Cơ Sở Dữ Liệu Cloudflare D1

Chạy lệnh sau để tạo một database D1 mới mang tên `gistwarden-db`:
```bash
bunx wrangler d1 create gistwarden-db
```

Terminal sẽ in ra thông tin tương tự như sau:
```text
✅ Successfully created DB 'gistwarden-db'!

[[d1_databases]]
binding = "DB"
database_name = "gistwarden-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Quan trọng**: Sao chép chuỗi `database_id` vừa nhận được và dán vào file [apps/worker/wrangler.json](file:///c:/Users/kien.hm/Desktop/totp%20generate/apps/worker/wrangler.json) tại vị trí:
```json
"database_id": "dán_database_id_của_bạn_vào_đây"
```

---

### Bước 3: Khởi Tạo Bảng Dữ Liệu Trên Cloudflare D1 (Migration)

Để tạo sẵn các bảng `users` và `vaults` trên database vừa tạo, chạy lệnh:
```bash
bun run worker:d1:init:remote
```

*(Nếu bạn muốn thử nghiệm local offline trước, hãy chạy `bun run worker:d1:init:local`)*.

---

### Bước 4: Đẩy Code Lên Cloudflare Worker (Deploy)

Chỉ cần chạy đúng 1 câu lệnh duy nhất:
```bash
bun run worker:deploy
```

Wrangler sẽ tự động:
- Đóng gói toàn bộ code TypeScript trong `apps/worker/src`.
- Tối ưu hóa bundle và upload lên mạng lưới Cloudflare.
- In ra đường dẫn Worker của bạn, ví dụ:
  `https://gistwarden-api.<your-subdomain>.workers.dev`

---

### (Tùy chọn) Cấu hình GitHub OAuth Secrets

Nếu bạn sử dụng tính năng đăng nhập GitHub OAuth Proxy, hãy thiết lập 2 biến bảo mật sau trực tiếp từ terminal:
```bash
bunx wrangler secret put GITHUB_CLIENT_ID --config apps/worker/wrangler.json
bunx wrangler secret put GITHUB_CLIENT_SECRET --config apps/worker/wrangler.json
```

---

## 💻 Chạy & Debug Cục Bộ (Local Development)

Bạn có thể chạy thử Worker ngay trên máy tính mà không cần kết nối mạng hay động vào database thật:
```bash
bun run worker:dev
```
Worker sẽ chạy tại `http://localhost:8787` với database D1 SQLite giả lập cục bộ.

---

## 📡 Danh Sách Chi Tiết Các REST Endpoints

> 💡 **Hỗ trợ tiền tố `/api` (Dual Routing)**: Hệ thống hỗ trợ song hành cả chuẩn mới có tiền tố `/api/*` (khuyên dùng cho RESTful) lẫn chuẩn gốc `/*` (tương thích ngược 100%). Bạn có thể cấu hình Server URL trên GistWarden là `https://<domain>/api` hoặc `https://<domain>` đều hoạt động chính xác.

### 1. Nhóm Xác Thực (Auth)
| Phương thức | Đường dẫn chuẩn | Đường dẫn tương thích | Mô tả | Yêu cầu Header |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | `/auth/register` | Đăng ký tài khoản mới trên D1 | `Content-Type: application/json` |
| `POST` | `/api/auth/login` | `/auth/login` | Đăng nhập tài khoản & nhận JWT token | `Content-Type: application/json` |
| `GET` | `/api/user` | `/user` hoặc `/auth/user` | Kiểm tra token & lấy thông tin user | `Authorization: Bearer <token>` |

#### Body mẫu cho `POST /api/auth/register` & `/api/auth/login`:
```json
{
  "username": "myuser",
  "password": "mypassword123"
}
```

#### Response thành công (`200 OK`):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "myuser"
}
```

---

### 2. Nhóm Lưu Trữ Két Mật Khẩu (Vault)
| Phương thức | Đường dẫn chuẩn | Đường dẫn tương thích | Mô tả | Yêu cầu Header |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/vault` | `/vault` | Tải dữ liệu vault mã hóa | `Authorization: Bearer <token>` |
| `POST` | `/api/vault` | `/vault` | Lưu / cập nhật dữ liệu vault | `Authorization: Bearer <token>` |
| `DELETE` | `/api/vault` | `/vault` | Xóa dữ liệu vault | `Authorization: Bearer <token>` |

#### Body mẫu cho `POST /api/vault` (hoặc `/vault`):
```json
{
  "salt": "base64_pbkdf2_salt_...",
  "iv": "base64_aes_iv_...",
  "ciphertext": "base64_encrypted_vault_content_..."
}
```

---

### 3. Nhóm Tiện Ích & OAuth
| Phương thức | Đường dẫn chuẩn | Đường dẫn tương thích | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/time` | `/time` | Trả về Unix timestamp chuẩn UTC phục vụ căn chỉnh đồng hồ TOTP |
| `GET` | `/api/oauth/callback` | `/oauth/callback` hoặc `/callback` | Nhận OAuth code từ GitHub và chuyển hướng kèm token về Extension |

---

### 4. Bảng Mã Lỗi Chuẩn Hóa (Standardized Error Codes)

Tất cả các endpoint xác thực trả về mã lỗi JSON có định dạng `{ "error": "error_code", "message": "Chi tiết lỗi" }` để Frontend Client tự động ánh xạ hiển thị theo ngôn ngữ i18n của người dùng:

| Mã lỗi (`error`) | HTTP Status | Nguyên nhân | Thông báo i18n hiển thị trên GistWarden UI |
| :--- | :--- | :--- | :--- |
| `missing_fields` | `400 Bad Request` | Thiếu trường username hoặc password | *"Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu máy chủ."* |
| `username_too_short` | `400 Bad Request` | Tên đăng nhập ít hơn 2 ký tự | *"Tên đăng nhập máy chủ phải có ít nhất 2 ký tự."* |
| `username_too_long` | `400 Bad Request` | Tên đăng nhập vượt quá 64 ký tự | *"Tên đăng nhập máy chủ không được vượt quá 64 ký tự."* |
| `password_too_short` | `400 Bad Request` | Mật khẩu máy chủ ít hơn 6 ký tự | *"Mật khẩu máy chủ phải có ít nhất 6 ký tự."* |
| `user_already_exists` | `409 Conflict` | Tên đăng nhập đã tồn tại trong D1 | *"Tên đăng nhập máy chủ đã tồn tại. Vui lòng chọn tên khác."* |
| `invalid_credentials` | `401 Unauthorized` | Sai tên đăng nhập hoặc mật khẩu | *"Tên đăng nhập hoặc mật khẩu máy chủ không chính xác."* |
| `vault_not_found` | `404 Not Found` | Chưa khởi tạo két mật khẩu trên máy chủ | Tự động chuyển người dùng sang bước tạo Master Password mới |
| `unauthorized` | `401 Unauthorized` | Token JWT hết hạn hoặc không hợp lệ | Thông báo phiên đăng nhập hết hạn và yêu cầu đăng nhập lại |

---

## 🔗 Kết Nối Với GistWarden Extension / Web App

1. Mở GistWarden $\rightarrow$ Vào **Settings** (Cài đặt) $\rightarrow$ Mục **Sync & Backup** (Đồng bộ).
2. Chọn **Provider**: `Self-Hosted Server`.
3. Điền **Server URL**: URL Worker của bạn (ví dụ `https://gistwarden-api.<your-subdomain>.workers.dev` hoặc `http://localhost:8787` khi test dev).
4. Nhập Username & Server Password $\rightarrow$ Nhấn **Register** hoặc **Login**.
5. Két mật khẩu sẽ được tự động đồng bộ lên Cloudflare D1 an toàn và tức thì!
