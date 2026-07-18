# Báo cáo Đánh giá Mã nguồn (Code Review Report) - Dự án Gistwarden

Báo cáo này tập trung phân tích cấu trúc mã nguồn của dự án Gistwarden, đặc biệt
chú trọng tìm kiếm các vấn đề liên quan tới **Mã nguồn trùng lặp (Duplicate
Code)** và **Mô-đun ôm đồm quá nhiều trách nhiệm (God Modules)**.

---

## 1. Các Mô-đun Quá tải (God Modules)

Đây là các mô-đun hoặc file có dung lượng dòng code lớn, đảm nhận quá nhiều vai
trò và vi phạm nguyên lý **Đơn nhiệm (Single Responsibility Principle - SRP)**.

### 1.1. [store.ts](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/store.ts) (~1162 dòng)

- **Vấn đề**: File này đóng vai trò là Global Store của ứng dụng (sử dụng
  Solid-JS Store), nhưng ngoài việc lưu trữ trạng thái (State), nó đang đảm nhận
  **toàn bộ logic nghiệp vụ (business logic)** cốt lõi của ứng dụng.
- **Các trách nhiệm hiện tại của Store**:
  1. **Quản lý UI State & Routing**: Điều hướng View
     ([navigate](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/store.ts#L949),
     [selectItem](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/store.ts#L973)),
     quản lý Modal, Toast, hiệu ứng chuyển trang.
  2. **Quản lý Xác thực & Mã hóa**: Unlock két sắt
     ([unlock](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/store.ts#L319)),
     khoá két sắt
     ([lock](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/store.ts#L495)),
     đổi Master Password
     ([changeMasterPassword](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/store.ts#L738)),
     cấu hình mã PIN
     ([setPinUnlock](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/store.ts#L1083)).
  3. **Đồng bộ hóa & Import/Export**: Đồng bộ dữ liệu với Gist
     ([syncVault](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/store.ts#L826)),
     import dữ liệu JSON/CSV
     ([importJsonData](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/store.ts#L862),
     [importCsvData](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/store.ts#L905)).
  4. **Quản lý Dữ liệu Két sắt (CRUD)**: Lưu/Sửa/Xóa tài khoản
     ([saveItem](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/store.ts#L541),
     [deleteItem](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/store.ts#L714)).
- **Hậu quả**: Khi có lỗi xảy ra hoặc khi cần mở rộng tính năng (ví dụ: đổi cách
  mã hóa hoặc đổi dịch vụ lưu trữ thay vì Gist), nhà phát triển sẽ phải sửa đổi
  file Store này, dễ gây ảnh hưởng chéo và khó viết Unit Test.
- **Đề xuất Refactoring**:
  - Tách logic mã hóa/đồng bộ/xác thực ra các file chuyên biệt (ví dụ:
    `auth-service.ts`, `sync-service.ts`).
  - Store chỉ nên gọi các service này và lưu kết quả trả về vào State, thay vì
    trực tiếp thực hiện logic mã hóa, tương tác với API hay gọi
    `chrome.runtime.sendMessage`.

### 1.2. [ItemEdit.tsx](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/views/ItemEdit.tsx) (~938 dòng)

- **Vấn đề**: Đây là màn hình chỉnh sửa/thêm mới tài khoản. Nó đang quản lý một
  `formState` chứa tất cả các thuộc tính của **tất cả các loại két sắt** (Login,
  Card, SecureNote, Identity, SshKey).
- **Các trách nhiệm hiện tại**:
  1. Quản lý form state khổng lồ cho cả 5 loại item
     ([formState](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/views/ItemEdit.tsx#L32)).
  2. Khởi tạo/Reset form state trong
     [onMount](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/views/ItemEdit.tsx#L129-L276)
     bằng cách gán thủ công từng thuộc tính riêng lẻ (gần 150 dòng cho mỗi nhánh
     `if-else`).
  3. Xử lý quét mã QR để lấy TOTP.
  4. Thực hiện logic mapping dữ liệu trước khi lưu
     ([handleSave](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/views/ItemEdit.tsx#L380)).
- **Đề xuất Refactoring**:
  - Tạo một hàm helper hoặc class Factory để xử lý việc khởi tạo form state dựa
    trên kiểu dữ liệu (ví dụ: `createDefaultState(type)` và
    `mapItemToState(item)`).
  - Tách logic quét mã QR thành một hook/helper độc lập.

---

## 2. Mã nguồn trùng lặp (Duplicate Code)

### 2.1. Trùng lặp logic tạo và ánh xạ đối tượng VaultItem

- **Vị trí 1**: Trong
  [ItemEdit.tsx](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/views/ItemEdit.tsx#L399-L543)
  (hàm `handleSave`), khi lưu tài khoản, mã nguồn lặp lại việc tạo ra một
  `baseItem` chứa các thuộc tính chung (`id`, `name`, `notes`, `favorite`,
  `reprompt`, `fields`) 5 lần cho 5 loại item khác nhau.
- **Vị trí 2**: Trong
  [import-export.ts](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/import-export.ts#L70-L217)
  (hàm `parseAndValidateImportJson`), logic map dữ liệu nhập từ JSON cũng lặp
  lại việc tạo ra các thuộc tính chung (`id`, `name`, `notes`, `favorite`,
  `reprompt`, `fields`, `creationDate`, `revisionDate`) cho cả 5 loại item.
- **Hậu quả**: Khi có sự thay đổi về cấu trúc chung của một `VaultItem` (ví dụ
  thêm thuộc tính `tags` hoặc sửa đổi cấu trúc `fields`), lập trình viên sẽ phải
  tìm và sửa đổi ở rất nhiều nơi.
- **Đề xuất Refactoring**:
  - Trích xuất logic ánh xạ thuộc tính chung của `VaultItem` thành một đối tượng
    cơ sở (Base Object), sau đó sử dụng toán tử spread (`...`) để kết hợp với
    các thuộc tính riêng biệt của từng loại:
  ```typescript
  const baseItem = {
    id: item.id || crypto.randomUUID(),
    name: item.name.trim(),
    notes: item.notes?.trim() || "",
    favorite: !!item.favorite,
    reprompt: item.reprompt || 0,
    fields: mapCustomFields(item.fields),
    creationDate: item.creationDate || now,
    revisionDate: now,
  };
  ```

### 2.2. Trùng lặp logic thêm mới tài khoản (Add New Item)

- **Vị trí**: Trong
  [Vault.tsx](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/views/Vault.tsx#L260-L379),
  có 5 hàm xử lý thêm mới tài khoản: `handleAddNewLogin`, `handleAddNewNote`,
  `handleAddNewCard`, `handleAddNewIdentity`, và `handleAddNewSshKey`.
- **Vấn đề**: Cả 5 hàm này đều có cấu trúc giống nhau: khởi tạo một đối tượng
  mẫu có cấu trúc rỗng, chọn nó thông qua `storeActions.selectItem()` và điều
  hướng sang màn hình chỉnh sửa.
- **Đề xuất Refactoring**: Gom các hàm này thành một hàm duy nhất nhận tham số
  là kiểu item:
  ```typescript
  const handleAddNewItem = (type: VaultItemType) => {
    const defaultItem = createDefaultVaultItem(type);
    storeActions.selectItem(defaultItem);
    storeActions.navigate(View.ItemEdit);
    setShowAddMenu(false);
  };
  ```

### 2.3. Danh sách tham số quá dài (Long Parameter List) trong Component Edit

- **Vị trí**: File
  [IdentityEditFields.tsx](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/components/item-edit/IdentityEditFields.tsx#L7-L44)
  định nghĩa props chứa tới 36 tham số (bao gồm 18 thuộc tính của `Identity` và
  18 hàm setter tương ứng).
- **Vấn đề**:
  - Điều này tạo ra code rất dài và rối rắm khi sử dụng component trong
    [ItemEdit.tsx](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/views/ItemEdit.tsx#L693-L732)
    (mất tới 40 dòng chỉ để truyền props).
  - Vi phạm code smell **Data Clump**.
- **Đề xuất Refactoring**:
  - Thay vì truyền từng thuộc tính lẻ tẻ, hãy truyền một đối tượng `identity`
    duy nhất và một hàm callback `onUpdate(key, value)` hoặc
    `onChange(identity)`:
  ```typescript
  interface IdentityEditFieldsProps {
    identity: IdentityDetails;
    onUpdateField: (key: keyof IdentityDetails, value: string) => void;
  }
  ```

---

## 3. Một số điểm nhỏ khác cần cải thiện (Code Smells / Best Practices)

1. **Gán cứng kiểu dữ liệu (Magic Numbers / Types)**:
   - Tại nhiều nơi như
     [store.ts:L634](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/store.ts#L634),
     code sử dụng `Number(item.type)` để ép kiểu hoặc so sánh trực tiếp với
     `VaultItemType` nhưng vẫn có chỗ so sánh kiểu chuỗi như `"note"` và
     `"securenote"` trong
     [import-export.ts:L426](file:///c:/Users/uongsuadaubung/Desktop/gistwarden/src/shared/import-export.ts#L426).
     Nên chuẩn hóa sử dụng enum `VaultItemType` nhất quán trong toàn bộ
     codebase.
2. **Xử lý bất đồng bộ trong Store Actions**:
   - Việc gọi `chrome.runtime.sendMessage` lồng trong các Promise thủ công có
     thể được bọc lại trong một API wrapper sạch sẽ hơn, giúp Store bớt bị phụ
     thuộc vào môi trường Extension runtime trực tiếp.
3. **DRY (Don't Repeat Yourself) trong CSS/SCSS**:
   - Các style file của các component nằm trong `src/styles/components/` có một
     số thuộc tính layout lặp lại nhiều lần. Có thể tận dụng các class utility
     hoặc biến SCSS để tối ưu hơn.

---

## Kết luận & Thứ tự Ưu tiên Refactor

1. **Ưu tiên 1 (Dễ nhất & Hiệu quả ngay)**: Gom logic map thuộc tính chung của
   `VaultItem` trong `ItemEdit.tsx` và `import-export.ts` để loại bỏ duplicate
   code. Gom các hàm `handleAddNew...` trong `Vault.tsx`.
2. **Ưu tiên 2**: Đóng gói lại Props cho `IdentityEditFields.tsx` và các
   component edit khác bằng cách truyền Object thay vì danh sách tham số dài.
3. **Ưu tiên 3 (Quan trọng nhất nhưng tốn sức)**: Tách logic nghiệp vụ mã hóa,
   đồng bộ gist, và xác thực ra khỏi `store.ts` thành các file Service độc lập
   để giảm kích thước và nâng cao tính bảo trì của Store.
