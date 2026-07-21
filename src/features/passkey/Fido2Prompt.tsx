import {
  type Component,
  createEffect,
  createSignal,
  For,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { Result } from "neverthrow";
import { store } from "@/core/store.ts";
import { unlock } from "@/features/auth/auth-service.ts";
import { unlockWithPin } from "@/features/auth/pin-service.ts";
import { setGlobalLoading } from "@/core/ui-service.ts";
import {
  APP_NAME,
  MSG_FIDO2_HEARTBEAT,
  MSG_GET_PENDING_FIDO2_REQUEST,
} from "@/core/constants.ts";
import { notifyBackground, sendMessageToBackground } from "@/core/messaging.ts";
import {
  GetPendingFido2RequestResponseSchema,
  type LoginVaultItem,
} from "@/core/types.ts";
import {
  assertFido2Passkey,
  type Fido2Request,
  findMatchingFido2Accounts,
  findMatchingFido2Credentials,
  type MatchingPasskey,
  registerFido2Passkey,
  rejectFido2Request,
} from "@/features/passkey/fido2-service.ts";
import Button from "@/components/ui/Button.tsx";
import Input from "@/components/ui/Input.tsx";
import {
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
  LockIcon,
  QuestionIcon,
  ShieldIcon,
} from "@/icons/svg/index.ts";
import { formatDateTime, t } from "@/core/i18n.ts";
import PasskeySelectRow from "@/features/passkey/PasskeySelectRow.tsx";

export const Fido2Prompt: Component = () => {
  const [masterPassword, setMasterPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [pendingReq, setPendingReq] = createSignal<Fido2Request | null>(null);
  const [viewMode, setViewMode] = createSignal<"pin" | "masterPassword">(
    "masterPassword",
  );
  const [pin, setPin] = createSignal("");
  const [showPin, setShowPin] = createSignal(false);

  createEffect(() => {
    if (store.isLoaded) {
      if (store.pinUnlockEnabled) {
        if (store.requireMasterPasswordOnRestart) {
          setViewMode(store.sessionUnlocked ? "pin" : "masterPassword");
        } else {
          setViewMode("pin");
        }
      } else {
        setViewMode("masterPassword");
      }
    }
  });

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
      notifyBackground({ type: MSG_FIDO2_HEARTBEAT });
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
    const sendResult = await sendMessageToBackground({
      type: MSG_GET_PENDING_FIDO2_REQUEST,
    });
    if (sendResult.isErr()) {
      setError(t("fido2_error_load_failed"));
      return;
    }

    const parsed = GetPendingFido2RequestResponseSchema.safeParse(
      sendResult.value,
    );
    if (!parsed.success) {
      setError(t("fido2_error_load_failed"));
      return;
    }

    const res = parsed.data;

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
          const safeParseUrl = Result.fromThrowable(
            (u: string) => new URL(u),
            () => new Error(),
          );
          const parseResult = safeParseUrl(res.origin);
          rpId = parseResult.map((u) => u.hostname).unwrapOr(res.origin);
        }
        findMatchingPasskeys(rpId);
      } else if (res.type === "create") {
        const rpId = res.options.rp?.id || res.options.rp?.name || "";
        findMatchingAccounts(rpId, res.origin);
      }
    } else {
      setError(res?.error || t("fido2_error_no_request"));
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
    setGlobalLoading(true);
    setError("");
    const result = await unlock(masterPassword());

    if (result.isOk()) {
      setMasterPassword("");
      await loadPendingRequest();
    } else {
      setError(t(result.error));
    }

    setGlobalLoading(false);
  };

  const handlePinUnlock = async (e: Event) => {
    e.preventDefault();
    if (!pin().trim()) {
      return;
    }
    setGlobalLoading(true);
    setError("");
    const res = await unlockWithPin(pin().trim());
    if (res.isOk()) {
      setPin("");
      await loadPendingRequest();
    } else {
      setError(t(res.error));
    }
    setGlobalLoading(false);
  };

  const handleConfirmRegister = async () => {
    const req = pendingReq();
    if (!req) return;
    setGlobalLoading(true);
    setError("");

    const res = await registerFido2Passkey(
      req,
      selectedAccountIndex(),
      matchingAccounts(),
      selectedPasskeyOption(),
    );

    if (res.isErr()) {
      setError(t(res.error));
    } else {
      window.close();
    }
    setGlobalLoading(false);
  };

  const handleConfirmAssert = async () => {
    const req = pendingReq();
    if (!req || matchingCredentials().length === 0) return;
    setGlobalLoading(true);
    setError("");

    const res = await assertFido2Passkey(
      req,
      matchingCredentials(),
      selectedCredIndex(),
    );

    if (res.isErr()) {
      setError(t(res.error));
    } else {
      window.close();
    }
    setGlobalLoading(false);
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
                    >
                      {t("btn_cancel")}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleConfirmRegister}
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
                          >
                            {t("btn_cancel")}
                          </Button>
                          <Button
                            variant="primary"
                            onClick={handleConfirmAssert}
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
          {/* Vault locked screen inside FIDO2 window */}
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

            <Switch>
              <Match when={viewMode() === "pin"}>
                <form
                  onSubmit={handlePinUnlock}
                  class="flex-1 d-flex flex-column"
                >
                  <div class="form-group text-left pos-relative">
                    <div class="pos-relative d-flex align-items-center">
                      <Input
                        type={showPin() ? "text" : "password"}
                        placeholder={t("login_pin_placeholder")}
                        value={pin()}
                        onInput={(e) => setPin(e.currentTarget.value)}
                        autofocus
                        required
                        rightActions={
                          <button
                            type="button"
                            class="action-btn input-action-btn"
                            onClick={() => setShowPin(!showPin())}
                          >
                            <Show
                              fallback={<EyeIcon class="icon-inline" />}
                              when={showPin()}
                            >
                              <EyeOffIcon class="icon-inline" />
                            </Show>
                          </button>
                        }
                      />
                    </div>
                  </div>

                  <div class="text-center mt-8 mb-12">
                    <a
                      href="#"
                      class="forgot-pass-link font-sz-12"
                      onClick={(e) => {
                        e.preventDefault();
                        setViewMode("masterPassword");
                      }}
                    >
                      {t("login_unlock_with_mp")}
                    </a>
                  </div>

                  <div class="prompt-footer">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleReject}
                    >
                      {t("btn_cancel")}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                    >
                      {t("login_btn_unlock")}
                    </Button>
                  </div>
                </form>
              </Match>

              <Match when={viewMode() === "masterPassword"}>
                <form onSubmit={handleUnlock} class="flex-1 d-flex flex-column">
                  <div class="form-group text-left">
                    <Input
                      type="password"
                      placeholder={t("login_placeholder_mp") + "..."}
                      value={masterPassword()}
                      onInput={(e) => setMasterPassword(e.currentTarget.value)}
                      autofocus
                      required
                    />
                  </div>

                  <Show when={store.pinUnlockEnabled}>
                    <div class="text-center mt-8 mb-12">
                      <a
                        href="#"
                        class="forgot-pass-link font-sz-12"
                        onClick={(e) => {
                          e.preventDefault();
                          setViewMode("pin");
                        }}
                      >
                        {t("login_unlock_with_pin")}
                      </a>
                    </div>
                  </Show>

                  <div class="prompt-footer">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleReject}
                    >
                      {t("btn_cancel")}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                    >
                      {t("login_btn_unlock")}
                    </Button>
                  </div>
                </form>
              </Match>
            </Switch>
          </div>
        </Show>
      </div>
    </div>
  );
};
export default Fido2Prompt;
