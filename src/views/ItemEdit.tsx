import { type Component, createSignal, For, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { store, storeActions, View } from "@/shared/store.ts";
import {
  type CardVaultItem,
  CustomFieldType,
  type Fido2Credential,
  type IdentityVaultItem,
  type LoginVaultItem,
  type SecureNoteVaultItem,
  type SshKeyVaultItem,
  type VaultField,
  VaultItemType,
} from "@/shared/types.ts";
import Button from "@/components/Button.tsx";
import Input from "@/components/Input.tsx";
import Checkbox from "@/components/Checkbox.tsx";
import CustomFieldModal from "@/components/CustomFieldModal.tsx";
import { DragIcon, EditIcon, TrashIcon } from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";
import DetailHeader from "@/components/DetailHeader.tsx";
import LoginEditFields from "@/components/item-edit/LoginEditFields.tsx";
import CardEditFields from "@/components/item-edit/CardEditFields.tsx";
import NoteEditFields from "@/components/item-edit/NoteEditFields.tsx";
import IdentityEditFields from "@/components/item-edit/IdentityEditFields.tsx";
import SshKeyEditFields from "@/components/item-edit/SshKeyEditFields.tsx";
import qrcodeParser from "qrcode-parser";

export const ItemEdit: Component = () => {
  const isEdit = () => !!store.selectedItem?.id;

  const [formState, setFormState] = createStore({
    itemType: VaultItemType.Login,
    name: "",
    notes: "",
    favorite: false,
    reprompt: 0,
    fields: Array<VaultField>(),
    username: "",
    password: "",
    uri: "",
    totpSecret: "",
    fidoCredentials: Array<Fido2Credential>(),
    cardholderName: "",
    cardNumber: "",
    cardBrand: "Visa",
    cardExpMonth: "1",
    cardExpYear: String(new Date().getFullYear()),
    cardCode: "",
    sshPrivateKey: "",
    sshPublicKey: "",
    sshFingerprint: "",
    identityTitle: "",
    firstName: "",
    middleName: "",
    lastName: "",
    identityUsername: "",
    company: "",
    ssn: "",
    passportNumber: "",
    licenseNumber: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    address3: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  const updateForm = <K extends keyof typeof formState>(key: K, value: typeof formState[K]) => {
    setFormState(key, value);
  };

  // UI state
  const [scanning, setScanning] = createSignal(false);
  const [error, setError] = createSignal("");
  const [saving, setSaving] = createSignal(false);

  const [showEditFieldModal, setShowEditFieldModal] = createSignal(false);
  const [selectedFieldIndex, setSelectedFieldIndex] = createSignal<
    number | null
  >(null);

  const initialField = () => {
    const idx = selectedFieldIndex();
    return idx === null ? null : formState.fields[idx];
  };

  const handleOpenAddField = () => {
    setSelectedFieldIndex(null);
    setShowEditFieldModal(true);
  };

  const handleOpenEditField = (index: number) => {
    setSelectedFieldIndex(index);
    setShowEditFieldModal(true);
  };

  const handleSaveFieldEdit = (
    field: { name: string; value: string; type: number },
  ) => {
    const idx = selectedFieldIndex();
    if (idx === null) {
      updateForm("fields", [...formState.fields, field]);
    } else {
      updateForm("fields", formState.fields.map((f, i) => (i === idx ? field : f)));
    }
    setShowEditFieldModal(false);
    setSelectedFieldIndex(null);
  };

  const handleCloseFieldModal = () => {
    setShowEditFieldModal(false);
    setSelectedFieldIndex(null);
  };

  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = createSignal<number | null>(null);

  onMount(() => {
    const item = store.selectedItem;
    if (item) {
      setFormState({
        itemType: item.type || VaultItemType.Login,
        name: item.name || "",
        notes: item.notes || "",
        favorite: item.favorite || false,
        reprompt: item.reprompt || 0,
        fields: item.fields ? JSON.parse(JSON.stringify(item.fields)) : [],
        username: item.type === VaultItemType.Login ? item.login.username || "" : "",
        password: item.type === VaultItemType.Login ? item.login.password || "" : "",
        uri: item.type === VaultItemType.Login ? item.login.uris?.[0]?.uri || "" : "",
        totpSecret: item.type === VaultItemType.Login ? item.login.totp || "" : "",
        fidoCredentials: item.type === VaultItemType.Login ? item.login.fido2Credentials || [] : [],
        cardholderName: item.type === VaultItemType.Card ? item.card.cardholderName || "" : "",
        cardNumber: item.type === VaultItemType.Card ? item.card.number || "" : "",
        cardBrand: item.type === VaultItemType.Card ? item.card.brand || "Visa" : "Visa",
        cardExpMonth: item.type === VaultItemType.Card ? item.card.expMonth || "1" : "1",
        cardExpYear: item.type === VaultItemType.Card ? item.card.expYear || String(new Date().getFullYear()) : String(new Date().getFullYear()),
        cardCode: item.type === VaultItemType.Card ? item.card.code || "" : "",
        sshPrivateKey: item.type === VaultItemType.SshKey ? item.sshKey.privateKey || "" : "",
        sshPublicKey: item.type === VaultItemType.SshKey ? item.sshKey.publicKey || "" : "",
        sshFingerprint: item.type === VaultItemType.SshKey ? item.sshKey.keyFingerprint || "" : "",
        identityTitle: item.type === VaultItemType.Identity ? item.identity.title || "" : "",
        firstName: item.type === VaultItemType.Identity ? item.identity.firstName || "" : "",
        middleName: item.type === VaultItemType.Identity ? item.identity.middleName || "" : "",
        lastName: item.type === VaultItemType.Identity ? item.identity.lastName || "" : "",
        identityUsername: item.type === VaultItemType.Identity ? item.identity.username || "" : "",
        company: item.type === VaultItemType.Identity ? item.identity.company || "" : "",
        ssn: item.type === VaultItemType.Identity ? item.identity.ssn || "" : "",
        passportNumber: item.type === VaultItemType.Identity ? item.identity.passportNumber || "" : "",
        licenseNumber: item.type === VaultItemType.Identity ? item.identity.licenseNumber || "" : "",
        email: item.type === VaultItemType.Identity ? item.identity.email || "" : "",
        phone: item.type === VaultItemType.Identity ? item.identity.phone || "" : "",
        address1: item.type === VaultItemType.Identity ? item.identity.address1 || "" : "",
        address2: item.type === VaultItemType.Identity ? item.identity.address2 || "" : "",
        address3: item.type === VaultItemType.Identity ? item.identity.address3 || "" : "",
        city: item.type === VaultItemType.Identity ? item.identity.city || "" : "",
        state: item.type === VaultItemType.Identity ? item.identity.state || "" : "",
        postalCode: item.type === VaultItemType.Identity ? item.identity.postalCode || "" : "",
        country: item.type === VaultItemType.Identity ? item.identity.country || "" : "",
      });
    } else {
      setFormState({
        itemType: VaultItemType.Login,
        name: "",
        notes: "",
        favorite: false,
        reprompt: 0,
        fields: [],
        username: "",
        password: "",
        uri: "",
        totpSecret: "",
        fidoCredentials: [],
        cardholderName: "",
        cardNumber: "",
        cardBrand: "Visa",
        cardExpMonth: "1",
        cardExpYear: String(new Date().getFullYear()),
        cardCode: "",
        sshPrivateKey: "",
        sshPublicKey: "",
        sshFingerprint: "",
        identityTitle: "",
        firstName: "",
        middleName: "",
        lastName: "",
        identityUsername: "",
        company: "",
        ssn: "",
        passportNumber: "",
        licenseNumber: "",
        email: "",
        phone: "",
        address1: "",
        address2: "",
        address3: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      });
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

    const list = [...formState.fields];
    const [moved] = list.splice(dragged, 1);
    list.splice(index, 0, moved);
    updateForm("fields", list);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleRemoveField = (index: number) => {
    updateForm("fields", formState.fields.filter((_, i) => i !== index));
  };

  const handleScanQr = async () => {
    setScanning(true);
    setError("");
    try {
      // 1. Capture the visible tab as a PNG data URL
      const screenshot = await chrome.tabs.captureVisibleTab({ format: "png" });
      if (!screenshot) {
        setError(t("edit_qr_error_fail"));
        return;
      }

      // 2. Decode using qrcode-parser
      const decodedStr = await qrcodeParser(screenshot);
      console.debug("[Popup] Decoded QR Code URL:", decodedStr);

      // 3. Parse OTPAuth URL
      try {
        const url = new URL(decodedStr);
        if (url.protocol === "otpauth:" && url.searchParams.has("secret")) {
          updateForm("totpSecret", decodedStr); // Lưu toàn bộ URL để đồng bộ với định dạng cũ và Bitwarden
          storeActions.showToast(t("edit_qr_success"), "success");
        } else {
          setError(t("edit_qr_error_no_match"));
        }
      } catch (_e) {
        setError(t("edit_qr_error_no_match"));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || t("edit_qr_error_fail"));
    } finally {
      setScanning(false);
    }
  };

  const handleDelete = async () => {
    if (!store.selectedItem?.id) return;
    if (
      !(await storeActions.confirm(
        t("edit_confirm_delete_title"),
        t("edit_confirm_delete_msg", { name: formState.name }),
        "danger",
      ))
    ) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await storeActions.deleteItem(store.selectedItem.id);
      if (res.success) {
        storeActions.navigate(View.Vault);
      } else {
        setError(res.error || t("edit_error_delete_failed"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFidoCredential = async (credId: string) => {
    if (
      !(await storeActions.confirm(
        t("edit_confirm_delete_passkey_title"),
        t("edit_confirm_delete_passkey_msg"),
        "danger",
      ))
    ) return;
    updateForm("fidoCredentials",
      formState.fidoCredentials.filter((c) => c.credentialId !== credId),
    );
  };

  const handleSave = async (e: Event) => {
    e.preventDefault();
    if (saving()) return;
    if (!formState.name.trim()) {
      setError(t("edit_error_empty_name"));
      return;
    }

    setError("");
    setSaving(true);

    try {
      let itemData:
        | Partial<LoginVaultItem>
        | Partial<SecureNoteVaultItem>
        | Partial<CardVaultItem>
        | Partial<IdentityVaultItem>
        | Partial<SshKeyVaultItem>;

      if (formState.itemType === VaultItemType.SecureNote) {
        itemData = {
          id: store.selectedItem?.id || undefined,
          type: VaultItemType.SecureNote,
          name: formState.name.trim(),
          notes: formState.notes.trim(),
          favorite: formState.favorite,
          reprompt: formState.reprompt,
          fields: formState.fields.map((f) => ({
            type: f.type,
            name: f.name.trim(),
            value: f.value.trim(),
          })),
        };
      } else if (formState.itemType === VaultItemType.Card) {
        itemData = {
          id: store.selectedItem?.id || undefined,
          type: VaultItemType.Card,
          name: formState.name.trim(),
          notes: formState.notes.trim(),
          favorite: formState.favorite,
          reprompt: formState.reprompt,
          fields: formState.fields.map((f) => ({
            type: f.type,
            name: f.name.trim(),
            value: f.value.trim(),
          })),
          card: {
            cardholderName: formState.cardholderName.trim(),
            brand: formState.cardBrand,
            number: formState.cardNumber.trim(),
            expMonth: formState.cardExpMonth,
            expYear: formState.cardExpYear.trim(),
            code: formState.cardCode.trim(),
          },
        };
      } else if (formState.itemType === VaultItemType.Login) {
        const originalItem = store.selectedItem;
        const originalLogin = originalItem?.type === VaultItemType.Login
          ? originalItem.login
          : null;

        let revDate = originalLogin?.passwordRevisionDate || null;
        let history = originalLogin?.passwordHistory || [];

        const newPassword = formState.password.trim();
        const oldPassword = originalLogin?.password || "";

        if (originalLogin && newPassword !== oldPassword) {
          revDate = new Date().toISOString();
          if (oldPassword) {
            history = [
              { lastUsedDate: new Date().toISOString(), password: oldPassword },
              ...(history || []),
            ].slice(0, 5);
          }
        }

        const originalUris = originalLogin?.uris || [];
        const newUri = formState.uri.trim();
        const mappedUris = newUri
          ? [{
            uri: newUri,
            match: originalUris[0]?.uri === newUri
              ? originalUris[0]?.match
              : null,
          }]
          : [];

        itemData = {
          id: store.selectedItem?.id || undefined,
          type: VaultItemType.Login,
          name: formState.name.trim(),
          notes: formState.notes.trim(),
          favorite: formState.favorite,
          reprompt: formState.reprompt,
          fields: formState.fields.map((f) => ({
            type: f.type,
            name: f.name.trim(),
            value: f.value.trim(),
          })),
          login: {
            username: formState.username.trim(),
            password: newPassword,
            totp: formState.totpSecret.trim(),
            uris: mappedUris,
            fido2Credentials: formState.fidoCredentials,
            passwordRevisionDate: revDate,
            passwordHistory: history,
          },
        };
      } else if (formState.itemType === VaultItemType.Identity) {
        itemData = {
          id: store.selectedItem?.id || undefined,
          type: VaultItemType.Identity,
          name: formState.name.trim(),
          notes: formState.notes.trim(),
          favorite: formState.favorite,
          reprompt: formState.reprompt,
          fields: formState.fields.map((f) => ({
            type: f.type,
            name: f.name.trim(),
            value: f.value.trim(),
          })),
          identity: {
            title: formState.identityTitle.trim(),
            firstName: formState.firstName.trim(),
            middleName: formState.middleName.trim(),
            lastName: formState.lastName.trim(),
            username: formState.identityUsername.trim(),
            company: formState.company.trim(),
            ssn: formState.ssn.trim(),
            passportNumber: formState.passportNumber.trim(),
            licenseNumber: formState.licenseNumber.trim(),
            email: formState.email.trim(),
            phone: formState.phone.trim(),
            address1: formState.address1.trim(),
            address2: formState.address2.trim(),
            address3: formState.address3.trim(),
            city: formState.city.trim(),
            state: formState.state.trim(),
            postalCode: formState.postalCode.trim(),
            country: formState.country.trim(),
          },
        };
      } else {
        itemData = {
          id: store.selectedItem?.id || undefined,
          type: VaultItemType.SshKey,
          name: formState.name.trim(),
          notes: formState.notes.trim(),
          favorite: formState.favorite,
          reprompt: formState.reprompt,
          fields: formState.fields.map((f) => ({
            type: f.type,
            name: f.name.trim(),
            value: f.value.trim(),
          })),
          sshKey: {
            privateKey: formState.sshPrivateKey.trim(),
            publicKey: formState.sshPublicKey.trim(),
            keyFingerprint: formState.sshFingerprint.trim(),
          },
        };
      }

      const res = await storeActions.saveItem(itemData);
      if (res.success) {
        const msg = isEdit()
          ? (formState.itemType === VaultItemType.SecureNote
            ? t("edit_toast_updated_note")
            : formState.itemType === VaultItemType.Card
            ? t("edit_toast_updated_card")
            : formState.itemType === VaultItemType.Identity
            ? t("edit_toast_updated_identity")
            : formState.itemType === VaultItemType.SshKey
            ? t("edit_toast_updated_ssh_key")
            : t("edit_toast_updated_login"))
          : (formState.itemType === VaultItemType.SecureNote
            ? t("edit_toast_created_note")
            : formState.itemType === VaultItemType.Card
            ? t("edit_toast_created_card")
            : formState.itemType === VaultItemType.Identity
            ? t("edit_toast_created_identity")
            : formState.itemType === VaultItemType.SshKey
            ? t("edit_toast_created_ssh_key")
            : t("edit_toast_created_login"));
        storeActions.showToast(msg, "success");

        // If was editing, return to detail view, else go back to vault
        if (isEdit()) {
          // Update selectedItem locally so the detail view shows updated content immediately
          const savedItem = store.vaultItems.find((v) =>
            v.id === store.selectedItem?.id
          );
          if (savedItem) {
            storeActions.selectItem(savedItem);
          } else {
            storeActions.navigate(View.Vault);
          }
        } else {
          storeActions.navigate(View.Vault);
        }
      } else {
        setError(res.error || t("edit_error_save_failed"));
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
      <form onSubmit={handleSave} class="detail-form">
        {/* Scrollable Form Body */}
        <div class="app-body pb-24">
          {/* Header */}
          <DetailHeader
            title={isEdit()
              ? (formState.itemType === VaultItemType.SecureNote
                ? t("edit_title_edit_note")
                : formState.itemType === VaultItemType.Card
                ? t("edit_title_edit_card")
                : formState.itemType === VaultItemType.Identity
                ? t("edit_title_edit_identity")
                : formState.itemType === VaultItemType.SshKey
                ? t("edit_title_edit_ssh_key")
                : t("edit_title_edit_login"))
              : (formState.itemType === VaultItemType.SecureNote
                ? t("edit_title_add_note")
                : formState.itemType === VaultItemType.Card
                ? t("edit_title_add_card")
                : formState.itemType === VaultItemType.Identity
                ? t("edit_title_add_identity")
                : formState.itemType === VaultItemType.SshKey
                ? t("edit_title_add_ssh_key")
                : t("edit_title_add_login"))}
            onBack={handleCancel}
          />
          <Show when={error()}>
            <div class="alert alert-danger">{error()}</div>
          </Show>

          <div class="detail-section-title mt-0">
            {t("edit_section_item_details")}
          </div>
          <div class="card mb-16">
            <div class="form-group">
              <label for="item-name">{t("edit_label_name")}</label>
              <Input
                id="item-name"
                type="text"
                value={formState.name}
                onInput={(e) => updateForm("name", e.currentTarget.value)}
                placeholder={formState.itemType === VaultItemType.SecureNote
                  ? t("edit_placeholder_name_note")
                  : formState.itemType === VaultItemType.Card
                  ? "e.g. Visa, Mastercard..."
                  : t("edit_placeholder_name_login")}
              />
            </div>
          </div>

          <Show when={formState.itemType === VaultItemType.Login}>
            <LoginEditFields
              username={formState.username}
              setUsername={(v) => updateForm("username", v)}
              password={formState.password}
              setPassword={(v) => updateForm("password", v)}
              uri={formState.uri}
              setUri={(v) => updateForm("uri", v)}
              totpSecret={formState.totpSecret}
              setTotpSecret={(v) => updateForm("totpSecret", v)}
              fidoCredentials={formState.fidoCredentials}
              onDeleteFido={handleDeleteFidoCredential}
              scanning={scanning()}
              onScanQr={handleScanQr}
            />
          </Show>

          <Show when={formState.itemType === VaultItemType.Card}>
            <CardEditFields
              cardholderName={formState.cardholderName}
              setCardholderName={(v) => updateForm("cardholderName", v)}
              cardNumber={formState.cardNumber}
              setCardNumber={(v) => updateForm("cardNumber", v)}
              cardBrand={formState.cardBrand}
              setCardBrand={(v) => updateForm("cardBrand", v)}
              cardExpMonth={formState.cardExpMonth}
              setCardExpMonth={(v) => updateForm("cardExpMonth", v)}
              cardExpYear={formState.cardExpYear}
              setCardExpYear={(v) => updateForm("cardExpYear", v)}
              cardCode={formState.cardCode}
              setCardCode={(v) => updateForm("cardCode", v)}
            />
          </Show>

          <Show when={formState.itemType === VaultItemType.SecureNote}>
            <NoteEditFields
              notes={formState.notes}
              setNotes={(v) => updateForm("notes", v)}
              reprompt={formState.reprompt}
              setReprompt={(v) => updateForm("reprompt", v)}
            />
          </Show>

          <Show when={formState.itemType === VaultItemType.Identity}>
            <IdentityEditFields
              identityTitle={formState.identityTitle}
              setIdentityTitle={(v) => updateForm("identityTitle", v)}
              firstName={formState.firstName}
              setFirstName={(v) => updateForm("firstName", v)}
              middleName={formState.middleName}
              setMiddleName={(v) => updateForm("middleName", v)}
              lastName={formState.lastName}
              setLastName={(v) => updateForm("lastName", v)}
              identityUsername={formState.identityUsername}
              setIdentityUsername={(v) => updateForm("identityUsername", v)}
              company={formState.company}
              setCompany={(v) => updateForm("company", v)}
              ssn={formState.ssn}
              setSsn={(v) => updateForm("ssn", v)}
              passportNumber={formState.passportNumber}
              setPassportNumber={(v) => updateForm("passportNumber", v)}
              licenseNumber={formState.licenseNumber}
              setLicenseNumber={(v) => updateForm("licenseNumber", v)}
              email={formState.email}
              setEmail={(v) => updateForm("email", v)}
              phone={formState.phone}
              setPhone={(v) => updateForm("phone", v)}
              address1={formState.address1}
              setAddress1={(v) => updateForm("address1", v)}
              address2={formState.address2}
              setAddress2={(v) => updateForm("address2", v)}
              address3={formState.address3}
              setAddress3={(v) => updateForm("address3", v)}
              city={formState.city}
              setCity={(v) => updateForm("city", v)}
              state={formState.state}
              setState={(v) => updateForm("state", v)}
              postalCode={formState.postalCode}
              setPostalCode={(v) => updateForm("postalCode", v)}
              country={formState.country}
              setCountry={(v) => updateForm("country", v)}
            />
          </Show>

          <Show when={formState.itemType === VaultItemType.SshKey}>
            <SshKeyEditFields
              privateKey={formState.sshPrivateKey}
              setPrivateKey={(v) => updateForm("sshPrivateKey", v)}
              publicKey={formState.sshPublicKey}
              setPublicKey={(v) => updateForm("sshPublicKey", v)}
              keyFingerprint={formState.sshFingerprint}
              setKeyFingerprint={(v) => updateForm("sshFingerprint", v)}
            />
          </Show>

          {/* Custom Fields in Edit Mode */}
          <Show when={formState.fields.length > 0}>
            <div class="detail-section-title">{t("edit_label_fields")}</div>
            <div class="card mb-12">
              <For each={formState.fields}>
                {(field, index) => (
                  <Show
                    when={field.type === CustomFieldType.Divider}
                    fallback={
                      <div
                        draggable="true"
                        onDragStart={(e) => handleDragStart(index(), e)}
                        onDragOver={(e) => handleDragOver(index(), e)}
                        onDragEnd={handleDragEnd}
                        class={`draggable-field-row ${
                          draggedIndex() === index() ? "dragging" : ""
                        }`}
                      >
                        <div class="d-flex justify-between align-center">
                          <div class="d-flex align-center gap-6">
                            <div class="cursor-grab d-flex align-center justify-center text-muted">
                              <DragIcon class="icon-inline" />
                            </div>
                            <span class="font-w-600 font-sz-13">
                              {field.name}
                            </span>
                            <span class="field-sub-value">
                              {field.type === CustomFieldType.Hidden
                                ? "••••••••"
                                : (field.value || t("detail_no_value"))}
                            </span>
                          </div>
                          <div class="d-flex gap-8">
                            <button
                              type="button"
                              class="action-btn edit-field-btn"
                              onClick={() => handleOpenEditField(index())}
                              title={t("btn_edit")}
                            >
                              <EditIcon class="icon-inline" />
                            </button>
                            <button
                              type="button"
                              class="action-btn delete-field-btn"
                              onClick={() => handleRemoveField(index())}
                              title={t("btn_delete")}
                            >
                              <TrashIcon class="icon-inline" />
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    {/* Divider Edit Row */}
                    <div
                      draggable="true"
                      onDragStart={(e) => handleDragStart(index(), e)}
                      onDragOver={(e) => handleDragOver(index(), e)}
                      onDragEnd={handleDragEnd}
                      class={`draggable-field-row ${
                        draggedIndex() === index() ? "dragging" : ""
                      }`}
                    >
                      <div class="d-flex justify-between align-center">
                        <div class="d-flex align-center gap-6 flex-1">
                          <div class="cursor-grab d-flex align-center justify-center text-muted">
                            <DragIcon class="icon-inline" />
                          </div>
                          <span class="divider-row-title">
                            {field.name}
                          </span>
                        </div>
                        <div class="d-flex gap-8">
                          <button
                            type="button"
                            class="action-btn edit-field-btn"
                            onClick={() => handleOpenEditField(index())}
                            title={t("btn_edit")}
                          >
                            <EditIcon class="icon-inline" />
                          </button>
                          <button
                            type="button"
                            class="action-btn delete-field-btn"
                            onClick={() => handleRemoveField(index())}
                            title={t("btn_delete")}
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
          <div class="mb-16">
            <button
              type="button"
              class="btn btn-secondary w-full add-field-trigger-btn"
              onClick={handleOpenAddField}
            >
              {t("edit_btn_add_field")}
            </button>
          </div>

          {/* Notes Section (Common to Login and Card) */}
          <Show when={formState.itemType !== VaultItemType.SecureNote}>
            <div class="detail-section-title">
              {t("edit_section_additional_options")}
            </div>
            <div class="card mb-16">
              <div class="form-group">
                <label for="item-notes">{t("edit_label_notes")}</label>
                <textarea
                  id="item-notes"
                  class="input-control resize-none"
                  value={formState.notes}
                  onInput={(e) => updateForm("notes", e.currentTarget.value)}
                  placeholder={t("edit_placeholder_notes")}
                  rows="5"
                />
              </div>
              <div class="form-group mt-12">
                <Checkbox
                  id="item-reprompt"
                  checked={formState.reprompt === 1}
                  onChange={(checked) => updateForm("reprompt", checked ? 1 : 0)}
                  label={t("edit_label_reprompt")}
                />
              </div>
            </div>
          </Show>
        </div>

        {/* Footer */}
        <div class="detail-footer-bar">
          <div class="d-flex gap-8">
            <Button
              type="submit"
              variant="primary"
              loading={saving()}
              loadingText={t("dialog_loading")}
            >
              <Show
                when={saving()}
                fallback={store.selectedItem?.id
                  ? t("btn_save")
                  : t("btn_create")}
              >
                {t("dialog_loading")}
              </Show>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={saving()}
            >
              {t("btn_cancel")}
            </Button>
          </div>

          <Show when={isEdit()}>
            <button
              type="button"
              class="detail-delete-btn"
              onClick={handleDelete}
              title={t("btn_delete")}
              disabled={saving()}
            >
              <TrashIcon class="icon-inline-large" />
            </button>
          </Show>
        </div>
      </form>

      <CustomFieldModal
        isOpen={showEditFieldModal()}
        isEdit={selectedFieldIndex() !== null}
        initialField={initialField()}
        onClose={handleCloseFieldModal}
        onSave={handleSaveFieldEdit}
      />
    </div>
  );
};
export default ItemEdit;
