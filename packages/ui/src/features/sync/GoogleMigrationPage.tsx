import {
  asVaultItemId,
  type GoogleMigrationAccountMapping,
  type GoogleMigrationAction,
  type GoogleOtpAccount,
  generateTotpSafe,
  isLoginItem,
  matchGoogleMigrationAccounts,
  parseGoogleMigrationUri,
  safeDecodeQr,
  type VaultItemId,
} from "@gistwarden/domain";
import {
  batchImportGoogleMigrationAccountsUseCase,
  vaultSecurityContext,
} from "@gistwarden/orchestrator";
import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { createStore } from "solid-js/store";
import Button from "@/components/ui/Button.tsx";
import CopyableField from "@/components/ui/CopyableField.tsx";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import GuideHelpButton from "@/components/ui/GuideHelpButton.tsx";
import Input from "@/components/ui/Input.tsx";
import Select from "@/components/ui/Select.tsx";
import { t } from "@/core/i18n.ts";
import { goBack, navigate } from "@/core/navigation.ts";
import {
  accountStore,
  applyVaultPayloadToStore,
  settingsStore,
  setUiStore,
  uiStore,
} from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { setGlobalLoading, showToast } from "@/core/ui-service.ts";

export const GoogleMigrationPage: Component = () => {
  const [mappings, setMappings] = createStore<GoogleMigrationAccountMapping[]>(
    [],
  );
  const [totpCodes, setTotpCodes] = createSignal<Record<string, string>>({});
  const [totpRemaining, setTotpRemaining] = createSignal(30);
  const [error, setError] = createSignal("");
  const [inputUri, setInputUri] = createSignal("");

  let qrFileInputRef: HTMLInputElement | undefined;
  let timerId: number | null = null;

  // Countdown timer circle constants
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = () => {
    return circumference - (totpRemaining() / 30) * circumference;
  };

  const updateTotpCodes = (accountsList: GoogleOtpAccount[]) => {
    const epoch = Math.floor((Date.now() + settingsStore.timeOffset) / 1000);
    const remaining = 30 - (epoch % 30);
    setTotpRemaining(remaining);

    const newCodes: Record<string, string> = {};
    for (const acc of accountsList) {
      const res = generateTotpSafe(acc.secretBase32, settingsStore.timeOffset);
      if (res.isOk()) {
        const rawCode = res.value;
        const formatted =
          rawCode.length === 6
            ? `${rawCode.slice(0, 3)} ${rawCode.slice(3)}`
            : rawCode;
        newCodes[acc.id] = formatted;
      } else {
        newCodes[acc.id] = "------";
      }
    }
    setTotpCodes(newCodes);
  };

  const processRawString = (raw: string) => {
    setError("");
    const res = parseGoogleMigrationUri(raw);
    if (res.isOk()) {
      setUiStore("pendingGoogleMigrationPayload", res.value);
      const initialMappings = matchGoogleMigrationAccounts(
        res.value.accounts,
        accountStore.vaultItems,
      );
      setMappings(initialMappings);
      updateTotpCodes(res.value.accounts);
    } else {
      setError(t(res.error));
    }
  };

  onMount(() => {
    const payload = uiStore.pendingGoogleMigrationPayload;
    if (payload && payload.accounts.length > 0) {
      const initialMappings = matchGoogleMigrationAccounts(
        payload.accounts,
        accountStore.vaultItems,
      );
      setMappings(initialMappings);
      updateTotpCodes(payload.accounts);
    }

    timerId = window.setInterval(() => {
      const currentPayload = uiStore.pendingGoogleMigrationPayload;
      if (currentPayload) {
        updateTotpCodes(currentPayload.accounts);
      }
    }, 1000);
  });

  onCleanup(() => {
    if (timerId !== null) {
      clearInterval(timerId);
    }
  });

  const handleBack = () => {
    goBack(View.VaultOptions);
  };

  const handleFormSubmit = (e: Event) => {
    e.preventDefault();
    const raw = inputUri().trim();
    if (!raw) return;
    processRawString(raw);
  };

  const handleQrUpload = (e: Event) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    const file = target.files?.[0];
    if (!file) return;

    setError("");
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result;
      if (typeof result !== "string") return;

      const res = await safeDecodeQr(result);
      if (res.isOk()) {
        setInputUri(res.value);
        processRawString(res.value);
      } else {
        setError(t(res.error));
      }
      if (qrFileInputRef) qrFileInputRef.value = "";
    };
    reader.readAsDataURL(file);
  };

  const getUsedTargetItemIds = (currentIndex: number): Set<string> => {
    const used = new Set<string>();
    mappings.forEach((m, idx) => {
      if (idx !== currentIndex && m.action === "link" && m.targetItemId) {
        used.add(m.targetItemId);
      }
    });
    return used;
  };

  const handleActionChange = (index: number, action: GoogleMigrationAction) => {
    setMappings(index, "action", action);
    if (action !== "link") {
      setMappings(index, "targetItemId", null);
    } else {
      const currentMapping = mappings[index];
      const usedIds = getUsedTargetItemIds(index);
      if (
        !currentMapping?.targetItemId ||
        usedIds.has(currentMapping.targetItemId)
      ) {
        const availableItem = accountStore.vaultItems.find(
          (item) =>
            isLoginItem(item) &&
            !item.login?.totp?.trim() &&
            !usedIds.has(item.id),
        );
        setMappings(
          index,
          "targetItemId",
          availableItem ? availableItem.id : null,
        );
      }
    }
  };

  const handleTargetItemChange = (index: number, itemId: VaultItemId) => {
    setMappings(index, "targetItemId", itemId ? asVaultItemId(itemId) : null);
  };

  const handleCopyUri = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(t("btn_copied"), "success");
    }
  };

  const loginItemOptions = (
    currentIndex: number,
    currentTargetItemId?: VaultItemId | null,
  ) => {
    const usedIds = getUsedTargetItemIds(currentIndex);

    return accountStore.vaultItems
      .filter((item) => {
        if (!isLoginItem(item)) return false;
        const hasTotp = Boolean(item.login?.totp?.trim());
        if (hasTotp && item.id !== currentTargetItemId) {
          return false;
        }
        if (usedIds.has(item.id) && item.id !== currentTargetItemId) {
          return false;
        }
        return true;
      })
      .map((item) => ({
        value: item.id,
        label:
          isLoginItem(item) && item.login?.username
            ? `${item.name} (${item.login.username})`
            : item.name,
      }));
  };

  const selectedCount = () => {
    return mappings.filter((m) => m.action !== "skip").length;
  };

  const handleSave = async () => {
    setError("");
    const activeMappings = mappings.filter((m) => m.action !== "skip");

    if (activeMappings.length === 0) {
      navigate(View.Vault);
      return;
    }

    setGlobalLoading(true, t("vault_importing"));
    const key = await vaultSecurityContext.getKey();
    if (!key) {
      setGlobalLoading(false);
      showToast(t("toast_error"), "error");
      return;
    }
    const vaultPayload = {
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
      folders: accountStore.folders,
    };
    const salt = accountStore.masterPasswordConfig.salt || "";

    const res = await batchImportGoogleMigrationAccountsUseCase(
      vaultPayload,
      key,
      salt,
      settingsStore.vaultMode,
      mappings,
    );
    setGlobalLoading(false);

    if (res.isOk()) {
      applyVaultPayloadToStore(res.value);
      showToast(
        t("google_migration_save_success", { count: activeMappings.length }),
        "success",
      );
      navigate(View.Vault);
    } else {
      setError(t(res.error));
    }
  };

  return (
    <div class="app-container">
      <div class="app-body">
        <DetailHeader
          title={t("settings_tools_google_auth")}
          onBack={handleBack}
        />

        <Show when={error()}>
          <div class="alert alert-danger mb-3">{error()}</div>
        </Show>

        <input
          type="file"
          ref={qrFileInputRef}
          accept="image/*"
          class="d-none"
          onChange={handleQrUpload}
        />

        <div class="google-migration-tool-card mb-3">
          <form onSubmit={handleFormSubmit}>
            <div class="google-migration-tool-title d-inline-flex align-items-center gap-6 mb-8">
              <span>{t("google_tool_paste_label")}</span>
              <GuideHelpButton
                route="passkey-auth/google-migration"
                size={16}
              />
            </div>
            <div class="google-migration-input-group">
              <Input
                type="text"
                placeholder="otpauth-migration://offline?data=..."
                value={inputUri()}
                onInput={(e) => setInputUri(e.currentTarget.value)}
              />
            </div>
            <div class="btn-group">
              <Button
                type="submit"
                variant="primary"
                class="btn-margin-right"
                disabled={!inputUri().trim()}
              >
                {t("google_tool_btn_parse")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => qrFileInputRef?.click()}
              >
                {t("google_tool_btn_upload_qr")}
              </Button>
            </div>
          </form>
        </div>

        <Show when={mappings.length > 0}>
          <div class="sub-header mb-3 text-secondary text-sm">
            {t("google_migration_subtitle", {
              count: mappings.length,
            })}
          </div>

          <div class="google-migration-list">
            <For each={mappings}>
              {(mapping, index) => {
                const account = mapping.account;
                const title = () =>
                  account.issuer
                    ? `${account.issuer} (${account.name})`
                    : account.name || "Google Authenticator Account";

                return (
                  <div class="google-migration-account-item">
                    <div class="google-migration-account-header">
                      <div class="google-migration-account-title">
                        🔑 {title()}
                      </div>
                    </div>

                    {/* TOTP Code Display (Detail View Style) */}
                    <div class="google-migration-totp-box mb-2">
                      <div
                        class="totp-row mb-0"
                        onClick={() => {
                          const code = (totpCodes()[account.id] || "").replace(
                            /\s/g,
                            "",
                          );
                          if (code && code !== "------") {
                            handleCopyUri(code);
                          }
                        }}
                        title={t("detail_copy_totp")}
                      >
                        <div class="totp-content">
                          <div class="totp-label">{t("detail_totp_label")}</div>
                          <div class="totp-code">
                            {totpCodes()[account.id] || "------"}
                          </div>
                        </div>
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
                    </div>

                    {/* Raw URI Display (1 single line with text-ellipsis ...) */}
                    <div class="google-migration-uri-box">
                      <CopyableField
                        label={t("google_migration_raw_uri")}
                        value={account.otpauthUrl}
                        onCopy={handleCopyUri}
                      />
                    </div>

                    <div class="google-migration-actions-group">
                      <label class="google-migration-radio-row">
                        <input
                          type="radio"
                          id={`action-skip-${account.id}`}
                          name={`action-${account.id}`}
                          checked={mapping.action === "skip"}
                          onChange={() => handleActionChange(index(), "skip")}
                        />
                        <span>{t("google_migration_action_skip")}</span>
                      </label>

                      <label class="google-migration-radio-row">
                        <input
                          type="radio"
                          id={`action-create-${account.id}`}
                          name={`action-${account.id}`}
                          checked={mapping.action === "create"}
                          onChange={() => handleActionChange(index(), "create")}
                        />
                        <span>{t("google_migration_action_create")}</span>
                      </label>

                      <label class="google-migration-radio-row">
                        <input
                          type="radio"
                          id={`action-link-${account.id}`}
                          name={`action-${account.id}`}
                          checked={mapping.action === "link"}
                          onChange={() => handleActionChange(index(), "link")}
                        />
                        <span>{t("google_migration_action_link")}</span>
                      </label>

                      <Show when={mapping.action === "link"}>
                        <div class="google-migration-picker-container">
                          <Select
                            options={loginItemOptions(
                              index(),
                              mapping.targetItemId,
                            )}
                            value={mapping.targetItemId || ""}
                            searchable={true}
                            onChange={(e) =>
                              handleTargetItemChange(
                                index(),
                                asVaultItemId(e.target.value),
                              )
                            }
                          />
                        </div>
                      </Show>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>

          <div class="google-migration-footer">
            <Button
              variant="primary"
              disabled={selectedCount() === 0}
              onClick={handleSave}
            >
              {t("google_migration_save_batch", {
                count: selectedCount(),
              })}
            </Button>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default GoogleMigrationPage;
