import { type Component, createSignal, For, onMount, Show } from "solid-js";
import { store, storeActions } from "@/shared/store.ts";
import { APP_NAME } from "@/shared/constants.ts";
import {
  generatePasskeyAssertResponse,
  generatePasskeyRegisterResponse,
} from "@/shared/passkey-crypto.ts";
import {
  type Fido2Credential,
  type LoginVaultItem,
  type VaultItem,
  VaultItemType,
} from "@/shared/types.ts";
import Button from "@/components/Button.tsx";
import Input from "@/components/Input.tsx";
import {
  InfoIcon,
  LockIcon,
  QuestionIcon,
  ShieldIcon,
} from "@/icons/svg/index.ts";
import { formatDateTime, t } from "@/shared/i18n.ts";

interface Fido2Request {
  success: boolean;
  type: "create" | "get";
  origin: string;
  options: {
    rpId?: string;
    rp: {
      id?: string;
      name: string;
    };
    user: {
      id: string;
      name: string;
      displayName?: string;
    };
    challenge: string;
    userVerification?: "required" | "preferred" | "discouraged";
    allowCredentials?: Array<{
      id: string;
      type: string;
    }>;
  };
}

interface MatchingPasskey {
  credential: Fido2Credential;
  vaultItemName: string;
  vaultItemId: string;
}

