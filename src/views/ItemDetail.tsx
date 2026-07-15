import { createSignal, onMount, onCleanup, type Component, Show, For } from "solid-js";
import { store, storeActions, View } from "@/shared/store.ts";
import { type Fido2Credential, type VaultField, VaultItemType } from "@/shared/types.ts";
import Button from "./Button.tsx";
import * as OTPAuth from "otpauth";
import { parseTotpSecret } from "@/shared/totp-utils.ts";
import { ArrowLeftIcon, CopyIcon, EyeIcon, EyeOffIcon, ExternalLinkIcon, TrashIcon, HeartFilledIcon, HeartOutlineIcon } from "@/icons/svg/index.ts";

export const ItemDetail: Component = () => {
  // Local view states
  const [name, setName] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [uri, setUri] = createSignal("");
  const [totpSecret, setTotpSecret] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [favorite, setFavorite] = createSignal(false);
  const [fidoCredentials, setFidoCredentials] = createSignal<Fido2Credential[]>([]);
  const [fields, setFields] = createSignal<VaultField[]>([]);
  const [visibleFields, setVisibleFields] = createSignal<Record<number, boolean>>({});

  // UI state
  const [showPassword, setShowPassword] = createSignal(false);
  const [totpCode, setTotpCode] = createSignal("");
  const [totpRemaining, setTotpRemaining] = createSignal(30);
  const [error, setError] = createSignal("");

  let timerId: ReturnType<typeof setInterval> | undefined;

  // Circle dimensions for countdown
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = () => {
    return circumference - (totpRemaining() / 30) * circumference;
  };

  // Populate form states on mount
  onMount(() => {
    const item = store.selectedItem;
    if (item) {
      setName(item.name || "");
      if (item.type === VaultItemType.Login) {
        setUsername(item.login?.username || "");
        setPassword(item.login?.password || "");
        setUri(item.login?.uris?.[0]?.uri || "");
        setTotpSecret(item.login?.totp || "");
        setFidoCredentials(item.login?.fido2Credentials || []);
      } else {
        setUsername("");
        setPassword("");
        setUri("");
        setTotpSecret("");
        setFidoCredentials([]);
      }
      setNotes(item.notes || "");
      setFavorite(item.favorite || false);
      setFields(item.fields || []);
    }

    updateTotp();
    timerId = setInterval(updateTotp, 1000);
  });

  onCleanup(() => {
    if (timerId) clearInterval(timerId);
  });

  const updateTotp = () => {
    const rawSecret = totpSecret();
    const epoch = Math.floor(Date.now() / 1000);
    const remaining = 30 - (epoch % 30);
    setTotpRemaining(remaining);

    if (!rawSecret.trim()) {
      setTotpCode("");
      return;
    }

    const secret = parseTotpSecret(rawSecret);

    try {
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secret)
      });
      const rawCode = totp.generate();
      // Format code as "123 456"
      const formatted = rawCode.slice(0, 3) + " " + rawCode.slice(3);
      setTotpCode(formatted);
    } catch (err) {
      console.error("[Gistwarden] TOTP Generation error:", err);
      setTotpCode("MÃ LỖI");
    }
  };

  const toggleFieldVisibility = (index: number) => {
    setVisibleFields(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopy = async (text: string, type: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    storeActions.showToast(`Đã sao chép ${type}!`, "success");
  };

  const handleDelete = async () => {
    if (!store.selectedItem?.id) return;
    if (!confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) return;

    setError("");
    const res = await storeActions.deleteItem(store.selectedItem.id);
    if (res.success) {
      storeActions.navigate(View.Vault);
    } else {
      setError(res.error || "Lỗi xóa tài khoản");
    }
  };

  const handleBackToVault = () => {
    storeActions.navigate(View.Vault);
  };

  const handleGoToEdit = () => {
    storeActions.navigate(View.ItemEdit);
  };

  const handleToggleFavorite = async () => {
    const item = store.selectedItem;
    if (!item) return;
    const nextFavorite = !favorite();
    setFavorite(nextFavorite);

    const itemData = {
      ...item,
      favorite: nextFavorite,
    };

    const res = await storeActions.saveItem(itemData);
    if (!res.success) {
      setFavorite(!nextFavorite);
      storeActions.showToast(res.error || "Lỗi cập nhật trạng thái yêu thích", "error");
    } else {
      storeActions.showToast(nextFavorite ? "Đã thêm vào mục Yêu thích!" : "Đã bỏ Yêu thích!", "success");
    }
  };

  return (
    <div class="app-container h-full">
      {/* Header */}
      <div class="detail-item-header" style="justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="back-btn detail-back-btn" onClick={handleBackToVault}>
            <ArrowLeftIcon class="icon-inline-large" />
          </div>
          <div class="detail-title detail-header-title">
            {store.selectedItem?.type === VaultItemType.SecureNote ? "Chi tiết ghi chú" : "Chi tiết tài khoản"}
          </div>
        </div>
        <button
          type="button"
          class="action-btn"
          style="color: var(--white); cursor: pointer; display: flex; align-items: center; padding: 4px;"
          onClick={handleToggleFavorite}
          title={favorite() ? "Bỏ yêu thích" : "Yêu thích"}
        >
          <Show when={favorite()} fallback={<HeartOutlineIcon style="width: 20px; height: 20px; color: rgba(255, 255, 255, 0.7);" />}>
            <HeartFilledIcon style="width: 20px; height: 20px; color: #ff4e63;" />
          </Show>
        </button>
      </div>

      <div class="detail-form">
        {/* Scrollable Body */}
        <div class="app-body pb-24">
          <Show when={error()}>
            <div class="alert alert-danger">{error()}</div>
          </Show>

          <div class="detail-view-header">
            <div class="detail-view-name">{name() || "Không có tên"}</div>
          </div>

          {/* Card 1, 2, 3: Login Credentials */}
          <Show when={store.selectedItem?.type !== VaultItemType.SecureNote}>
            {/* Card 1: Login Credentials */}
            <div class="detail-section-title" style="margin-top: 0;">Thông tin đăng nhập</div>
            <div class="card mb-16">
              {/* Username Field */}
              <div class="detail-row">
                <div class="field-content">
                  <div class="field-label">Tên đăng nhập</div>
                  <div class="field-value">{username() || "Không có"}</div>
                </div>
                <Show when={username()}>
                  <button type="button" class="action-btn" onClick={() => handleCopy(username(), "tên đăng nhập")} title="Sao chép tên đăng nhập">
                    <CopyIcon />
                  </button>
                </Show>
              </div>

              {/* Password Field */}
              <div class="detail-row">
                <div class="field-content">
                  <div class="field-label">Mật khẩu</div>
                  <div class="field-value password-font">
                    {showPassword() ? password() : "••••••••••••"}
                  </div>
                </div>
                <div class="field-actions">
                  <button type="button" class="action-btn" onClick={() => setShowPassword(!showPassword())} title={showPassword() ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}>
                    <Show when={showPassword()} fallback={
                      <EyeIcon class="icon-inline" />
                    }>
                      <EyeOffIcon class="icon-inline" />
                    </Show>
                  </button>
                  <Show when={password()}>
                    <button type="button" class="action-btn" onClick={() => handleCopy(password(), "mật khẩu")} title="Sao chép mật khẩu">
                      <CopyIcon />
                    </button>
                  </Show>
                </div>
              </div>
            </div>

            {/* Card 2: Security & OTP */}
            <Show when={totpCode() || fidoCredentials().length > 0}>
              <div class="detail-section-title">Bảo mật & OTP</div>
              <div class="card mb-16">
                {/* Rolling TOTP Display */}
                <Show when={totpCode()}>
                  <div class="totp-row" onClick={() => handleCopy(totpCode().replace(/\s/g, ""), "mã TOTP")} title="Nhấp để sao chép mã TOTP">
                    <div class="totp-content">
                      <div class="totp-label">Mã xác thực hiện tại (TOTP)</div>
                      <div class="totp-code">{totpCode()}</div>
                    </div>
                    {/* Countdown ring */}
                    <div class="totp-timer">
                      <svg class="timer-ring">
                        <circle cx="12" cy="12" r={radius} />
                        <circle
                          class="progress"
                          cx="12"
                          cy="12"
                          r={radius}
                          stroke-dasharray={String(circumference)}
                          stroke-dashoffset={String(strokeDashoffset())}
                        />
                      </svg>
                      <span class="timer-text">{totpRemaining()}</span>
                    </div>
                  </div>
                </Show>
                {/* Passkeys list */}
                <Show when={fidoCredentials().length > 0}>
                  <For each={fidoCredentials()}>
                    {(cred) => (
                      <div class="detail-row">
                        <div class="field-content">
                          <div class="field-label">Passkey đã liên kết</div>
                          <div class="field-value">
                            <strong>{cred.userName || "Không có tên"}</strong> (RP: {cred.rpId})
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </Show>

            {/* Card 3: Auto-fill Options */}
            <div class="detail-section-title">Tùy chọn tự động điền</div>
            <div class="card mb-16">
              {/* URI Field */}
              <div class="detail-row">
                <div class="field-content">
                  <div class="field-label">Trang web (URI)</div>
                  <div class="field-value">{uri() || "Không có"}</div>
                </div>
                <Show when={uri()}>
                  <div class="field-actions">
                    <button type="button" class="action-btn" onClick={() => window.open(uri(), "_blank")} title="Truy cập trang web">
                      <ExternalLinkIcon class="icon-inline" />
                    </button>
                    <button type="button" class="action-btn" onClick={() => handleCopy(uri(), "địa chỉ URI")} title="Sao chép trang web">
                      <CopyIcon />
                    </button>
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          {/* Card 4: Custom Fields */}
          <Show when={fields().length > 0}>
            <div class="detail-section-title" style={{ "margin-top": store.selectedItem?.type === VaultItemType.SecureNote ? "0" : "16px" }}>Trường tùy chỉnh</div>
            <div class="card mb-16">
               <For each={fields()}>
                {(field, index) => (
                  <Show when={field.type === 2} fallback={
                    <div class="detail-row">
                      <div class="field-content">
                        <div class="field-label">{field.name || "Trường tùy chỉnh"}</div>
                        <div class="field-value">
                          {field.type === 1 
                            ? (visibleFields()[index()] ? field.value : "••••••••••••") 
                            : field.value || "Trống"}
                        </div>
                      </div>
                      <div class="field-actions">
                        <Show when={field.type === 1}>
                          <button 
                            type="button" 
                            class="action-btn" 
                            onClick={() => toggleFieldVisibility(index())}
                            title={visibleFields()[index()] ? "Ẩn giá trị" : "Hiển thị giá trị"}
                          >
                            <Show when={visibleFields()[index()]} fallback={<EyeIcon class="icon-inline" />}>
                              <EyeOffIcon class="icon-inline" />
                            </Show>
                          </button>
                        </Show>
                        <Show when={field.value}>
                          <button 
                            type="button" 
                            class="action-btn" 
                            onClick={() => handleCopy(field.value, field.name || "giá trị")} 
                            title={`Sao chép ${field.name || "giá trị"}`}
                          >
                            <CopyIcon />
                          </button>
                        </Show>
                      </div>
                    </div>
                  }>
                    {/* Divider row */}
                    <div class="custom-field-divider">
                      <span>{field.name || "Phân cách"}</span>
                    </div>
                  </Show>
                )}
              </For>
            </div>
          </Show>

          {/* Card 5: Notes display */}
          <Show when={notes()}>
            <div class="detail-section-title" style={{ "margin-top": (store.selectedItem?.type === VaultItemType.SecureNote && fields().length === 0) ? "0" : "16px" }}>Ghi chú</div>
            <div class="card mb-16">
              <div style="padding: 8px 12px;">
                <div class="notes-display">{notes()}</div>
              </div>
            </div>
          </Show>
        </div>

        {/* Footer: Sửa và Xóa */}
        <div class="detail-footer-bar">
          <button
            type="button"
            class="detail-delete-btn"
            onClick={handleDelete}
            title="Xóa tài khoản"
          >
            <TrashIcon class="icon-inline-large" />
          </button>
          <Button type="button" variant="primary" onClick={handleGoToEdit} class="min-w-100">Sửa</Button>
        </div>
      </div>
    </div>
  );
};
export default ItemDetail;
