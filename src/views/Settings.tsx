import { type Component, createSignal, onMount, Show } from "solid-js";
import { store, storeActions, View } from "@/shared/store.ts";
import { z } from "zod";
import Button from "@/components/Button.tsx";
import Input from "@/components/Input.tsx";
import {
  ArrowLeftIcon,
  KeyIcon,
  LockIcon,
  LogoutIcon,
  ThemeIcon,
  TrashIcon,
  ShieldIcon,
  ChevronRightIcon,
} from "@/icons/svg/index.ts";

const ThemeStorageSchema = z.object({
  gistwarden_theme: z.string().optional(),
});

export const Settings: Component = () => {
  const [theme, setTheme] = createSignal("dark");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  // Change password states
  const [isChangingPassword, setIsChangingPassword] = createSignal(false);
  const [currentPassword, setCurrentPassword] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");

  onMount(async () => {
    // Load theme from storage
    if (typeof chrome !== "undefined" && chrome.storage) {
      const res = await chrome.storage.local.get("gistwarden_theme");
      const parsed = ThemeStorageSchema.safeParse(res);
      const currentTheme = parsed.success
        ? (parsed.data.gistwarden_theme || "dark")
        : "dark";
      setTheme(currentTheme);
      applyTheme(currentTheme);
    }
  });

  const applyTheme = (t: string) => {
    if (t === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
  };

  const handleToggleTheme = async () => {
    const nextTheme = theme() === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    if (typeof chrome !== "undefined" && chrome.storage) {
      await chrome.storage.local.set({ gistwarden_theme: nextTheme });
    }
  };

  const handleLock = () => {
    storeActions.lock();
  };

  const handleLogout = async () => {
    if (
      await storeActions.confirm(
        "Đăng xuất",
        "Bạn có chắc chắn muốn ngắt kết nối tài khoản GitHub? Thao tác này sẽ xóa toàn bộ cấu hình cục bộ.",
        "warning",
      )
    ) {
      storeActions.logout();
    }
  };

  const handleClearVault = async () => {
    if (
      !(await storeActions.confirm(
        "Xóa toàn bộ tài khoản",
        "Bạn có chắc chắn muốn xóa TOÀN BỘ tài khoản trong két sắt? Hành động này không thể hoàn tác và toàn bộ dữ liệu trên Gist sẽ bị xóa sạch.",
        "danger",
      ))
    ) {
      return;
    }
    if (
      !(await storeActions.confirm(
        "Xác nhận xóa vĩnh viễn",
        "XÁC NHẬN LẦN CUỐI: Xóa vĩnh viễn toàn bộ dữ liệu tài khoản?",
        "danger",
      ))
    ) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await storeActions.clearVault();
      if (res.success) {
        storeActions.showToast(
          "Đã xóa toàn bộ tài khoản trong két sắt thành công!",
          "success",
        );
      } else {
        setError(res.error || "Lỗi xóa két sắt");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Lỗi xóa két sắt");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: Event) => {
    e.preventDefault();
    if (!currentPassword() || !newPassword() || !confirmPassword()) {
      setError("Vui lòng điền đầy đủ tất cả các trường");
      return;
    }
    if (newPassword() !== confirmPassword()) {
      setError("Xác nhận mật khẩu mới không khớp");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await storeActions.changeMasterPassword(
        currentPassword(),
        newPassword(),
      );
      if (res.success) {
        storeActions.showToast(
          "Đã đổi Mật khẩu Master và đồng bộ thành công!",
          "success",
        );
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsChangingPassword(false);
      } else {
        setError(res.error || "Lỗi đổi mật khẩu");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Lỗi đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGist = () => {
    if (store.gistId) {
      window.open(`https://gist.github.com/${store.gistId}`, "_blank");
    }
  };

  return (
    <div class="app-container">
      <div class="app-body">
        <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 15px; font-weight: 600;">
          Cài đặt
        </h3>

        <Show when={error()}>
          <div class="alert alert-danger">{error()}</div>
        </Show>

        <Show
          when={isChangingPassword()}
          fallback={
            <>
              {/* User profile */}
              <Show when={store.cachedGithubUser}>
                <div class="user-panel">
                  <img
                    class="avatar"
                    src={store.cachedGithubUser?.avatar_url}
                    alt="avatar"
                  />
                  <div class="user-info">
                    <div
                      class="username"
                      style="cursor: pointer; color: var(--primary); text-decoration: underline;"
                      onClick={handleOpenGist}
                      title="Mở Gist lưu trữ trên GitHub"
                    >
                      @{store.cachedGithubUser?.login}
                    </div>
                  </div>
                </div>
              </Show>

              {/* Settings options list */}
              <div class="card" style="padding: 0 16px;">
                {/* Toggle Theme */}
                <div class="setting-row" onClick={handleToggleTheme}>
                  <div class="setting-row-left">
                    <ThemeIcon />
                    <div>
                      <div class="setting-label">Giao diện</div>
                      <div class="setting-sub">
                        Hiện tại: {theme() === "dark" ? "Tối" : "Sáng"}
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon />
                </div>

                {/* Vault Options */}
                <div
                  class="setting-row"
                  onClick={() => storeActions.navigate(View.VaultOptions)}
                >
                  <div class="setting-row-left">
                    <ShieldIcon />
                    <div>
                      <div class="setting-label">Tùy chọn két sắt</div>
                      <div class="setting-sub">
                        Đồng bộ, nhập và xuất dữ liệu
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon />
                </div>

                {/* Change Master Password */}
                <div
                  class="setting-row"
                  onClick={() => {
                    setIsChangingPassword(true);
                    setError("");
                  }}
                >
                  <div class="setting-row-left">
                    <KeyIcon />
                    <div>
                      <div class="setting-label">Đổi mật khẩu Master</div>
                      <div class="setting-sub">
                        Mã hóa lại két sắt bằng mật khẩu mới
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon />
                </div>

                {/* Lock Vault */}
                <div class="setting-row" onClick={handleLock}>
                  <div class="setting-row-left">
                    <LockIcon />
                    <div>
                      <div class="setting-label">Khóa két sắt</div>
                      <div class="setting-sub">Mở lại bằng Mật khẩu Master</div>
                    </div>
                  </div>
                  <ChevronRightIcon />
                </div>

                {/* Clear Vault */}
                <div class="setting-row" onClick={handleClearVault}>
                  <div class="setting-row-left">
                    <TrashIcon style="color: var(--error);" />
                    <div>
                      <div class="setting-label" style="color: var(--error);">
                        Xóa toàn bộ tài khoản
                      </div>
                      <div class="setting-sub">
                        Xóa vĩnh viễn mọi dữ liệu trong két sắt
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon style="color: var(--error);" />
                </div>

                {/* Disconnect/Logout */}
                <div class="setting-row" onClick={handleLogout}>
                  <div class="setting-row-left">
                    <LogoutIcon style="color: var(--error);" />
                    <div>
                      <div class="setting-label" style="color: var(--error);">
                        Đăng xuất
                      </div>
                      <div class="setting-sub">
                        Ngắt kết nối và xóa cấu hình Gist
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon style="color: var(--error);" />
                </div>
              </div>
            </>
          }
        >
          {/* Change Password Form View */}
          <div
            class="detail-header"
            style="margin-top: 6px; margin-bottom: 16px;"
          >
            <div
              class="back-btn"
              onClick={() => {
                setIsChangingPassword(false);
                setError("");
              }}
            >
              <ArrowLeftIcon />
            </div>
            <div class="detail-title">Đổi mật khẩu Master</div>
          </div>

          <form
            onSubmit={handleChangePassword}
            class="card"
            style="padding: 16px; margin-bottom: 0;"
          >
            <div class="form-group">
              <label for="current-pass">Mật khẩu hiện tại</label>
              <Input
                id="current-pass"
                type="password"
                value={currentPassword()}
                onInput={(e) => setCurrentPassword(e.currentTarget.value)}
                placeholder="Mật khẩu hiện tại..."
                disabled={loading()}
                required
              />
            </div>

            <div class="form-group">
              <label for="new-pass">Mật khẩu mới</label>
              <Input
                id="new-pass"
                type="password"
                value={newPassword()}
                onInput={(e) => setNewPassword(e.currentTarget.value)}
                placeholder="Mật khẩu mới..."
                disabled={loading()}
                required
              />
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
              <label for="confirm-pass">Xác nhận mật khẩu mới</label>
              <Input
                id="confirm-pass"
                type="password"
                value={confirmPassword()}
                onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                placeholder="Xác nhận mật khẩu..."
                disabled={loading()}
                required
              />
            </div>

            <div style="display: flex; gap: 8px;">
              <Button
                type="button"
                variant="secondary"
                block
                onClick={() => {
                  setIsChangingPassword(false);
                  setError("");
                }}
                disabled={loading()}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                block
                loading={loading()}
                loadingText="Đang xử lý..."
              >
                Cập nhật
              </Button>
            </div>
          </form>
        </Show>
      </div>
    </div>
  );
};
export default Settings;