export const Fido2Prompt: Component = () => {
  const [masterPassword, setMasterPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [pendingReq, setPendingReq] = createSignal<Fido2Request | null>(null);

  // List of matching passkeys found in vault for assertion (get)
  const [matchingCredentials, setMatchingCredentials] = createSignal<
    MatchingPasskey[]
  >([]);
  const [selectedCredIndex, setSelectedCredIndex] = createSignal(0);

  // List of matching accounts found in vault for registration (create)
  const [matchingAccounts, setMatchingAccounts] = createSignal<
    LoginVaultItem[]
  >([]);
  const [selectedAccountIndex, setSelectedAccountIndex] = createSignal<
    number | null
  >(null);
  const [selectedPasskeyOption, setSelectedPasskeyOption] = createSignal<
    string
  >("add");

  const initPasskeyOptions = (item: LoginVaultItem) => {
    const creds = item.login.fido2Credentials || [];
    if (creds.length > 0) {
      setSelectedPasskeyOption(creds[0].credentialId);
    } else {
      setSelectedPasskeyOption("add");
    }
  };

  onMount(async () => {
    // If vault is already unlocked, load pending request immediately
    if (!store.isLocked) {
      await loadPendingRequest();
    }
  });

  const getDomainFromUrl = (urlStr: string): string => {
    try {
      const url = new URL(urlStr);
      return url.hostname.toLowerCase();
    } catch (_e) {
      return urlStr.toLowerCase();
    }
  };

  const isDomainMatch = (domainA: string, domainB: string): boolean => {
    const d1 = domainA.trim().toLowerCase();
    const d2 = domainB.trim().toLowerCase();
    if (!d1 || !d2) return false;
    if (d1 === d2) return true;
    return d1.endsWith("." + d2) || d2.endsWith("." + d1);
  };

  const findMatchingAccounts = (
    rpId: string,
    origin: string,
  ) => {
    const rpIdNormalized = rpId.toLowerCase().trim();
    const originHost = getDomainFromUrl(origin);

    const matches = store.vaultItems.filter((item): item is LoginVaultItem => {
      if (item.type !== VaultItemType.Login || !item.login) return false;

      // Match domain / RP ID
      // Check URIs
      if (item.login.uris) {
        const hasMatchingUri = item.login.uris.some((u) => {
          const uriHost = getDomainFromUrl(u.uri);
          return isDomainMatch(uriHost, rpIdNormalized) ||
            isDomainMatch(uriHost, originHost);
        });
        if (hasMatchingUri) return true;
      }

      // Check name (exact match or domain match to avoid collision like 'x.com' matching 'firefox.com')
      const itemName = item.name.toLowerCase().trim();
      if (
        itemName === rpIdNormalized ||
        itemName === originHost ||
        isDomainMatch(itemName, rpIdNormalized)
      ) {
        return true;
      }

      return false;
    });

    setMatchingAccounts(matches);
    if (matches.length > 0) {
      setSelectedAccountIndex(0);
      initPasskeyOptions(matches[0]);
    } else {
      setSelectedAccountIndex(null);
      setSelectedPasskeyOption("add");
    }
  };

  const loadPendingRequest = async () => {
    try {
      const res = await new Promise<
        {
          success: boolean;
          type?: "create" | "get";
          options?: Fido2Request["options"];
          origin?: string;
          error?: string;
        }
      >((resolve) => {
        chrome.runtime.sendMessage(
          { type: "GET_PENDING_FIDO2_REQUEST" },
          resolve,
        );
      });

      if (res && res.success && res.type && res.options && res.origin) {
        setPendingReq({
          success: res.success,
          type: res.type,
          options: res.options,
          origin: res.origin,
        });
        if (res.type === "get") {
          let rpId = res.options.rpId;
          if (!rpId) {
            try {
              rpId = new URL(res.origin).hostname;
            } catch (_) {
              rpId = res.origin;
            }
          }
          findMatchingPasskeys(rpId);
        } else if (res.type === "create") {
          const rpId = res.options.rp.id || res.options.rp.name;
          findMatchingAccounts(rpId, res.origin);
        }
      } else {
        setError(res.error || t("fido2_error_no_request"));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || t("fido2_error_load_failed"));
    }
  };

  const findMatchingPasskeys = (rpId: string) => {
    const list: MatchingPasskey[] = [];
    console.log(
      `[${APP_NAME} FIDO2] Bat dau tim kiem Passkey khop voi rpId:`,
      rpId,
    );
    console.log(
      `[${APP_NAME} FIDO2] So luong tai khoan trong ket sat:`,
      store.vaultItems.length,
    );

    store.vaultItems.forEach((item) => {
      if (item.type !== VaultItemType.Login) return;
      console.log(`[${APP_NAME} FIDO2] Kiem tra tai khoan "${item.name}":`, {
        hasLogin: true,
        fido2CredentialsCount: item.login.fido2Credentials?.length || 0,
        fido2Credentials: item.login.fido2Credentials,
      });
      if (item.login.fido2Credentials) {
        item.login.fido2Credentials.forEach((cred: Fido2Credential) => {
          console.log(
            `[${APP_NAME} FIDO2] So sanh rpId: "${cred.rpId}" voi "${rpId}"`,
          );
          if (cred.rpId?.trim().toLowerCase() === rpId?.trim().toLowerCase()) {
            console.log(`[${APP_NAME} FIDO2] KHOP THANH CONG!`);
            list.push({
              vaultItemId: item.id,
              vaultItemName: item.name,
              credential: cred,
            });
          }
        });
      }
    });
    setMatchingCredentials(list);
    console.log(`[${APP_NAME} FIDO2] Ket qua danh sach Passkey khop:`, list);
  };

  const handleUnlock = async (e: Event) => {
    e.preventDefault();
    if (!masterPassword()) {
      setError(t("login_error_empty_mp"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await storeActions.unlock(masterPassword());
      if (res.success) {
        setMasterPassword("");
        await loadPendingRequest();
      } else {
        setError(res.error || t("login_error_wrong_mp"));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || t("login_error_unlock_fail"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRegister = async () => {
    const req = pendingReq();
    if (!req) return;
    setLoading(true);
    setError("");

    try {
      const { newCred, result } = await generatePasskeyRegisterResponse(
        req.options,
        req.origin,
      );

      // Save new credential to Vault
      let saveRes;
      const idx = selectedAccountIndex();
      if (idx !== null && matchingAccounts()[idx]) {
        const existingItem = matchingAccounts()[idx];

        let updatedCredentials: Fido2Credential[] = [];
        const existingCredentials = existingItem.login.fido2Credentials || [];
        const option = selectedPasskeyOption();

        if (option === "add") {
          updatedCredentials = [...existingCredentials, newCred];
        } else {
          updatedCredentials = existingCredentials.map((c) =>
            c.credentialId === option ? newCred : c
          );
          if (!existingCredentials.some((c) => c.credentialId === option)) {
            updatedCredentials.push(newCred);
          }
        }

        const updatedItem: Partial<LoginVaultItem> = {
          id: existingItem.id,
          type: VaultItemType.Login,
          login: {
            ...existingItem.login,
            fido2Credentials: updatedCredentials,
          },
        };
        saveRes = await storeActions.saveItem(updatedItem);
      } else {
        const newItem: Partial<VaultItem> = {
          name: req.options.rp.name || req.options.rp.id,
          type: 1, // Login
          login: {
            username: req.options.user.name,
            password: "",
            uris: [{ uri: req.origin }],
            fido2Credentials: [newCred],
          },
        };
        saveRes = await storeActions.saveItem(newItem);
      }

      if (!saveRes.success) {
        throw new Error(saveRes.error || t("fido2_error_save_failed"));
      }

      // Resolve FIDO2 request in background
      await chrome.runtime.sendMessage({
        type: "RESOLVE_FIDO2_REQUEST",
        result,
      });

      window.close();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || t("fido2_error_create_failed"));
      setLoading(false);
    }
  };

  const handleConfirmAssert = async () => {
    const req = pendingReq();
    if (!req || matchingCredentials().length === 0) return;
    setLoading(true);
    setError("");

    try {
      const selected = matchingCredentials()[selectedCredIndex()];
      const cred = selected.credential;

      // Increment credential counter
      const nextCounter = Math.max(cred.counter + 1, 100000);

      // Update item in Vault
      const updatedCred: Fido2Credential = {
        ...cred,
        counter: nextCounter,
      };

      const originalItem = store.vaultItems.find((v) =>
        v.id === selected.vaultItemId
      );
      if (
        !originalItem || originalItem.type !== VaultItemType.Login ||
        !originalItem.login
      ) {
        throw new Error("Vault item not found");
      }

      const updatedItem: LoginVaultItem = {
        ...originalItem,
        type: VaultItemType.Login,
        login: {
          ...originalItem.login,
          fido2Credentials: (originalItem.login.fido2Credentials || []).map((
            c: Fido2Credential,
          ) => c.credentialId === cred.credentialId ? updatedCred : c),
        },
      };

      const saveRes = await storeActions.saveItem(updatedItem);
      if (!saveRes.success) {
        throw new Error(
          saveRes.error || t("fido2_error_counter_update_failed"),
        );
      }

      const { result } = await generatePasskeyAssertResponse(
        req.options,
        req.origin,
        cred,
        nextCounter,
      );

      // Resolve FIDO2 request in background
      await chrome.runtime.sendMessage({
        type: "RESOLVE_FIDO2_REQUEST",
        result,
      });

      window.close();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || t("fido2_error_assert_failed"));
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      await chrome.runtime.sendMessage({
        type: "REJECT_FIDO2_REQUEST",
        error: "NotAllowedError: User cancelled the request",
      });
    } catch (_e) {
      // Ignore
    }
    window.close();
  };

  return (
    <div class="fido2-prompt-container">
      {/* Bitwarden Brand Header */}
      <div class="fido2-header">
        <ShieldIcon class="fido2-logo" fill="var(--white)" />
        <span class="fido2-header-title">{APP_NAME}</span>
      </div>

      <div class="fido2-body">
        <Show
          when={store.isLocked}
          fallback={
            <div class="prompt-content">
              <Show when={error()}>
                <div class="alert alert-danger mb-16">{error()}</div>
                <Button variant="secondary" block onClick={handleReject}>
                  {t("btn_close")}
                </Button>
              </Show>

              <Show when={pendingReq()}>
                {/* 1. FIDO2 CREATE (Registration) */}
                <Show when={pendingReq()?.type === "create"}>
                  <div class="prompt-icon-wrapper">
                    <div class="fido2-large-icon bg-success">
                      <InfoIcon fill="var(--white)" />
                    </div>
                  </div>

                  <h2 class="prompt-title">{t("fido2_register_title")}</h2>

                  <Show
                    when={matchingAccounts().length > 0}
                    fallback={
                      <div
                        class="prompt-subtitle"
                        innerHTML={t("fido2_register_subtitle_new", {
                          rp: pendingReq()?.options.rp.name ||
                            pendingReq()?.options.rp.id || "",
                          user: pendingReq()?.options.user.name || "",
                        })}
                      />
                    }
                  >
                    <div
                      class="prompt-subtitle"
                      innerHTML={t("fido2_register_subtitle_choose", {
                        user: pendingReq()?.options.user.name || "",
                      })}
                    />
                  </Show>

                  <div class="passkey-list">
                    <For each={matchingAccounts()}>
                      {(item, idx) => (
                        <div
                          class={`passkey-item ${
                            selectedAccountIndex() === idx() ? "active" : ""
                          }`}
                          onClick={() => {
                            setSelectedAccountIndex(idx());
                            initPasskeyOptions(item);
                          }}
                        >
                          <div class="passkey-item-icon">
                            <LockIcon />
                          </div>
                          <div class="passkey-item-details">
                            <div class="passkey-username">
                              {item.login.username || t("detail_no_value")}
                            </div>
                            <div class="passkey-vault-name">{item.name}</div>
                          </div>
                          <div class="passkey-checkbox">
                            <div class="circle-check">
                              <Show when={selectedAccountIndex() === idx()}>
                                <div class="check-dot"></div>
                              </Show>
                            </div>
                          </div>
                        </div>
                      )}
                    </For>

                    {/* Option to create a new account */}
                    <div
                      class={`passkey-item ${
                        selectedAccountIndex() === null ? "active" : ""
                      }`}
                      onClick={() => {
                        setSelectedAccountIndex(null);
                        setSelectedPasskeyOption("add");
                      }}
                    >
                      <div class="passkey-item-icon">
                        <QuestionIcon />
                      </div>
                      <div class="passkey-item-details">
                        <div class="passkey-username">
                          {t("fido2_register_new_account")}
                        </div>
                        <div class="passkey-vault-name">
                          {t("fido2_register_new_account_sub")}
                        </div>
                      </div>
                      <div class="passkey-checkbox">
                        <div class="circle-check">
                          <Show when={selectedAccountIndex() === null}>
                            <div class="check-dot"></div>
                          </Show>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Show when={selectedAccountIndex() !== null}>
                    {(() => {
                      const account =
                        matchingAccounts()[selectedAccountIndex()!];
                      if (!account) return null;
                      const creds = account.login.fido2Credentials || [];
                      if (creds.length === 0) return null;

                      return (
                        <div class="passkey-options-section">
                          <div class="passkey-options-title">
                            {creds.length === 1
                              ? t("fido2_register_choose_passkey_action")
                              : t("fido2_register_choose_passkey_overwrite")}
                          </div>

                          <div class="passkey-list">
                            <Show
                              when={creds.length === 1}
                              fallback={
                                <>
                                  <For each={creds}>
                                    {(cred, cIdx) => (
                                      <div
                                        class={`passkey-item sub-item ${
                                          selectedPasskeyOption() ===
                                              cred.credentialId
                                            ? "active"
                                            : ""
                                        }`}
                                        onClick={() =>
                                          setSelectedPasskeyOption(
                                            cred.credentialId,
                                          )}
                                      >
                                        <div class="passkey-item-icon">
                                          <ShieldIcon />
                                        </div>
                                        <div class="passkey-item-details">
                                          <div class="passkey-username">
                                            {t("fido2_register_passkey_info", {
                                              index: cIdx() + 1,
                                              date: cred.creationDate
                                                ? formatDateTime(
                                                  cred.creationDate,
                                                )
                                                : "N/A",
                                            })}
                                          </div>
                                          <div class="passkey-vault-name">
                                            ID: {cred.credentialId.substring(
                                              0,
                                              16,
                                            )}...
                                          </div>
                                        </div>
                                        <div class="passkey-checkbox">
                                          <div class="circle-check">
                                            <Show
                                              when={selectedPasskeyOption() ===
                                                cred.credentialId}
                                            >
                                              <div class="check-dot"></div>
                                            </Show>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </For>
                                  <div
                                    class={`passkey-item sub-item ${
                                      selectedPasskeyOption() === "add"
                                        ? "active"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      setSelectedPasskeyOption("add")}
                                  >
                                    <div class="passkey-item-icon">
                                      <QuestionIcon />
                                    </div>
                                    <div class="passkey-item-details">
                                      <div class="passkey-username">
                                        {t("fido2_register_option_add")}
                                      </div>
                                      <div class="passkey-vault-name">
                                        {t("fido2_register_option_add_sub")}
                                      </div>
                                    </div>
                                    <div class="passkey-checkbox">
                                      <div class="circle-check">
                                        <Show
                                          when={selectedPasskeyOption() ===
                                            "add"}
                                        >
                                          <div class="check-dot"></div>
                                        </Show>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              }
                            >
                              <div
                                class={`passkey-item sub-item ${
                                  selectedPasskeyOption() ===
                                      creds[0].credentialId
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setSelectedPasskeyOption(
                                    creds[0].credentialId,
                                  )}
                              >
                                <div class="passkey-item-icon">
                                  <ShieldIcon />
                                </div>
                                <div class="passkey-item-details">
                                  <div class="passkey-username">
                                    {t("fido2_register_option_overwrite")}
                                  </div>
                                  <div class="passkey-vault-name">
                                    {t("fido2_register_passkey_info", {
                                      index: 1,
                                      date: creds[0].creationDate
                                        ? formatDateTime(creds[0].creationDate)
                                        : "N/A",
                                    })}
                                  </div>
                                </div>
                                <div class="passkey-checkbox">
                                  <div class="circle-check">
                                    <Show
                                      when={selectedPasskeyOption() ===
                                        creds[0].credentialId}
                                    >
                                      <div class="check-dot"></div>
                                    </Show>
                                  </div>
                                </div>
                              </div>

                              <div
                                class={`passkey-item sub-item ${
                                  selectedPasskeyOption() === "add"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() => setSelectedPasskeyOption("add")}
                              >
                                <div class="passkey-item-icon">
                                  <QuestionIcon />
                                </div>
                                <div class="passkey-item-details">
                                  <div class="passkey-username">
                                    {t("fido2_register_option_add")}
                                  </div>
                                  <div class="passkey-vault-name">
                                    {t("fido2_register_option_add_sub")}
                                  </div>
                                </div>
                                <div class="passkey-checkbox">
                                  <div class="circle-check">
                                    <Show
                                      when={selectedPasskeyOption() === "add"}
                                    >
                                      <div class="check-dot"></div>
                                    </Show>
                                  </div>
                                </div>
                              </div>
                            </Show>
                          </div>
                        </div>
                      );
                    })()}
                  </Show>

                  <div class="prompt-footer">
                    <Button
                      variant="secondary"
                      onClick={handleReject}
                      disabled={loading()}
                    >
                      {t("btn_cancel")}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleConfirmRegister}
                      loading={loading()}
                      loadingText={t("dialog_loading")}
                    >
                      {t("fido2_btn_save")}
                    </Button>
                  </div>
                </Show>

                {/* 2. FIDO2 GET (Assertion/Authentication) */}
                <Show when={pendingReq()?.type === "get"}>
                  <div class="prompt-icon-wrapper">
                    <div class="fido2-large-icon bg-primary">
                      <ShieldIcon fill="var(--white)" />
                    </div>
                  </div>

                  <h2 class="prompt-title">{t("fido2_assert_title")}</h2>

                  <Show
                    when={matchingCredentials().length === 0}
                    fallback={
                      <>
                        <div
                          class="prompt-subtitle"
                          innerHTML={t("fido2_assert_subtitle", {
                            rp: pendingReq()?.options.rpId || "",
                          })}
                        />

                        {/* Styled list of passkeys instead of select dropdown */}
                        <div class="passkey-list">
                          <For each={matchingCredentials()}>
                            {(item, idx) => (
                              <div
                                class={`passkey-item ${
                                  selectedCredIndex() === idx() ? "active" : ""
                                }`}
                                onClick={() => setSelectedCredIndex(idx())}
                              >
                                <div class="passkey-item-icon">
                                  <QuestionIcon />
                                </div>
                                <div class="passkey-item-details">
                                  <div class="passkey-username">
                                    {item.credential.userName}
                                  </div>
                                  <div class="passkey-vault-name">
                                    {item.vaultItemName}
                                  </div>
                                </div>
                                <div class="passkey-checkbox">
                                  <div class="circle-check">
                                    <Show when={selectedCredIndex() === idx()}>
                                      <div class="check-dot"></div>
                                    </Show>
                                  </div>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>

                        <div class="prompt-footer">
                          <Button
                            variant="secondary"
                            onClick={handleReject}
                            disabled={loading()}
                          >
                            {t("btn_cancel")}
                          </Button>
                          <Button
                            variant="primary"
                            onClick={handleConfirmAssert}
                            loading={loading()}
                            loadingText={t("dialog_loading")}
                          >
                            {t("fido2_assert_btn_confirm")}
                          </Button>
                        </div>
                      </>
                    }
                  >
                    <div
                      class="prompt-subtitle error-msg"
                      innerHTML={t("fido2_assert_no_match", {
                        rp: pendingReq()?.options.rpId || "",
                      })}
                    />
                    <div class="prompt-footer single-btn">
                      <Button variant="secondary" block onClick={handleReject}>
                        {t("btn_close")}
                      </Button>
                    </div>
                  </Show>
                </Show>
              </Show>
            </div>
          }
        >
          {/* Master password unlock inside FIDO2 window */}
          <div class="prompt-content">
            <div class="prompt-icon-wrapper">
              <div class="fido2-large-icon bg-warning">
                <LockIcon fill="var(--white)" />
              </div>
            </div>

            <h2 class="prompt-title">{t("fido2_vault_locked_title")}</h2>
            <p class="prompt-subtitle">
              {t("fido2_vault_locked_subtitle")}
            </p>

            <Show when={error()}>
              <div class="alert alert-danger alert-prompt-compact">
                {error()}
              </div>
            </Show>

            <form onSubmit={handleUnlock}>
              <div class="form-group text-left">
                <Input
                  type="password"
                  placeholder={t("login_placeholder_mp") + "..."}
                  value={masterPassword()}
                  onInput={(e) => setMasterPassword(e.currentTarget.value)}
                  disabled={loading()}
                  autofocus
                />
              </div>
              <div class="prompt-footer">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleReject}
                  disabled={loading()}
                >
                  {t("btn_cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading()}
                  loadingText={t("dialog_loading")}
                >
                  {t("login_btn_unlock")}
                </Button>
              </div>
            </form>
          </div>
        </Show>
      </div>
    </div>
  );
};
export default Fido2Prompt;
