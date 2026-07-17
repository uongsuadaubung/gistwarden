import { type Component, createSignal, Show } from "solid-js";
import { store, storeActions, View } from "@/shared/store.ts";
import { VaultItemType } from "@/shared/types.ts";
import {
  ChevronRightIcon,
  DownloadIcon,
  SyncIcon,
  UploadIcon,
} from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";
import { APP_NAME } from "@/shared/constants.ts";
import DetailHeader from "@/components/DetailHeader.tsx";

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
      storeActions.showToast(t("vault_sync_success"), "success");
    } else {
      setError(res.error || t("vault_sync_error"));
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
            t("vault_import_success", { count: res.importedCount ?? 0 }),
            "success",
          );
        } else {
          setError(
            res.error || t("vault_import_error_invalid"),
          );
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg || t("vault_import_error_fail"));
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
            reprompt: item.reprompt,
            login: {
              username: item.login.username || "",
              password: item.login.password || "",
              totp: item.login.totp || "",
              uris: item.login.uris?.map((u) => ({
                uri: u.uri,
                match: typeof u.match === "number" ? u.match : null,
              })) || [],
              fido2Credentials: item.login.fido2Credentials || [],
              passwordRevisionDate: item.login.passwordRevisionDate || null,
              passwordHistory: item.login.passwordHistory?.map((ph) => ({
                lastUsedDate: ph.lastUsedDate || null,
                password: ph.password || "",
              })) || [],
            },
          };
        } else if (item.type === VaultItemType.Card) {
          return {
            ...base,
            type: VaultItemType.Card as const,
            reprompt: item.reprompt,
            card: {
              cardholderName: item.card.cardholderName || "",
              brand: item.card.brand || "",
              number: item.card.number || "",
              expMonth: item.card.expMonth || "",
              expYear: item.card.expYear || "",
              code: item.card.code || "",
            },
          };
        } else if (item.type === VaultItemType.Identity) {
          return {
            ...base,
            type: VaultItemType.Identity as const,
            reprompt: item.reprompt,
            identity: {
              title: item.identity.title || "",
              firstName: item.identity.firstName || "",
              middleName: item.identity.middleName || "",
              lastName: item.identity.lastName || "",
              username: item.identity.username || "",
              company: item.identity.company || "",
              ssn: item.identity.ssn || "",
              passportNumber: item.identity.passportNumber || "",
              licenseNumber: item.identity.licenseNumber || "",
              email: item.identity.email || "",
              phone: item.identity.phone || "",
              address1: item.identity.address1 || "",
              address2: item.identity.address2 || "",
              address3: item.identity.address3 || "",
              city: item.identity.city || "",
              state: item.identity.state || "",
              postalCode: item.identity.postalCode || "",
              country: item.identity.country || "",
            },
          };
        } else if (item.type === VaultItemType.SshKey) {
          return {
            ...base,
            type: VaultItemType.SshKey as const,
            reprompt: item.reprompt,
            sshKey: {
              privateKey: item.sshKey.privateKey || "",
              publicKey: item.sshKey.publicKey || "",
              keyFingerprint: item.sshKey.keyFingerprint || "",
            },
          };
        } else {
          return {
            ...base,
            type: VaultItemType.SecureNote as const,
            reprompt: item.reprompt,
            secureNote: {
              type: 0,
            },
          };
        }
      });

      const exportPayload = {
        encrypted: false,
        folders: [],
        items: exportItems,
      };

      const dataStr = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${APP_NAME.toLowerCase()}_export_${
        new Date().toISOString().slice(0, 10)
      }.json`;
      a.click();
      URL.revokeObjectURL(url);
      storeActions.showToast(t("settings_export_success"), "success");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || t("vault_export_error_fail"));
    }
  };

  return (
    <div class="app-container">
      <div class="app-body">
        {/* Header */}
        <DetailHeader
          title={t("settings_vault_options_label")}
          onBack={handleBack}
        />

        <Show when={error()}>
          <div class="alert alert-danger">{error()}</div>
        </Show>

        <div class="card card-list">
          {/* Sync */}
          <div class="setting-row" onClick={handleSync}>
            <div class="setting-row-left">
              <SyncIcon class={loading() ? "spinning" : ""} />
              <div>
                <div class="setting-label">
                  {t("vault_options_sync_manual")}
                </div>
                <div class="setting-sub">
                  {t("settings_last_sync")}: {store.lastSync
                    ? new Date(store.lastSync).toLocaleTimeString()
                    : t("settings_sync_never")}
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
                <div class="setting-label">{t("vault_options_import")}</div>
                <div class="setting-sub">
                  {t("vault_options_import_sub")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              class="d-none"
              onChange={handleFileChange}
            />
          </div>

          {/* Export JSON */}
          <div class="setting-row" onClick={handleExport}>
            <div class="setting-row-left">
              <DownloadIcon />
              <div>
                <div class="setting-label">{t("vault_options_export")}</div>
                <div class="setting-sub">
                  {t("vault_options_export_sub")}
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
