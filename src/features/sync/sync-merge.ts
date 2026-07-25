import type { VaultItem } from "@/features/vault/vault-schemas.ts";

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
  const localMap = new Map<string, VaultItem>();

  for (const localItem of localItems) {
    localMap.set(localItem.id, localItem);
  }

  // 1. Xử lý Remote items: So sánh với Local items hoặc kiểm tra xem có phải mới được thêm/sửa trên Remote
  for (const remoteItem of remoteItems) {
    const localItem = localMap.get(remoteItem.id);

    if (localItem) {
      // TRƯỜNG HỢP A: Tồn tại cả 2 bên (Xử lý Chỉnh sửa - Modification)
      const localRevTime = parseTimestamp(localItem.revisionDate);
      const remoteRevTime = parseTimestamp(remoteItem.revisionDate);

      if (localRevTime >= remoteRevTime) {
        itemMap.set(localItem.id, localItem);
      } else {
        itemMap.set(remoteItem.id, remoteItem);
      }
    } else {
      // TRƯỜNG HỢP B: Chỉ có ở Remote (Không có ở Local)
      // Nếu chưa từng sync (lastSyncTimestamp === 0), giữ lại item từ Remote.
      // Nếu đã từng sync, chỉ giữ nếu item được tạo hoặc sửa đổi trên Remote SAU lần sync cuối.
      // Ngược lại (tạo & sửa TRƯỚC lần sync cuối), nghĩa là item này vừa bị XÓA TRÊN LOCAL ➔ Bỏ qua (Xóa).
      const remoteCreationTime = parseTimestamp(remoteItem.creationDate);
      const remoteRevTime = parseTimestamp(remoteItem.revisionDate);

      if (
        lastSyncTimestamp === 0 ||
        remoteCreationTime > lastSyncTimestamp ||
        remoteRevTime > lastSyncTimestamp
      ) {
        itemMap.set(remoteItem.id, remoteItem);
      }
    }
  }

  // 2. Xử lý Local items chưa có trong Remote (Thêm mới ở Local hoặc bị xóa ở Remote)
  for (const localItem of localItems) {
    if (!itemMap.has(localItem.id)) {
      const remoteItem = remoteItems.find((r) => r.id === localItem.id);

      if (!remoteItem) {
        const localCreationTime = parseTimestamp(localItem.creationDate);
        const localRevTime = parseTimestamp(localItem.revisionDate);
        if (
          lastSyncTimestamp === 0 ||
          localCreationTime > lastSyncTimestamp ||
          localRevTime > lastSyncTimestamp
        ) {
          itemMap.set(localItem.id, localItem);
        }
      }
    }
  }

  return Array.from(itemMap.values());
}
