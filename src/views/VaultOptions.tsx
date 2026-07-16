import { type Component, createSignal, Show } from "solid-js";
import { store, storeActions, View } from "@/shared/store.ts";
import { VaultItemType } from "@/shared/types.ts";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  SyncIcon,
  UploadIcon,
} from "@/icons/svg/index.ts";

export const VaultOptions: Component = () => {
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  let fileInputRef: HTMLInputElement | undefined;

  const handleBack = () => {
    storeActions.navigate(View.Settings);
  };

  const handleSync = async () => {
    setLoading(true);
    setError("");
    const res = await storeActions.syncVault();
    setLoading(false);
    if (res.success) {
      storeActions.showToast("Đồng bộ dữ liệu thành công!", "success");
    } else {
      setError(res.error || "Lỗi đồng bộ");
    }
  };

  const handleImportClick = () => {
    fileInputRef?.click();
  };

  const handleFileChange = (e: Event) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    const file = target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result;
      if (typeof result !== "string") return;
      const text = result;
      try {
        const res = await storeActions.importJsonData(text);
        if (res.success) {
          storeActions.showToast(
            `Nhập thành công ${res.importedCount} tài khoản! Két sắt đã được đồng bộ lên Gist.`,
            "success",
          );
        } else {
          setError(
            res.error || "Định dạng file không hợp lệ hoặc xác thực thất bại",
          );
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg || "Lỗi nhập file JSON");
      } finally {
        setLoading(false);
        // Reset file input
        if (fileInputRef) fileInputRef.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    try {
      // Map VaultItems to ImportItems to guarantee compatibility with ImportItemSchema
      const exportItems = store.vaultItems.map((item) => {
        const base = {
          type: item.type,
          name: item.name,
          notes: item.notes || "",
          favorite: item.favorite,
          fields: item.fields.map((f) => ({
            type: f.type ?? 0,
            name: f.name || "",
            value: f.value || "",
          })),
        };

        if (item.type === VaultItemType.Login) {
          return {
            ...base,
            type: VaultItemType.Login as const,
            login: {
              username: item.login.username || "",
              password: item.login.password || "",
              totp: item.login.totp || "",
              uris: item.login.uris?.map((u) => ({ uri: u.uri })) || [],
              fido2Credentials: item.login.fido2Credentials || [],
            },
          };
        } else {
          return {
            ...base,
            type: VaultItemType.SecureNote as const,
            secureNote: null,
          };
        }
      });

      const dataStr = JSON.stringify(exportItems, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gistwarden_export_${
        new Date().toISOString().slice(0, 10)
      }.json`;
      a.click();
      URL.revokeObjectURL(url);
      storeActions.showToast("Xuất dữ liệu két sắt thành công!", "success");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Lỗi xuất file JSON");
    }
  };

  return (
    <div class="app-container">
      <div class="app-body">
        {/* Header */}
        <div
          class="detail-header"
          style="margin-top: 0; margin-bottom: 16px;"
        >
          <div class="back-btn" onClick={handleBack}>
            <ArrowLeftIcon />
          </div>
          <div class="detail-title">Tùy chọn két sắt</div>
        </div>

        <Show when={error()}>
          <div class="alert alert-danger">{error()}</div>
        </Show>

        <div class="card" style="padding: 0 16px;">
          {/* Sync */}
          <div class="setting-row" onClick={handleSync}>
            <div class="setting-row-left">
              <SyncIcon class={loading() ? "spinning" : ""} />
              <div>
                <div class="setting-label">Đồng bộ thủ công</div>
                <div class="setting-sub">
                  Lần cuối: {store.lastSync
                    ? new Date(store.lastSync).toLocaleTimeString()
                    : "Chưa đồng bộ"}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Import JSON */}
          <div class="setting-row" onClick={handleImportClick}>
            <div class="setting-row-left">
              <UploadIcon />
              <div>
                <div class="setting-label">Nhập tài khoản (Import JSON)</div>
                <div class="setting-sub">
                  Hỗ trợ file accounts.json hoặc xuất từ Bitwarden
                </div>
              </div>
            </div>
            <ChevronRightIcon />
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              style="display: none;"
              onChange={handleFileChange}
            />
          </div>

          {/* Export JSON */}
          <div class="setting-row" onClick={handleExport}>
            <div class="setting-row-left">
              <DownloadIcon />
              <div>
                <div class="setting-label">Xuất tài khoản (Export JSON)</div>
                <div class="setting-sub">
                  Lưu trữ danh sách tài khoản hiện tại ra file JSON
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultOptions;
