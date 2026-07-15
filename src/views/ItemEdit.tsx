import { createSignal, onMount, type Component, Show, For } from "solid-js";
import { store, storeActions, View } from "@/shared/store.ts";
import { type VaultItem, type Fido2Credential, type VaultField } from "@/shared/types.ts";
import Button from "./Button.tsx";
import Input from "./Input.tsx";
import { ArrowLeftIcon, CopyIcon, DragIcon, EditIcon, EyeIcon, EyeOffIcon, TrashIcon, QrIcon, HeartFilledIcon, HeartOutlineIcon } from "@/icons/svg/index.ts";

export const ItemEdit: Component = () => {
  const isEdit = () => !!store.selectedItem?.id;

  // Local form states
  const [name, setName] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [uri, setUri] = createSignal("");
  const [totpSecret, setTotpSecret] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [favorite, setFavorite] = createSignal(false);
  const [fidoCredentials, setFidoCredentials] = createSignal<Fido2Credential[]>([]);
  const [fields, setFields] = createSignal<VaultField[]>([]);

  // UI state
  const [showPassword, setShowPassword] = createSignal(false);
  const [showTotpSecret, setShowTotpSecret] = createSignal(false);
  const [scanning, setScanning] = createSignal(false);
  const [error, setError] = createSignal("");
  const [saving, setSaving] = createSignal(false);

  // Add field modal states
  const [showAddFieldModal, setShowAddFieldModal] = createSignal(false);
  const [newFieldName, setNewFieldName] = createSignal("");
  const [newFieldType, setNewFieldType] = createSignal(0);

  // Edit field modal states
  const [showEditFieldModal, setShowEditFieldModal] = createSignal(false);
  const [selectedFieldIndex, setSelectedFieldIndex] = createSignal<number | null>(null);
  const [editFieldName, setEditFieldName] = createSignal("");
  const [editFieldValue, setEditFieldValue] = createSignal("");
  const [editFieldType, setEditFieldType] = createSignal(0);

  const handleOpenEditField = (index: number) => {
    const field = fields()[index];
    if (!field) return;
    setSelectedFieldIndex(index);
    setEditFieldType(field.type);
    setEditFieldName(field.name || "");
    setEditFieldValue(field.value || "");
    setShowEditFieldModal(true);
  };

  const handleSaveFieldEdit = () => {
    const nameVal = editFieldName().trim();
    if (!nameVal) {
      alert(editFieldType() === 2 ? "Vui lòng nhập tên nhóm phân cách" : "Vui lòng nhập tên trường");
      return;
    }
    const idx = selectedFieldIndex();
    if (idx === null) return;

    setFields(fields().map((f, i) => i === idx ? {
      type: editFieldType(),
      name: nameVal,
      value: editFieldType() === 2 ? "" : editFieldValue().trim()
    } : f));
    setShowEditFieldModal(false);
    setSelectedFieldIndex(null);
  };

  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = createSignal<number | null>(null);

  onMount(() => {
    const item = store.selectedItem;
    if (item) {
      setName(item.name || "");
      setUsername(item.login?.username || "");
      setPassword(item.login?.password || "");
      setUri(item.login?.uris?.[0]?.uri || "");
      setTotpSecret(item.login?.totp || "");
      setNotes(item.notes || "");
      setFavorite(item.favorite || false);
      setFidoCredentials(item.login?.fido2Credentials || []);
      setFields(item.fields || []);
    } else {
      setFields([]);
    }
  });

  const handleDragStart = (index: number, e: DragEvent) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (index: number, e: DragEvent) => {
    e.preventDefault();
    const dragged = draggedIndex();
    if (dragged === null || dragged === index) return;

    const list = [...fields()];
    const [moved] = list.splice(dragged, 1);
    list.splice(index, 0, moved);
    setFields(list);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleAddConfirm = () => {
    const nameVal = newFieldName().trim();
    if (!nameVal) {
      alert(newFieldType() === 2 ? "Vui lòng nhập tên nhóm phân cách" : "Vui lòng nhập tên trường");
      return;
    }
    setFields([...fields(), { type: newFieldType(), name: nameVal, value: "" }]);
    setShowAddFieldModal(false);
    setNewFieldName("");
    setNewFieldType(0);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields().filter((_, i) => i !== index));
  };

  const handleCopy = async (text: string, type: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    storeActions.showToast(`Đã sao chép ${type}!`, "success");
  };

  const handleScanQr = async () => {
    setScanning(true);
    setError("");
    try {
      const res = await new Promise<{ success: boolean; secret?: string; error?: string }>((resolve) => {
        chrome.runtime.sendMessage({ type: "SCAN_QR_CODE" }, resolve);
      });

      if (res && res.success && res.secret) {
        setTotpSecret(res.secret);
        storeActions.showToast("Đã tìm thấy và điền mã QR thành công!", "success");
      } else {
        setError(res.error || "Không tìm thấy mã QR nào trên màn hình. Hãy đảm bảo mã QR đang hiển thị trên trang web phía sau.");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Lỗi chụp quét mã QR");
    } finally {
      setScanning(false);
    }
  };

  const handleDeleteFidoCredential = (credId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa Passkey này? Việc này sẽ hủy liên kết đăng nhập bằng Passkey của tài khoản này.")) return;
    setFidoCredentials(fidoCredentials().filter(c => c.credentialId !== credId));
  };

  const handleSave = async (e: Event) => {
    e.preventDefault();
    if (saving()) return;
    if (!name().trim()) {
      setError("Vui lòng nhập tên tài khoản");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const itemData: Partial<VaultItem> = {
        id: store.selectedItem?.id || undefined,
        name: name().trim(),
        notes: notes().trim(),
        favorite: favorite(),
        fields: fields().map(f => ({
          type: f.type,
          name: f.name.trim(),
          value: f.value.trim()
        })),
        login: {
          username: username().trim(),
          password: password().trim(),
          totp: totpSecret().trim(),
          uris: uri().trim() ? [{ uri: uri().trim() }] : [],
          fido2Credentials: fidoCredentials(),
        },
      };

      const res = await storeActions.saveItem(itemData);
      if (res.success) {
        // If was editing, return to detail view, else go back to vault
        if (isEdit()) {
          // Update selectedItem locally so the detail view shows updated content immediately
          const savedItem = store.vaultItems.find(v => v.id === store.selectedItem?.id);
          if (savedItem) {
            storeActions.selectItem(savedItem);
          } else {
            storeActions.navigate(View.Vault);
          }
        } else {
          storeActions.navigate(View.Vault);
        }
      } else {
        setError(res.error || "Lỗi lưu tài khoản");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isEdit()) {
      storeActions.navigate(View.ItemDetail);
    } else {
      storeActions.navigate(View.Vault);
    }
  };

  return (
    <div class="app-container h-full">
      {/* Header */}
      <div class="detail-item-header" style="justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="back-btn detail-back-btn" onClick={handleCancel}>
            <ArrowLeftIcon class="icon-inline-large" />
          </div>
          <div class="detail-title detail-header-title">
            {isEdit() ? "Chỉnh sửa tài khoản" : "Thêm tài khoản"}
          </div>
        </div>
        <button
          type="button"
          class="action-btn"
          style="color: var(--white); cursor: pointer; display: flex; align-items: center; padding: 4px;"
          onClick={() => setFavorite(!favorite())}
          title={favorite() ? "Bỏ yêu thích" : "Yêu thích"}
        >
          <Show when={favorite()} fallback={<HeartOutlineIcon style="width: 20px; height: 20px; color: rgba(255, 255, 255, 0.7);" />}>
            <HeartFilledIcon style="width: 20px; height: 20px; color: #ff4e63;" />
          </Show>
        </button>
      </div>

      <form onSubmit={handleSave} class="detail-form">
        {/* Scrollable Form Body */}
        <div class="app-body pb-24">
          <Show when={error()}>
            <div class="alert alert-danger">{error()}</div>
          </Show>

          <div class="form-group">
            <label for="item-name">Tên</label>
            <Input
              id="item-name"
              type="text"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              placeholder="Ví dụ: Google, Facebook..."
            />
          </div>

          <div class="form-group">
            <label for="item-username">Tên đăng nhập</label>
            <Input
              id="item-username"
              type="text"
              value={username()}
              onInput={(e) => setUsername(e.currentTarget.value)}
              placeholder="Username hoặc email..."
            />
          </div>

          <div class="form-group">
            <label for="item-password">Mật khẩu</label>
            <div class="pos-relative">
              <Input
                id="item-password"
                type={showPassword() ? "text" : "password"}
                class="password-font pr-68"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                placeholder="Mật khẩu..."
              />
              <div class="input-right-actions">
                <button
                  type="button"
                  class="action-btn input-action-btn"
                  onClick={() => setShowPassword(!showPassword())}
                >
                  <Show when={showPassword()} fallback={
                    <EyeIcon class="icon-inline" />
                  }>
                    <EyeOffIcon class="icon-inline" />
                  </Show>
                </button>
                <button
                  type="button"
                  class="action-btn input-action-btn"
                  onClick={() => handleCopy(password(), "mật khẩu")}
                >
                  <CopyIcon class="icon-inline" />
                </button>
              </div>
            </div>
          </div>

          {/* Passkeys list in Edit Mode */}
          <Show when={fidoCredentials().length > 0}>
            <div class="detail-section-title">Passkey đã liên kết</div>
            <div class="card p-8 mb-12">
              <For each={fidoCredentials()}>
                {(cred) => (
                  <div class="fido2-cred-row">
                    <div>
                      <strong>{cred.userName || "Không có tên"}</strong>
                      <span class="card-sub-text">RP: {cred.rpId}</span>
                    </div>
                    <button 
                      type="button" 
                      class="action-btn fido2-delete-btn" 
                      onClick={() => handleDeleteFidoCredential(cred.credentialId)} 
                      title="Xóa Passkey"
                    >
                      <TrashIcon class="icon-inline" />
                    </button>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* TOTP Section */}
          <div class="form-group mb-20">
            <label for="item-totp">Khóa xác thực TOTP (Secret Key)</label>
            <div class="pos-relative mb-8">
              <Input
                id="item-totp"
                type={showTotpSecret() ? "text" : "password"}
                class="password-font pr-68"
                value={totpSecret()}
                onInput={(e) => setTotpSecret(e.currentTarget.value)}
                placeholder="Secret key (Base32)..."
              />
              <div class="input-right-actions">
                <button
                  type="button"
                  class="action-btn input-action-btn"
                  onClick={() => setShowTotpSecret(!showTotpSecret())}
                  title={showTotpSecret() ? "Ẩn khóa TOTP" : "Hiển thị khóa TOTP"}
                >
                  <Show when={showTotpSecret()} fallback={
                    <EyeIcon class="icon-inline" />
                  }>
                    <EyeOffIcon class="icon-inline" />
                  </Show>
                </button>
                <button
                  type="button"
                  class="action-btn input-action-btn"
                  title="Quét mã QR trên màn hình"
                  onClick={handleScanQr}
                  disabled={scanning()}
                >
                  <QrIcon class={scanning() ? "spinning icon-inline" : "icon-inline"} />
                </button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="item-uri">URI (Trang web)</label>
            <Input
              id="item-uri"
              type="text"
              value={uri()}
              onInput={(e) => setUri(e.currentTarget.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* Custom Fields in Edit Mode */}
          <Show when={fields().length > 0}>
            <div class="detail-section-title">Trường tùy chỉnh</div>
            <div class="card p-8 mb-12">
              <For each={fields()}>
                {(field, index) => (
                  <Show when={field.type === 2} fallback={
                    <div 
                      draggable="true"
                      onDragStart={(e) => handleDragStart(index(), e)}
                      onDragOver={(e) => handleDragOver(index(), e)}
                      onDragEnd={handleDragEnd}
                      style={{
                        display: "flex",
                        "flex-direction": "column",
                        gap: "6px",
                        "margin-bottom": "12px",
                        "padding-bottom": "12px",
                        "border-bottom": "1px dashed var(--border)",
                        opacity: draggedIndex() === index() ? 0.4 : 1,
                        cursor: "move"
                      }}
                    >
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <div style="cursor: grab; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
                            <DragIcon class="icon-inline" />
                          </div>
                          <span style="font-weight: 600; font-size: 13px; color: var(--text);">{field.name}</span>
                          <span style="font-size: 12px; color: var(--text-muted); margin-left: 8px; font-family: inherit; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">
                            {field.type === 1 ? "••••••••" : (field.value || "Trống")}
                          </span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                          <button
                            type="button"
                            class="action-btn"
                            style="padding: 4px; color: var(--text-muted);"
                            onClick={() => handleOpenEditField(index())}
                            title="Sửa trường"
                          >
                            <EditIcon class="icon-inline" />
                          </button>
                          <button
                            type="button"
                            class="action-btn"
                            style="padding: 4px; color: var(--error);"
                            onClick={() => handleRemoveField(index())}
                            title="Xóa trường"
                          >
                            <TrashIcon class="icon-inline" />
                          </button>
                        </div>
                      </div>
                    </div>
                  }>
                    {/* Divider Edit Row */}
                    <div 
                      draggable="true"
                      onDragStart={(e) => handleDragStart(index(), e)}
                      onDragOver={(e) => handleDragOver(index(), e)}
                      onDragEnd={handleDragEnd}
                      style={{
                        display: "flex",
                        "flex-direction": "column",
                        gap: "6px",
                        "margin-bottom": "12px",
                        "padding-bottom": "12px",
                        "border-bottom": "1px dashed var(--border)",
                        opacity: draggedIndex() === index() ? 0.4 : 1,
                        cursor: "move"
                      }}
                    >
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 6px; flex: 1;">
                          <div style="cursor: grab; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
                            <DragIcon class="icon-inline" />
                          </div>
                          <span style="font-size: 11px; font-weight: 700; color: var(--primary-accent, var(--primary)); text-transform: uppercase; letter-spacing: 0.8px; padding-left: 4px;">
                            {field.name}
                          </span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                          <button
                            type="button"
                            class="action-btn"
                            style="padding: 4px; color: var(--text-muted);"
                            onClick={() => handleOpenEditField(index())}
                            title="Sửa phân cách"
                          >
                            <EditIcon class="icon-inline" />
                          </button>
                          <button
                            type="button"
                            class="action-btn"
                            style="padding: 4px; color: var(--error);"
                            onClick={() => handleRemoveField(index())}
                            title="Xóa phân cách"
                          >
                            <TrashIcon class="icon-inline" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Show>
                )}
              </For>
            </div>
          </Show>

          {/* Button to Open Add Custom Field Modal */}
          <div style="margin-bottom: 16px;">
            <button
              type="button"
              class="btn btn-secondary w-full"
              style="font-size: 12px; padding: 8px;"
              onClick={() => setShowAddFieldModal(true)}
            >
              + Thêm trường tùy chỉnh
            </button>
          </div>

          <div class="form-group">
            <label for="item-notes">Ghi chú</label>
            <textarea
              id="item-notes"
              class="input-control resize-none"
              value={notes()}
              onInput={(e) => setNotes(e.currentTarget.value)}
              placeholder="Thông tin thêm..."
              rows="3"
            />
          </div>

        </div>

        {/* Footer */}
        <div class="detail-footer-bar">
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving()}>Hủy</Button>
          <Button type="submit" variant="primary" class="min-w-100" disabled={saving()}>
            <Show when={saving()} fallback="Lưu">
              Đang lưu...
            </Show>
          </Button>
        </div>
      </form>

      {/* Add Custom Field Modal Overlay */}
      <Show when={showAddFieldModal()}>
        <div class="modal-overlay">
          <div class="modal-container">
            <div class="modal-title">Thêm trường tùy chỉnh mới</div>
            
            <div class="form-group">
              <label>Loại trường</label>
              <select
                class="input-control"
                value={newFieldType()}
                onChange={(e) => setNewFieldType(parseInt(e.currentTarget.value))}
                style="height: 38px; border-radius: 8px; font-size: 13px;"
              >
                <option value={0}>Văn bản (Chữ)</option>
                <option value={1}>Ẩn (Mật khẩu)</option>
                <option value={2}>Phân cách (Divider)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Tên trường</label>
              <Input
                type="text"
                placeholder={newFieldType() === 2 ? "Ví dụ: CAU HINH NET, APIS..." : "Ví dụ: device, pin, ip..."}
                value={newFieldName()}
                onInput={(e) => setNewFieldName(e.currentTarget.value)}
              />
            </div>

            <div class="modal-actions">
              <Button type="button" variant="secondary" onClick={() => { setShowAddFieldModal(false); setNewFieldName(""); }}>
                Hủy
              </Button>
              <Button type="button" variant="primary" onClick={handleAddConfirm}>
                Thêm
              </Button>
            </div>
          </div>
        </div>
      </Show>

      {/* Edit Custom Field Modal Overlay */}
      <Show when={showEditFieldModal()}>
        <div class="modal-overlay">
          <div class="modal-container">
            <div class="modal-title">Chỉnh sửa trường tùy chỉnh</div>
            
            <div class="form-group">
              <label>Loại trường</label>
              <select
                class="input-control"
                value={editFieldType()}
                onChange={(e) => setEditFieldType(parseInt(e.currentTarget.value))}
                style="height: 38px; border-radius: 8px; font-size: 13px;"
              >
                <option value={0}>Văn bản (Chữ)</option>
                <option value={1}>Ẩn (Mật khẩu)</option>
                <option value={2}>Phân cách (Divider)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Tên trường</label>
              <Input
                type="text"
                placeholder={editFieldType() === 2 ? "Ví dụ: CAU HINH NET, APIS..." : "Ví dụ: device, pin, ip..."}
                value={editFieldName()}
                onInput={(e) => setEditFieldName(e.currentTarget.value)}
              />
            </div>

            <Show when={editFieldType() !== 2}>
              <div class="form-group">
                <label>Giá trị</label>
                <Input
                  type={editFieldType() === 1 ? "password" : "text"}
                  placeholder="Nhập giá trị..."
                  value={editFieldValue()}
                  onInput={(e) => setEditFieldValue(e.currentTarget.value)}
                />
              </div>
            </Show>

            <div class="modal-actions">
              <Button type="button" variant="secondary" onClick={() => { setShowEditFieldModal(false); setSelectedFieldIndex(null); }}>
                Hủy
              </Button>
              <Button type="button" variant="primary" onClick={handleSaveFieldEdit}>
                Lưu
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
export default ItemEdit;
