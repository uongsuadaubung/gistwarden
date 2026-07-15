import { createSignal, type Component, Show, createEffect } from "solid-js";
import { store, storeActions } from "@/shared/store.ts";
import Button from "./Button.tsx";
import Input from "./Input.tsx";
import { LockIcon, GithubIcon, ChevronDownIcon } from "@/icons/svg/index.ts";

export const Login: Component = () => {
  const [token, setToken] = createSignal("");
  const [masterPassword, setMasterPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  // OAuth states
  const [loginMethod, setLoginMethod] = createSignal<"oauth" | "pat">("oauth");
  const [clientId, setClientId] = createSignal(store.oauthClientId || "");
  const [workerUrl, setWorkerUrl] = createSignal(store.oauthWorkerUrl || "");
  const [showConfig, setShowConfig] = createSignal(false);

  createEffect(() => {
    if (store.oauthClientId) setClientId(store.oauthClientId);
    if (store.oauthWorkerUrl) setWorkerUrl(store.oauthWorkerUrl);
  });

  const handleSaveToken = async (e: Event) => {
    e.preventDefault();
    if (!token().trim()) {
      setError("Vui lòng nhập Personal Access Token");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await storeActions.setupGithub(token().trim());
      if (!res.success) {
        setError(res.error || "Token không hợp lệ hoặc lỗi kết nối");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubOauth = async () => {
    const cId = clientId().trim();
    const wUrl = workerUrl().trim();

    if (!cId || !wUrl) {
      setError("Vui lòng mở mục 'Cấu hình OAuth' để nhập Client ID và Worker URL trước khi đăng nhập.");
      setShowConfig(true);
      return;
    }

    setLoading(true);
    setError("");
    try {
      // 1. Save OAuth config locally
      await storeActions.saveOauthConfig(cId, wUrl);

      // 2. Call background script to launch web auth flow
      const oauthRes = await new Promise<{ success: boolean; token?: string; error?: string }>((resolve) => {
        chrome.runtime.sendMessage({
          type: "START_GITHUB_OAUTH",
          content: cId,
          token: wUrl
        }, resolve);
      });

      if (!oauthRes.success || !oauthRes.token) {
        throw new Error(oauthRes.error || "Không nhận được token từ GitHub");
      }

      // 3. Setup GitHub with the obtained token
      const res = await storeActions.setupGithub(oauthRes.token);
      if (!res.success) {
        setError(res.error || "Token không hợp lệ hoặc lỗi kết nối");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Lỗi đăng nhập OAuth");
    } finally {
      setLoading(false);
    }
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
        // If from FIDO2 Prompt, we will stay in FIDO2 Prompt View, otherwise storeActions automatically navigates to Vault
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

  const handleResetToken = () => {
    setError("");
    storeActions.logout();
  };

  return (
    <div class="app-body justify-center h-full">
      <div class="text-center mb-24">
        <LockIcon class="login-header-logo" />
        <h2 class="login-brand-title">Gistwarden</h2>
        <p class="login-subtitle">
          <Show when={store.githubToken} fallback="Cấu hình bộ lưu trữ đám mây GitHub Gist">
            Két sắt đang bị Khóa
          </Show>
        </p>
      </div>

      <Show when={error()}>
        <div class="alert alert-danger mb-16">{error()}</div>
      </Show>

      <Show when={store.githubToken} fallback={
        <div class="card mb-0 p-16">
          {/* Method Tabs */}
          <div class="tabs-container login-tabs mb-16">
            <div 
              onClick={() => setLoginMethod("oauth")} 
              class={`login-tab-btn ${loginMethod() === "oauth" ? "active" : ""}`}
            >
              Đăng nhập GitHub (OAuth)
            </div>
            <div 
              onClick={() => setLoginMethod("pat")} 
              class={`login-tab-btn ${loginMethod() === "pat" ? "active" : ""}`}
            >
              Dùng Token (PAT)
            </div>
          </div>

          <Show when={loginMethod() === "oauth"} fallback={
            <form onSubmit={handleSaveToken} class="mb-0">
              <div class="form-group">
                <label for="github-token">GitHub Personal Access Token (PAT)</label>
                <Input
                  id="github-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token()}
                  onInput={(e) => setToken(e.currentTarget.value)}
                  disabled={loading()}
                />
                <span class="login-pat-help">
                  Token cần có quyền truy cập <strong>gist</strong>. Tiện ích sẽ tạo một Gist bí mật (secret gist) để lưu trữ két sắt đã mã hóa của bạn.
                </span>
              </div>

              <Button type="submit" variant="primary" block loading={loading()} loadingText="Đang xác thực...">
                Kết nối GitHub (PAT)
              </Button>
            </form>
          }>
            <div>
              <div class="text-center mb-16">
                <p class="login-oauth-help">
                  Kết nối tự động và an toàn với tài khoản GitHub của bạn để đồng bộ két sắt tự động qua Cloudflare Worker Proxy riêng tư của bạn.
                </p>
                
                <Button variant="primary" block onClick={handleGithubOauth} loading={loading()} loadingText="Đang kết nối...">
                  <GithubIcon class="github-btn-icon" />
                  Đăng nhập bằng GitHub
                </Button>
              </div>
              
              <div class="login-oauth-config-footer">
                <div 
                  onClick={() => setShowConfig(!showConfig())} 
                  class="oauth-config-toggle"
                >
                  <span>{showConfig() ? "Ẩn cấu hình OAuth" : "Hiện cấu hình OAuth"}</span>
                  <ChevronDownIcon class={`oauth-config-chevron ${showConfig() ? "open" : ""}`} />
                </div>
                
                <Show when={showConfig()}>
                  <div class="oauth-config-box">
                    <div class="form-group mb-8 text-left">
                      <label for="oauth-client-id" class="login-config-label">Client ID của GitHub App</label>
                      <Input
                        id="oauth-client-id"
                        type="text"
                        class="login-config-input"
                        placeholder="Nhập Client ID..."
                        value={clientId()}
                        onInput={(e) => setClientId(e.currentTarget.value)}
                        disabled={loading()}
                      />
                    </div>
                    <div class="form-group mb-12 text-left">
                      <label for="oauth-worker-url" class="login-config-label">URL Cloudflare Worker Proxy</label>
                      <Input
                        id="oauth-worker-url"
                        type="text"
                        class="login-config-input"
                        placeholder="https://xxx.workers.dev"
                        value={workerUrl()}
                        onInput={(e) => setWorkerUrl(e.currentTarget.value)}
                        disabled={loading()}
                      />
                    </div>
                    <Button 
                      variant="secondary" 
                      block 
                      class="login-config-save-btn"
                      onClick={() => {
                        storeActions.saveOauthConfig(clientId().trim(), workerUrl().trim());
                        alert("Đã lưu thông số cấu hình OAuth!");
                      }}
                      disabled={loading()}
                    >
                      Lưu cấu hình
                    </Button>
                  </div>
                </Show>
              </div>
            </div>
          </Show>
        </div>
      }>
        <form onSubmit={handleUnlock} class="card mb-0">
          <div class="form-group">
            <label for="master-password">Mật khẩu Master</label>
            <Input
              id="master-password"
              type="password"
              placeholder="Nhập mật khẩu Master..."
              value={masterPassword()}
              onInput={(e) => setMasterPassword(e.currentTarget.value)}
              disabled={loading()}
              autofocus
            />
          </div>

          <Button type="submit" variant="primary" block loading={loading()} loadingText="Đang mở khóa..." class="mb-12">
            Mở khóa
          </Button>

          <Button type="button" variant="secondary" block onClick={handleResetToken} disabled={loading()}>
            Đổi tài khoản GitHub
          </Button>
        </form>
      </Show>
    </div>
  );
};
export default Login;
