import { createSignal, onMount, type Component, Show, For } from "solid-js";
import { store, storeActions } from "@/shared/store.ts";
import {
  createPasskeyKeyPair,
  bufferToBase64Url,
  base64UrlToBuffer,
  generateAuthData,
  packAttestationObject,
  generateAssertionSignature,
  getRawCredentialId,
} from "@/shared/passkey-crypto.ts";
import { type Fido2Credential, type VaultItem, type LoginVaultItem, VaultItemType } from "@/shared/types.ts";
import Button from "./Button.tsx";
import Input from "./Input.tsx";
import { ShieldIcon, InfoIcon, QuestionIcon, LockIcon } from "@/icons/svg/index.ts";

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
  const [matchingCredentials, setMatchingCredentials] = createSignal<MatchingPasskey[]>([]);
  const [selectedCredIndex, setSelectedCredIndex] = createSignal(0);

  // List of matching accounts found in vault for registration (create)
  const [matchingAccounts, setMatchingAccounts] = createSignal<LoginVaultItem[]>([]);
  const [selectedAccountIndex, setSelectedAccountIndex] = createSignal<number | null>(null);

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

  const findMatchingAccounts = (rpId: string, origin: string, userName: string) => {
    const rpIdNormalized = rpId.toLowerCase().trim();
    const originHost = getDomainFromUrl(origin);
    const usernameNormalized = userName.toLowerCase().trim();

    const matches = store.vaultItems.filter((item): item is LoginVaultItem => {
      if (item.type !== VaultItemType.Login || !item.login) return false;
      
      // Match username (must match)
      const itemUser = (item.login.username || "").toLowerCase().trim();
      if (itemUser !== usernameNormalized) return false;

      // Match domain / RP ID
      // Check URIs
      if (item.login.uris) {
        const hasMatchingUri = item.login.uris.some(u => {
          const uriHost = getDomainFromUrl(u.uri);
          return uriHost.includes(rpIdNormalized) || 
                 rpIdNormalized.includes(uriHost) ||
                 uriHost.includes(originHost) ||
                 originHost.includes(uriHost);
        });
        if (hasMatchingUri) return true;
      }

      // Check name
      const itemName = item.name.toLowerCase().trim();
      if (itemName.includes(rpIdNormalized) || rpIdNormalized.includes(itemName)) {
        return true;
      }

      return false;
    });

    setMatchingAccounts(matches);
    if (matches.length > 0) {
      setSelectedAccountIndex(0);
    } else {
      setSelectedAccountIndex(null);
    }
  };

  const loadPendingRequest = async () => {
    try {
      const res = await new Promise<{ success: boolean; type?: "create" | "get"; options?: Fido2Request["options"]; origin?: string; error?: string }>((resolve) => {
        chrome.runtime.sendMessage({ type: "GET_PENDING_FIDO2_REQUEST" }, resolve);
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
          findMatchingAccounts(rpId, res.origin, res.options.user.name);
        }
      } else {
        setError(res.error || "Không có yêu cầu xác thực nào đang chờ xử lý.");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Lỗi tải yêu cầu xác thực");
    }
  };

  const findMatchingPasskeys = (rpId: string) => {
    const list: MatchingPasskey[] = [];
    console.log("[Gistwarden FIDO2] Bat dau tim kiem Passkey khop voi rpId:", rpId);
    console.log("[Gistwarden FIDO2] So luong tai khoan trong ket sat:", store.vaultItems.length);
    
    store.vaultItems.forEach((item) => {
      if (item.type !== VaultItemType.Login) return;
      console.log(`[Gistwarden FIDO2] Kiem tra tai khoan "${item.name}":`, {
        hasLogin: !!item.login,
        fido2CredentialsCount: item.login?.fido2Credentials?.length || 0,
        fido2Credentials: item.login?.fido2Credentials
      });
      if (item.login?.fido2Credentials) {
        item.login.fido2Credentials.forEach((cred: Fido2Credential) => {
          console.log(`[Gistwarden FIDO2] So sanh rpId: "${cred.rpId}" voi "${rpId}"`);
          if (cred.rpId?.trim().toLowerCase() === rpId?.trim().toLowerCase()) {
            console.log("[Gistwarden FIDO2] KHOP THANH CONG!");
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
    console.log("[Gistwarden FIDO2] Ket qua danh sach Passkey khop:", list);
  };

  const handleUnlock = async (e: Event) => {
    e.preventDefault();
    if (!masterPassword()) {
      setError("Vui lòng nhập Mật khẩu Master");
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
        setError(res.error || "Mật khẩu Master không đúng");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Lỗi mở khóa");
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
      const options = req.options;
      const origin = req.origin;

      // 1. Create ECDSA keypair
      const keyPair = await createPasskeyKeyPair();

      // 2. Export private key in pkcs8 format to store in Vault
      const pkcs8KeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
      const pkcs8Base64Url = bufferToBase64Url(new Uint8Array(pkcs8KeyBuffer));

      // 3. Export public key in spki format
      const spkiKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
      const spkiBase64Url = bufferToBase64Url(new Uint8Array(spkiKeyBuffer));

      // 4. Generate credentialId (standard random UUID)
      const credentialIdStr = crypto.randomUUID();
      const credentialIdBytes = getRawCredentialId(credentialIdStr);
      const credIdBase64Url = bufferToBase64Url(credentialIdBytes);

      const creationDate = new Date().toISOString();

      // 5. Build Gistwarden Fido2Credential object
      const newCred: Fido2Credential = {
        credentialId: credentialIdStr,
        keyType: "public-key",
        keyAlgorithm: "ECDSA",
        keyCurve: "P-256",
        keyValue: pkcs8Base64Url,
        rpId: options.rp.id || options.rp.name,
        userHandle: options.user.id,
        userName: options.user.name,
        counter: 0,
        rpName: options.rp.name,
        userDisplayName: options.user.displayName,
        discoverable: true,
        creationDate,
      };

      // 6. Save new credential to Vault
      let saveRes;
      const idx = selectedAccountIndex();
      if (idx !== null && matchingAccounts()[idx]) {
        const existingItem = matchingAccounts()[idx];
        const updatedItem: Partial<LoginVaultItem> = {
          id: existingItem.id,
          type: VaultItemType.Login,
          login: {
            ...existingItem.login,
            fido2Credentials: [newCred],
          },
        };
        saveRes = await storeActions.saveItem(updatedItem);
      } else {
        const newItem: Partial<VaultItem> = {
          name: options.rp.name || options.rp.id,
          type: 1, // Login
          login: {
            username: options.user.name,
            password: "",
            uris: [{ uri: origin }],
            fido2Credentials: [newCred],
          },
        };
        saveRes = await storeActions.saveItem(newItem);
      }

      if (!saveRes.success) {
        throw new Error(saveRes.error || "Không thể lưu Passkey vào két sắt");
      }

      // 7. Generate authData and CBOR attestationObject
      const authData = await generateAuthData({
        rpId: options.rp.id || options.rp.name,
        credentialId: credentialIdBytes,
        counter: 0,
        userPresent: true,
        userVerified: true,
        publicKey: keyPair.publicKey,
      });

      const clientDataJSON = JSON.stringify({
        type: "webauthn.create",
        challenge: options.challenge,
        origin,
        crossOrigin: false,
      });

      const result = {
        id: credIdBase64Url,
        rawId: credIdBase64Url,
        response: {
          clientDataJSON: bufferToBase64Url(new TextEncoder().encode(clientDataJSON)),
          attestationObject: bufferToBase64Url(packAttestationObject(authData)),
          publicKey: spkiBase64Url,
          publicKeyAlgorithm: -7, // ES256
          authData: bufferToBase64Url(authData),
        },
      };

      // 8. Resolve FIDO2 request in background
      await chrome.runtime.sendMessage({
        type: "RESOLVE_FIDO2_REQUEST",
        result,
      });

      window.close();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Lỗi tạo Passkey");
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
      const options = req.options;
      const origin = req.origin;

      // 1. Import ECDSA private key from base64url PKCS#8 stored in Vault
      const pkcs8KeyBuffer = base64UrlToBuffer(cred.keyValue);
      const keyData = pkcs8KeyBuffer.buffer;
      if (!(keyData instanceof ArrayBuffer)) {
        throw new Error("Expected ArrayBuffer for key data");
      }
      const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        keyData,
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        true,
        ["sign"]
      );

      // 2. Increment credential counter
      // De tranh loi Replay Protection cua may chu (nhu GitHub) khi counter nhap khau bi thap hon counter thuc te tren server,
      // chung ta gán counter toi thieu la 100,000.
      const nextCounter = Math.max(cred.counter + 1, 100000);
      
      // Update item in Vault
      const updatedCred: Fido2Credential = {
        ...cred,
        counter: nextCounter,
      };

      const originalItem = store.vaultItems.find(v => v.id === selected.vaultItemId);
      if (!originalItem || originalItem.type !== VaultItemType.Login || !originalItem.login) {
        throw new Error("Vault item not found");
      }
      
      const updatedItem: LoginVaultItem = {
        ...originalItem,
        type: VaultItemType.Login,
        login: {
          ...originalItem.login,
          fido2Credentials: (originalItem.login.fido2Credentials || []).map((c: Fido2Credential) => 
            c.credentialId === cred.credentialId ? updatedCred : c
          ),
        },
      };

      const saveRes = await storeActions.saveItem(updatedItem);
      if (!saveRes.success) {
        throw new Error(saveRes.error || "Không thể cập nhật số lần sử dụng Passkey");
      }

      // 3. Construct assertion data
      const clientDataJSON = JSON.stringify({
        type: "webauthn.get",
        challenge: options.challenge,
        origin,
        crossOrigin: false,
      });

      const clientDataJSONBytes = new TextEncoder().encode(clientDataJSON);
      const clientDataHash = new Uint8Array(await crypto.subtle.digest("SHA-256", clientDataJSONBytes));

      // Lay tuy chon yeu cau xac thuc tu options. Mac dinh la true do nguoi dung da mo khoa bang Master Password
      const userVerified = options.userVerification !== "discouraged";

      let rpId = options.rpId;
      if (!rpId) {
        try {
          rpId = new URL(origin).hostname;
        } catch (_) {
          rpId = origin;
        }
      }

      const authData = await generateAuthData({
        rpId,
        counter: nextCounter,
        userPresent: true,
        userVerified,
      });

      const signature = await generateAssertionSignature(authData, clientDataHash, privateKey);

      // Tu dong tuong thich nguoc: Kiem tra xem trang web dang yeu cau dinh dang ID nao
      // - Neu yeu cau chuoi ASCII UUID 36 ky tu (co che cu), chung ta tra ve dinh dang do.
      // - Mac dinh dung 16-byte raw UUID (co che moi chuan WebAuthn).
      const b64_36 = bufferToBase64Url(new TextEncoder().encode(cred.credentialId));

      const useOld36ByteFormat = (options.allowCredentials || []).some(
        (allowed: { id: string }) => allowed.id === b64_36
      );

      const rawCredId = useOld36ByteFormat
        ? new TextEncoder().encode(cred.credentialId)
        : getRawCredentialId(cred.credentialId);
      const credIdBase64Url = useOld36ByteFormat ? b64_36 : bufferToBase64Url(rawCredId);

      const result = {
        id: credIdBase64Url,
        rawId: credIdBase64Url,
        response: {
          clientDataJSON: bufferToBase64Url(clientDataJSONBytes),
          authenticatorData: bufferToBase64Url(authData),
          signature: bufferToBase64Url(signature),
          userHandle: cred.userHandle || null,
        },
      };

      // 4. Resolve FIDO2 request in background
      await chrome.runtime.sendMessage({
        type: "RESOLVE_FIDO2_REQUEST",
        result,
      });

      window.close();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Lỗi xác thực Passkey");
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
        <span class="fido2-header-title">Gistwarden</span>
      </div>

      <div class="fido2-body">
        <Show when={store.isLocked} fallback={
          <div class="prompt-content">
            <Show when={error()}>
              <div class="alert alert-danger mb-16">{error()}</div>
              <Button variant="secondary" block onClick={handleReject}>Đóng cửa sổ</Button>
            </Show>

            <Show when={pendingReq()}>
              {/* 1. FIDO2 CREATE (Registration) */}
              <Show when={pendingReq()?.type === "create"}>
                <div class="prompt-icon-wrapper">
                  <div class="fido2-large-icon bg-success">
                    <InfoIcon fill="var(--white)" />
                  </div>
                </div>
                
                <h2 class="prompt-title">Đăng ký Passkey mới</h2>
                
                <Show when={matchingAccounts().length > 0} fallback={
                  <div class="prompt-subtitle">
                    Ứng dụng <strong>{pendingReq()?.options.rp.name}</strong> muốn lưu Passkey cho tài khoản <strong>{pendingReq()?.options.user.name}</strong>. Gistwarden sẽ tạo một tài khoản mới để lưu trữ Passkey này.
                  </div>
                }>
                  <div class="prompt-subtitle">
                    Chọn tài khoản để lưu trữ Passkey cho <strong>{pendingReq()?.options.user.name}</strong>:
                  </div>

                  <div class="passkey-list">
                    <For each={matchingAccounts()}>
                      {(item, idx) => (
                        <div 
                          class={`passkey-item ${selectedAccountIndex() === idx() ? 'active' : ''}`}
                          onClick={() => setSelectedAccountIndex(idx())}
                        >
                          <div class="passkey-item-icon">
                            <LockIcon />
                          </div>
                          <div class="passkey-item-details">
                            <div class="passkey-username">{item.login?.username || "Không có tên đăng nhập"}</div>
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
                      class={`passkey-item ${selectedAccountIndex() === null ? 'active' : ''}`}
                      onClick={() => setSelectedAccountIndex(null)}
                    >
                      <div class="passkey-item-icon">
                        <QuestionIcon />
                      </div>
                      <div class="passkey-item-details">
                        <div class="passkey-username">Tạo tài khoản mới</div>
                        <div class="passkey-vault-name">Lưu như một tài khoản riêng biệt</div>
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
                </Show>

                <div class="prompt-footer">
                  <Button variant="secondary" onClick={handleReject} disabled={loading()}>
                    Hủy bỏ
                  </Button>
                  <Button variant="primary" onClick={handleConfirmRegister} loading={loading()} loadingText="Đang lưu...">
                    Lưu Passkey
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

                <h2 class="prompt-title">Yêu cầu đăng nhập</h2>
                
                <Show when={matchingCredentials().length === 0} fallback={
                  <>
                    <div class="prompt-subtitle">
                      Chọn một tài khoản Passkey đã lưu cho <strong>{pendingReq()?.options.rpId}</strong> để đăng nhập:
                    </div>

                    {/* Styled list of passkeys instead of select dropdown */}
                    <div class="passkey-list">
                      <For each={matchingCredentials()}>
                        {(item, idx) => (
                          <div 
                             class={`passkey-item ${selectedCredIndex() === idx() ? 'active' : ''}`}
                            onClick={() => setSelectedCredIndex(idx())}
                          >
                            <div class="passkey-item-icon">
                              <QuestionIcon />
                            </div>
                            <div class="passkey-item-details">
                              <div class="passkey-username">{item.credential.userName}</div>
                              <div class="passkey-vault-name">{item.vaultItemName}</div>
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
                      <Button variant="secondary" onClick={handleReject} disabled={loading()}>
                        Hủy bỏ
                      </Button>
                      <Button variant="primary" onClick={handleConfirmAssert} loading={loading()} loadingText="Đang xác thực...">
                        Xác nhận đăng nhập
                      </Button>
                    </div>
                  </>
                }>
                  <div class="prompt-subtitle error-msg">
                    Không tìm thấy Passkey nào khớp cho tên miền <strong>{pendingReq()?.options.rpId}</strong> trong két sắt của bạn.
                  </div>
                  <div class="prompt-footer single-btn">
                    <Button variant="secondary" block onClick={handleReject}>
                      Đóng cửa sổ
                    </Button>
                  </div>
                </Show>
              </Show>
            </Show>
          </div>
        }>
          {/* Master password unlock inside FIDO2 window */}
          <div class="prompt-content">
            <div class="prompt-icon-wrapper">
              <div class="fido2-large-icon bg-warning">
                <LockIcon fill="var(--white)" />
              </div>
            </div>
            
            <h2 class="prompt-title">Két sắt đang Khóa</h2>
            <p class="prompt-subtitle">Mở khóa Gistwarden bằng mật khẩu Master để tiếp tục xác thực Passkey.</p>

            <Show when={error()}>
              <div class="alert alert-danger alert-prompt-compact">{error()}</div>
            </Show>

            <form onSubmit={handleUnlock}>
              <div class="form-group text-left">
                <Input
                  type="password"
                  placeholder="Mật khẩu Master..."
                  value={masterPassword()}
                  onInput={(e) => setMasterPassword(e.currentTarget.value)}
                  disabled={loading()}
                  autofocus
                />
              </div>
              <div class="prompt-footer">
                <Button type="button" variant="secondary" onClick={handleReject} disabled={loading()}>
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="primary" loading={loading()} loadingText="Mở khóa...">
                  Mở khóa
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
