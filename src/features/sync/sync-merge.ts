import { type VaultItem } from "@/core/types.ts";

/**
 * Chuyển đổi chuỗi ISO Date thành timestamp (milisecond).
 * Nếu chuỗi không hợp lệ, trả về 0.
 */
function parseTimestamp(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const time = new Date(dateStr).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/**
 * Hợp nhất (Merge) 2 danh sách VaultItem giữa Local và Remote.
 * Hàm thuần khiết (Pure function) tuân thủ nguyên tắc Immutability.
 *
 * @param localItems Danh sách tài khoản hiện có trên Local
 * @param remoteItems Danh sách tài khoản vừa kéo về từ Remote (Gist)
 * @param lastSyncTimestamp Timestamp (ms) của lần đồng bộ thành công gần nhất
 * @returns Mảng danh sách VaultItem đã được hợp nhất
 */
export function mergeVaultItems(
  localItems: readonly VaultItem[],
  remoteItems: readonly VaultItem[],
  lastSyncTimestamp: number,
): VaultItem[] {
  const itemMap = new Map<string, VaultItem>();

  // 1. Đưa toàn bộ remote items vào Map
  for (const remoteItem of remoteItems) {
    itemMap.set(remoteItem.id, remoteItem);
  }

  // 2. Duyệt qua local items để hợp nhất
  for (const localItem of localItems) {
    const remoteItem = itemMap.get(localItem.id);

    if (remoteItem) {
      // TRƯỜNG HỢP A: Tồn tại cả 2 bên (Xử lý Chỉnh sửa - Modification)
      const localRevTime = parseTimestamp(localItem.revisionDate);
      const remoteRevTime = parseTimestamp(remoteItem.revisionDate);

      // Bản ghi nào được sửa đổi sau cùng (revisionDate lớn hơn hoặc bằng) sẽ được giữ lại
      if (localRevTime >= remoteRevTime) {
        itemMap.set(localItem.id, localItem);
      }
    } else {
      // TRƯỜNG HỢP B: Chỉ có ở Local (Có thể là THÊM MỚI hoặc BỊ XÓA TRÊN REMOTE)
      const localCreationTime = parseTimestamp(localItem.creationDate);

      // Nếu item được tạo SAU lần đồng bộ cuối (hoặc nếu chưa từng sync - lastSyncTimestamp === 0)
      // -> Đây là item mới được tạo ở Local ➔ Giữ lại.
      // Ngược lại, nếu item đã tồn tại TRƯỚC lần sync cuối nhưng giờ Remote không có
      // -> Item đã bị xóa trên Remote ➔ Bỏ qua (Xóa).
      if (lastSyncTimestamp === 0 || localCreationTime > lastSyncTimestamp) {
        itemMap.set(localItem.id, localItem);
      }
    }
  }

  return Array.from(itemMap.values());
}
