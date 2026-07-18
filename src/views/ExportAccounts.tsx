import { type Component, createSignal, Show } from "solid-js";
import { store } from "@/shared/store.ts";
import { VaultItemType, View } from "@/shared/types.ts";
import { navigate } from "@/shared/navigation.ts";
import { requestReprompt, showToast } from "@/shared/ui-service.ts";
import { ChevronRightIcon, DownloadIcon } from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";
import { APP_NAME } from "@/shared/constants.ts";
import DetailHeader from "@/components/DetailHeader.tsx";
import {
  exportToBitwardenCsv,
  exportToBrowserCsv,
} from "@/shared/import-export.ts";

export const ExportAccounts: Component = () => {
  const [error, setError] = createSignal("");

  const handleBack = () => {
    navigate(View.VaultOptions);
  };

  const handleExportClick = async (type: "browser" | "bitwarden" | "json") => {
    setError("");
    try {
      const verified = await requestReprompt();
      if (!verified) return;

      let fileContent = "";
      let fileName = "";
      let mimeType = "";

      if (type === "json") {
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
              type: VaultItemType.Login,
              reprompt: item.reprompt,
              login: {
                username: item.login.username || "",
                password: item.login.password || "",
                totp: item.login.totp || "",
                uris: item.login.uris?.map((u) => ({
                  uri: u.uri,
                  match: null,
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
              type: VaultItemType.Card,
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
              type: VaultItemType.Identity,
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
              type: VaultItemType.SshKey,
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
              type: VaultItemType.SecureNote,
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

        fileContent = JSON.stringify(exportPayload, null, 2);
        fileName = `${APP_NAME.toLowerCase()}_export_${
          new Date().toISOString().slice(0, 10)
        }.json`;
        mimeType = "application/json";
      } else if (type === "browser") {
        fileContent = exportToBrowserCsv(store.vaultItems);
        fileName = `${APP_NAME.toLowerCase()}_browser_export_${
          new Date().toISOString().slice(0, 10)
        }.csv`;
        mimeType = "text/csv";
      } else {
        fileContent = exportToBitwardenCsv(store.vaultItems);
        fileName = `${APP_NAME.toLowerCase()}_bitwarden_export_${
          new Date().toISOString().slice(0, 10)
        }.csv`;
        mimeType = "text/csv";
      }

      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t("settings_export_success"), "success");
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
          title={t("settings_export_accounts_title")}
          onBack={handleBack}
        />

        <Show when={error()}>
          <div class="alert alert-danger">{error()}</div>
        </Show>

        <div class="card card-list">
          {/* Browser CSV */}
          <div class="setting-row" onClick={() => handleExportClick("browser")}>
            <div class="setting-row-left">
              <DownloadIcon />
              <div>
                <div class="setting-label">{t("export_option_browser")}</div>
                <div class="setting-sub">{t("export_option_browser_sub")}</div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Bitwarden CSV */}
          <div
            class="setting-row"
            onClick={() => handleExportClick("bitwarden")}
          >
            <div class="setting-row-left">
              <DownloadIcon />
              <div>
                <div class="setting-label">
                  {t("export_option_bitwarden_csv")}
                </div>
                <div class="setting-sub">
                  {t("export_option_bitwarden_csv_sub")}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* JSON Backup */}
          <div class="setting-row" onClick={() => handleExportClick("json")}>
            <div class="setting-row-left">
              <DownloadIcon />
              <div>
                <div class="setting-label">{t("export_option_json")}</div>
                <div class="setting-sub">{t("export_option_json_sub")}</div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportAccounts;
