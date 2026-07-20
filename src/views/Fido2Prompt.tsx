import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { store } from "@/shared/store.ts";
import { unlock } from "@/shared/auth-service.ts";
import {
  APP_NAME,
  MSG_FIDO2_HEARTBEAT,
  MSG_GET_PENDING_FIDO2_REQUEST,
} from "@/shared/constants.ts";
import {
  GetPendingFido2RequestResponseSchema,
  type LoginVaultItem,
} from "@/shared/types.ts";
import {
  findMatchingFido2Accounts,
  findMatchingFido2Credentials,
  registerFido2Passkey,
  assertFido2Passkey,
  rejectFido2Request,
  type Fido2Request,
  type MatchingPasskey,
} from "@/shared/fido2-service.ts";
import Button from "@/components/Button.tsx";
import Input from "@/components/Input.tsx";
import {
  InfoIcon,
  LockIcon,
  QuestionIcon,
  ShieldIcon,
} from "@/icons/svg/index.ts";
import { formatDateTime, isTranslationKey, t } from "@/shared/i18n.ts";
import PasskeySelectRow from "@/components/PasskeySelectRow.tsx";


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

    // Set up heartbeat timer to keep Background Service Worker alive
    const timer = setInterval(() => {
      chrome.runtime.sendMessage({ type: MSG_FIDO2_HEARTBEAT }).catch(() => {});
    }, 5000);

    onCleanup(() => {
      clearInterval(timer);
    });
  });

  const findMatchingAccounts = (
    rpId: string,
    origin: string,
  ) => {
    const matches = findMatchingFido2Accounts(store.vaultItems, rpId, origin);
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
      const rawRes = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { type: MSG_GET_PENDING_FIDO2_REQUEST },
          resolve,
        );
      });
      const res = GetPendingFido2RequestResponseSchema.parse(rawRes);

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
          const rpId = res.options.rp?.id || res.options.rp?.name || "";
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
    const list = findMatchingFido2Credentials(store.vaultItems, rpId);
    setMatchingCredentials(list);
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
      const res = await unlock(masterPassword());
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
      const res = await registerFido2Passkey(
        req,
        selectedAccountIndex(),
        matchingAccounts(),
        selectedPasskeyOption()
      );
      
      if (!res.success) {
        const errMsg = res.error ? (isTranslationKey(res.error) ? t(res.error) : res.error) : t("fido2_error_create_failed");
        throw new Error(errMsg);
      }

      window.close();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || t("fido2_error_create_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAssert = async () => {
    const req = pendingReq();
    if (!req || matchingCredentials().length === 0) return;
    setLoading(true);
    setError("");

    try {
      const res = await assertFido2Passkey(
        req,
        matchingCredentials(),
        selectedCredIndex()
      );

      if (!res.success) {
        const errMsg = res.error ? (isTranslationKey(res.error) ? t(res.error) : res.error) : t("fido2_error_assert_failed");
        throw new Error(errMsg);
      }

      window.close();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || t("fido2_error_assert_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    await rejectFido2Request();
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
                          rp: pendingReq()?.options.rp?.name ||
                            pendingReq()?.options.rp?.id || "",
                          user: pendingReq()?.options.user?.name || "",
                        })}
                      />
                    }
                  >
                    <div
                      class="prompt-subtitle"
                      innerHTML={t("fido2_register_subtitle_choose", {
                        user: pendingReq()?.options.user?.name || "",
                      })}
                    />
                  </Show>

                  <div class="passkey-list">
                    <For each={matchingAccounts()}>
                      {(item, idx) => (
                        <PasskeySelectRow
                          icon={<LockIcon />}
                          title={item.login.username || t("detail_no_value")}
                          subtitle={item.name}
                          active={selectedAccountIndex() === idx()}
                          onClick={() => {
                            setSelectedAccountIndex(idx());
                            initPasskeyOptions(item);
                          }}
                        />
                      )}
                    </For>

                    {/* Option to create a new account */}
                    <PasskeySelectRow
                      icon={<QuestionIcon />}
                      title={t("fido2_register_new_account")}
                      subtitle={t("fido2_register_new_account_sub")}
                      active={selectedAccountIndex() === null}
                      onClick={() => {
                        setSelectedAccountIndex(null);
                        setSelectedPasskeyOption("add");
                      }}
                    />
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
                                      <PasskeySelectRow
                                        icon={<ShieldIcon />}
                                        title={t(
                                          "fido2_register_passkey_info",
                                          {
                                            index: cIdx() + 1,
                                            date: cred.creationDate
                                              ? formatDateTime(
                                                cred.creationDate,
                                              )
                                              : "N/A",
                                          },
                                        )}
                                        subtitle={`ID: ${
                                          cred.credentialId.substring(0, 16)
                                        }...`}
                                        active={selectedPasskeyOption() ===
                                          cred.credentialId}
                                        subItem={true}
                                        onClick={() =>
                                          setSelectedPasskeyOption(
                                            cred.credentialId,
                                          )}
                                      />
                                    )}
                                  </For>
                                  <PasskeySelectRow
                                    icon={<QuestionIcon />}
                                    title={t("fido2_register_option_add")}
                                    subtitle={t(
                                      "fido2_register_option_add_sub",
                                    )}
                                    active={selectedPasskeyOption() === "add"}
                                    subItem={true}
                                    onClick={() =>
                                      setSelectedPasskeyOption("add")}
                                  />
                                </>
                              }
                            >
                              <PasskeySelectRow
                                icon={<ShieldIcon />}
                                title={t("fido2_register_option_overwrite")}
                                subtitle={t("fido2_register_passkey_info", {
                                  index: 1,
                                  date: creds[0].creationDate
                                    ? formatDateTime(creds[0].creationDate)
                                    : "N/A",
                                })}
                                active={selectedPasskeyOption() ===
                                  creds[0].credentialId}
                                subItem={true}
                                onClick={() =>
                                  setSelectedPasskeyOption(
                                    creds[0].credentialId,
                                  )}
                              />

                              <PasskeySelectRow
                                icon={<QuestionIcon />}
                                title={t("fido2_register_option_add")}
                                subtitle={t("fido2_register_option_add_sub")}
                                active={selectedPasskeyOption() === "add"}
                                subItem={true}
                                onClick={() => setSelectedPasskeyOption("add")}
                              />
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
                              <PasskeySelectRow
                                icon={<QuestionIcon />}
                                title={item.credential.userName || ""}
                                subtitle={item.vaultItemName}
                                active={selectedCredIndex() === idx()}
                                onClick={() => setSelectedCredIndex(idx())}
                              />
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
