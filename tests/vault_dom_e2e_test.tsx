import { sessionManager, t, View } from "@gistwarden/domain";
import {
  clearDerivedKey,
  deleteLocalVaultRoute,
  downloadVaultRoute,
  initializeWebRoutes,
  registerInMemoryRoute,
  uploadToGistRoute,
} from "@gistwarden/orchestrator";
import {
  getLocalVaultPayload,
  removeLocalVaultPayload,
  setLocalVaultPayload,
} from "@gistwarden/repository";
import { MemoryRouter, Route, useLocation, useNavigate } from "@solidjs/router";
import { cleanup, render } from "@solidjs/testing-library";
import {
  type Component,
  createComponent,
  createEffect,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import ConfirmModal from "../packages/ui/src/components/ui/ConfirmModal.tsx";
import RepromptModal from "../packages/ui/src/components/ui/RepromptModal.tsx";
import { init } from "../packages/ui/src/core/app-init.ts";
import {
  navigate,
  setActiveNavigator,
} from "../packages/ui/src/core/navigation.ts";
import { getViewPath } from "../packages/ui/src/core/router.ts";
import {
  accountStore,
  resetAccountStore,
  resetSettingsStore,
  resetUiStore,
  settingsStore,
  uiStore,
} from "../packages/ui/src/core/store.ts";
import AccountSecurity from "../packages/ui/src/features/auth/AccountSecurity.tsx";
import ChangeMasterPassword from "../packages/ui/src/features/auth/ChangeMasterPassword.tsx";
import LockScreen from "../packages/ui/src/features/auth/LockScreen.tsx";
import Login from "../packages/ui/src/features/auth/Login.tsx";
import Generator from "../packages/ui/src/features/generator/Generator.tsx";
import PasswordHistory from "../packages/ui/src/features/generator/PasswordHistory.tsx";
import ReportDataBreach from "../packages/ui/src/features/reports/ReportDataBreach.tsx";
import ReportExposed from "../packages/ui/src/features/reports/ReportExposed.tsx";
import ReportInactive2FA from "../packages/ui/src/features/reports/ReportInactive2FA.tsx";
import ReportReused from "../packages/ui/src/features/reports/ReportReused.tsx";
import Reports from "../packages/ui/src/features/reports/Reports.tsx";
import ReportUnsecure from "../packages/ui/src/features/reports/ReportUnsecure.tsx";
import ReportWeak from "../packages/ui/src/features/reports/ReportWeak.tsx";
import About from "../packages/ui/src/features/settings/About.tsx";
import Appearance from "../packages/ui/src/features/settings/Appearance.tsx";
import AutofillOptions from "../packages/ui/src/features/settings/AutofillOptions.tsx";
import Language from "../packages/ui/src/features/settings/Language.tsx";
import Settings from "../packages/ui/src/features/settings/Settings.tsx";
import Theme from "../packages/ui/src/features/settings/Theme.tsx";
import Troubleshooting from "../packages/ui/src/features/settings/Troubleshooting.tsx";
import ExportAccounts from "../packages/ui/src/features/sync/ExportAccounts.tsx";
import GoogleMigrationPage from "../packages/ui/src/features/sync/GoogleMigrationPage.tsx";
import ImportAccounts from "../packages/ui/src/features/sync/ImportAccounts.tsx";
import Folders from "../packages/ui/src/features/vault/Folders.tsx";
import ItemDetail from "../packages/ui/src/features/vault/ItemDetail.tsx";
import ItemEdit from "../packages/ui/src/features/vault/ItemEdit.tsx";
import Trash from "../packages/ui/src/features/vault/Trash.tsx";
import Vault from "../packages/ui/src/features/vault/Vault.tsx";
import VaultOptions from "../packages/ui/src/features/vault/VaultOptions.tsx";
import Welcome from "../packages/ui/src/features/welcome/Welcome.tsx";
import {
  GeneratorIcon,
  ReportsIcon,
  SettingsIcon,
  VaultIcon,
} from "../packages/ui/src/icons/svg/index.ts";
import { assert, test } from "./assert.ts";
import {
  clickElement,
  findElement,
  flushMicrotasks,
  mockChromeExtensionEnvironment,
  selectOption,
  user,
  waitForDOM,
} from "./dom-test-utils.ts";

const VIEW_MAP: Record<View, Component> = {
  [View.Vault]: Vault,
  [View.ItemDetail]: ItemDetail,
  [View.ItemEdit]: ItemEdit,
  [View.Generator]: Generator,
  [View.PasswordHistory]: PasswordHistory,
  [View.Reports]: Reports,
  [View.ReportExposed]: ReportExposed,
  [View.ReportReused]: ReportReused,
  [View.ReportWeak]: ReportWeak,
  [View.ReportUnsecure]: ReportUnsecure,
  [View.ReportInactive2FA]: ReportInactive2FA,
  [View.ReportDataBreach]: ReportDataBreach,
  [View.Settings]: Settings,
  [View.Appearance]: Appearance,
  [View.Language]: Language,
  [View.Theme]: Theme,
  [View.AccountSecurity]: AccountSecurity,
  [View.ChangeMasterPassword]: ChangeMasterPassword,
  [View.VaultOptions]: VaultOptions,
  [View.ImportAccounts]: ImportAccounts,
  [View.GoogleAuthTool]: GoogleMigrationPage,
  [View.ExportAccounts]: ExportAccounts,
  [View.Folders]: Folders,
  [View.Trash]: Trash,
  [View.AutofillOptions]: AutofillOptions,
  [View.About]: About,
  [View.Troubleshooting]: Troubleshooting,
  [View.Login]: Login,
  [View.Welcome]: Welcome,
  [View.Fido2Prompt]: () => <div />,
  [View.Guide]: () => <div />,
};

const ExtensionTestApp: Component = () => {
  onMount(async () => {
    await init();
  });

  const getLockedComponent = () => {
    if (uiStore.view === View.Welcome) return Welcome;
    if (accountStore.vaultConfigured) return LockScreen;
    return Login;
  };

  const getActiveComponent = () => {
    return VIEW_MAP[uiStore.view] || Vault;
  };

  return (
    <Show
      when={accountStore.isLoaded && settingsStore.isLoaded}
      fallback={<div class="app-loading-container flex-center h-100" />}
    >
      <div class="app-root-wrapper">
        <Show
          when={!accountStore.isLocked}
          fallback={<Dynamic component={getLockedComponent()} />}
        >
          <div class="app-container">
            <div class="flex-1 overflow-hidden pos-relative">
              <Dynamic component={getActiveComponent()} />
            </div>
            <Show
              when={[
                View.Vault,
                View.Generator,
                View.Reports,
                View.Settings,
              ].includes(uiStore.view)}
            >
              <nav class="app-nav">
                <div
                  class={`nav-item ${
                    uiStore.view === View.Vault ? "active" : ""
                  }`}
                  onClick={() => navigate(View.Vault)}
                >
                  <VaultIcon />
                  <span>{t("nav_vault")}</span>
                </div>
                <div
                  class={`nav-item ${
                    uiStore.view === View.Generator ? "active" : ""
                  }`}
                  onClick={() => navigate(View.Generator)}
                >
                  <GeneratorIcon />
                  <span>{t("nav_generator")}</span>
                </div>
                <div
                  class={`nav-item ${
                    uiStore.view === View.Reports ? "active" : ""
                  }`}
                  onClick={() => navigate(View.Reports)}
                >
                  <ReportsIcon />
                  <span>{t("nav_reports")}</span>
                </div>
                <div
                  class={`nav-item ${
                    uiStore.view === View.Settings ||
                    uiStore.view === View.VaultOptions
                      ? "active"
                      : ""
                  }`}
                  onClick={() => navigate(View.Settings)}
                >
                  <SettingsIcon />
                  <span>{t("nav_settings")}</span>
                </div>
              </nav>
            </Show>
          </div>
        </Show>
        <ConfirmModal />
        <RepromptModal />
      </div>
    </Show>
  );
};

test("Chrome Extension Pure DOM E2E Flow - 100% User Interactions via @solidjs/testing-library", async () => {
  // 0. Setup Environment & State
  cleanup();
  document.body.innerHTML = "";
  mockChromeExtensionEnvironment();
  initializeWebRoutes();
  sessionManager.clearKey();
  void clearDerivedKey();
  resetAccountStore();
  resetUiStore();
  resetSettingsStore();

  let storedPayload = "";

  registerInMemoryRoute(uploadToGistRoute, async (payload) => {
    if (payload && typeof payload.content === "string") {
      storedPayload = payload.content;
      await setLocalVaultPayload(payload.content);
    }
    return { success: true };
  });

  registerInMemoryRoute(downloadVaultRoute, async () => {
    const localRes = await getLocalVaultPayload();
    const content =
      localRes.isOk() && localRes.value ? localRes.value : storedPayload;
    return { success: true, content };
  });

  registerInMemoryRoute(deleteLocalVaultRoute, async () => {
    storedPayload = "";
    await removeLocalVaultPayload();
    return { success: true };
  });

  const masterPassword = "MasterPassword123!";
  const newMasterPassword = "NewMasterPassword456!";
  const pinCode = "123456";

  // Mount Extension App via @solidjs/testing-library
  render(() => createComponent(ExtensionTestApp, {}));
  await flushMicrotasks(100);

  // =========================================================================
  // STAGE 1: WELCOME TOUR & REGISTER NEW VAULT VIA DOM
  // =========================================================================
  console.log("--> STAGE 1: Welcome Tour & Setup");
  // 1.1 Complete Welcome Tour
  await waitForDOM(
    () => document.querySelector(".tour-action-area button") !== null,
    "Welcome tour was not rendered on initial launch",
  );

  // Slide 0 -> 1 -> 2
  for (let slide = 0; slide < 3; slide++) {
    await waitForDOM(
      () => document.querySelector(".tour-action-area button") !== null,
    );
    const nextSlideBtn = findElement<HTMLButtonElement>(
      ".tour-action-area button",
    );
    await clickElement(nextSlideBtn);
    await flushMicrotasks(60);
  }

  // Slide 3: Accept Terms Checkbox & Click Continue
  await waitForDOM(() => document.querySelector(".tour-checkbox") !== null);
  const termsCheckbox = findElement<HTMLInputElement>(".tour-checkbox");
  await clickElement(termsCheckbox);
  await flushMicrotasks(60);

  await waitForDOM(() => {
    const btn = document.querySelector<HTMLButtonElement>(
      ".tour-action-area button",
    );
    return Boolean(btn && !btn.disabled);
  }, "Continue button should become enabled after accepting terms");

  const startBtn = findElement<HTMLButtonElement>(".tour-action-area button");
  await clickElement(startBtn);
  await flushMicrotasks(100);

  // 1.2 In Login screen, user selects Local Storage provider via custom dropdown
  console.log("--> STAGE 1.2: Select Provider");
  await waitForDOM(
    () => document.querySelector("#provider-select") !== null,
    "Provider select dropdown was not rendered on Login screen",
  );

  const providerSelect = findElement<HTMLElement>("#provider-select");
  await selectOption(providerSelect, "local_storage");
  await flushMicrotasks(80);

  // 1.3 Click "Truy cập Kho Local" (Access Local Vault) button
  console.log("--> STAGE 1.3: Access Local Vault");
  await waitForDOM(
    () => document.querySelector(".card button") !== null,
    "Access local vault button was not rendered after selecting local storage mode",
  );

  const accessLocalBtn = findElement<HTMLButtonElement>(".card button");
  await clickElement(accessLocalBtn);
  await flushMicrotasks(100);

  // 1.4 Fill Master Password Registration Form
  console.log("--> STAGE 1.4: Fill Master Password");
  await waitForDOM(
    () => document.querySelector("#master-password") !== null,
    "Master password create form was not rendered after clicking access local vault",
  );

  const mpCreateInput = findElement<HTMLInputElement>("#master-password");
  const confirmMpInput = findElement<HTMLInputElement>("#confirm-password");

  await user.type(mpCreateInput, masterPassword);
  await user.type(confirmMpInput, masterPassword);

  const createSubmitBtn = findElement<HTMLButtonElement>(
    'button[type="submit"]',
  );
  await clickElement(createSubmitBtn);

  // Wait for Vault to unlock and render Main Shell & Bottom Nav
  console.log("--> STAGE 1.5: Waiting for Vault Unlock");
  await waitForDOM(
    () =>
      document.querySelector(".header-title") !== null ||
      document.querySelector(".app-nav") !== null,
    "Extension did not navigate to main vault after registration",
    12000,
  );

  // =========================================================================
  // STAGE 2: FOLDERS CRUD VIA DOM NAVIGATION
  // =========================================================================
  console.log("--> STAGE 2: Folders CRUD");
  // 2.1 Click Settings tab in bottom navigation
  const navSettingsTab = findElement<HTMLElement>(
    ".app-nav .nav-item:nth-child(4)",
  );
  console.log("navSettingsTab found:", navSettingsTab.textContent);
  await clickElement(navSettingsTab);
  await flushMicrotasks(100);
  console.log("uiStore.view:", uiStore.view);
  console.log(
    "DOM snapshot after nav click:",
    document.body.innerHTML.slice(0, 500),
  );

  // 2.2 Click "Vault Options" setting row
  await waitForDOM(
    () => document.querySelector(".card-list .setting-row") !== null,
  );
  const settingRows = Array.from(
    document.querySelectorAll<HTMLElement>(".card-list .setting-row"),
  );
  const vaultOptionsRow = settingRows.find(
    (r) =>
      r.textContent?.includes("Tùy chọn kho") ||
      r.textContent?.includes("Vault Options"),
  );
  assert(
    Boolean(vaultOptionsRow),
    "Vault Options row must exist on Settings DOM",
  );
  if (vaultOptionsRow) {
    await clickElement(vaultOptionsRow);
  }
  await flushMicrotasks(60);

  // 2.3 Click "Folders" row
  await waitForDOM(
    () => document.querySelector(".card-list .setting-row") !== null,
  );
  const folderOptionRows = Array.from(
    document.querySelectorAll<HTMLElement>(".card-list .setting-row"),
  );
  const foldersRow = folderOptionRows.find(
    (r) =>
      r.textContent?.includes("thư mục") || r.textContent?.includes("Folders"),
  );
  assert(Boolean(foldersRow), "Folders row must exist on Vault Options DOM");
  if (foldersRow) {
    await clickElement(foldersRow);
  }
  await flushMicrotasks(60);

  // Wait for Folders view to be displayed with the New folder button
  await waitForDOM(
    () =>
      Array.from(document.querySelectorAll("button")).some(
        (b) =>
          b.textContent?.toLowerCase().includes("folder") ||
          b.textContent?.toLowerCase().includes("thư mục"),
      ),
    "Folders management view with New folder button was not rendered",
  );

  // 2.4 Add Folder 1: "Công Việc & Tài Chính"
  const addFolderBtn1 = Array.from(
    document.querySelectorAll<HTMLButtonElement>("button"),
  ).find(
    (b) =>
      b.textContent?.toLowerCase().includes("folder") ||
      b.textContent?.toLowerCase().includes("thư mục"),
  );
  assert(Boolean(addFolderBtn1), "Add folder button must exist on Folders DOM");
  if (addFolderBtn1) {
    await clickElement(addFolderBtn1);
  }

  await waitForDOM(() => document.querySelector("#folder-name-input") !== null);
  const folderInput1 = findElement<HTMLInputElement>("#folder-name-input");
  await user.type(folderInput1, "Công Việc & Tài Chính");

  await waitForDOM(
    () => document.querySelector("form button[type='submit']") !== null,
  );
  const saveFolderBtn1 = findElement<HTMLButtonElement>(
    "form button[type='submit']",
  );
  await clickElement(saveFolderBtn1);

  await waitForDOM(
    () => document.body.textContent?.includes("Công Việc & Tài Chính") ?? false,
    "Folder 1 was not rendered on DOM after creation",
  );
  await waitForDOM(() => document.querySelector("#folder-name-input") === null);

  // 2.5 Add Folder 2: "Cá Nhân & Gia Đình"
  const addFolderBtn2 = Array.from(
    document.querySelectorAll<HTMLButtonElement>("button"),
  ).find(
    (b) =>
      b.textContent?.toLowerCase().includes("folder") ||
      b.textContent?.toLowerCase().includes("thư mục"),
  );
  assert(Boolean(addFolderBtn2), "Add folder button must exist on Folders DOM");
  if (addFolderBtn2) {
    await clickElement(addFolderBtn2);
  }

  await waitForDOM(() => document.querySelector("#folder-name-input") !== null);
  const folderInput2 = findElement<HTMLInputElement>("#folder-name-input");
  await user.type(folderInput2, "Cá Nhân & Gia Đình");

  await waitForDOM(
    () => document.querySelector("form button[type='submit']") !== null,
  );
  const saveFolderBtn2 = findElement<HTMLButtonElement>(
    "form button[type='submit']",
  );
  await clickElement(saveFolderBtn2);
  await flushMicrotasks(200);

  console.log(
    "[DEBUG Stage 2.5] toastMessage:",
    uiStore.toastMessage,
    "toastType:",
    uiStore.toastType,
  );
  console.log(
    "[DEBUG Stage 2.5] accountStore.folders:",
    accountStore.folders?.map((f) => f.name),
  );

  await waitForDOM(
    () => document.body.textContent?.includes("Cá Nhân & Gia Đình") ?? false,
    "Folder 2 was not rendered on DOM after creation",
  );
  await waitForDOM(() => document.querySelector("#folder-name-input") === null);

  // 2.6 Rename Folder 2 to "Cá Nhân VIP"
  const editButtons = document.querySelectorAll<HTMLElement>(
    ".setting-row button.action-btn",
  );
  assert(
    editButtons.length >= 2,
    "Expected at least 2 folder edit buttons on DOM",
  );
  const editFolder2Btn = editButtons[1];
  if (editFolder2Btn) {
    await clickElement(editFolder2Btn);
  }

  await waitForDOM(() => document.querySelector("#folder-name-input") !== null);
  const folderRenameInput = findElement<HTMLInputElement>("#folder-name-input");
  await user.type(folderRenameInput, "Cá Nhân VIP");

  await waitForDOM(
    () => document.querySelector("form button[type='submit']") !== null,
  );
  const saveRenameBtn = findElement<HTMLButtonElement>(
    "form button[type='submit']",
  );
  await clickElement(saveRenameBtn);

  await waitForDOM(
    () => document.body.textContent?.includes("Cá Nhân VIP") ?? false,
    "Updated folder name 'Cá Nhân VIP' was not rendered on DOM",
  );
  await waitForDOM(() => document.querySelector("#folder-name-input") === null);

  // 2.7 Navigate back to Vault Options -> Settings -> Vault
  const backToVaultOptionsBtn = findElement<HTMLElement>(
    ".detail-header .back-btn",
  );
  await clickElement(backToVaultOptionsBtn);
  await flushMicrotasks(50);

  const backToSettingsBtn = findElement<HTMLElement>(
    ".detail-header .back-btn",
  );
  await clickElement(backToSettingsBtn);
  await flushMicrotasks(50);

  const navVaultTab = findElement<HTMLElement>(
    ".app-nav .nav-item:nth-child(1)",
  );
  await clickElement(navVaultTab);
  await flushMicrotasks(50);

  // =========================================================================
  // STAGE 3: CREATE & MANAGE 4 TYPES OF VAULT ITEMS VIA DOM ONLY
  // =========================================================================

  // 3.1 Create Login Item via Header "+" Menu
  const addMenuBtn1 = findElement<HTMLButtonElement>(".header-btn-new");
  await clickElement(addMenuBtn1);
  await waitForDOM(() => document.querySelector(".add-dropdown") !== null);

  const addDropdownItems1 = Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      ".add-dropdown .dropdown-item",
    ),
  );
  const addLoginOption = addDropdownItems1.find(
    (item) =>
      item.textContent?.includes("đăng nhập") ||
      item.textContent?.includes("Login"),
  );
  assert(Boolean(addLoginOption), "Login option must exist in add dropdown");
  if (addLoginOption) {
    await clickElement(addLoginOption);
  }

  await waitForDOM(() => document.querySelector("#item-name") !== null);
  await user.type(
    findElement<HTMLInputElement>("#item-name"),
    "Tài khoản GitHub Công Ty",
  );
  await user.type(
    findElement<HTMLInputElement>("#item-username"),
    "dev_user@company.com",
  );
  await user.type(
    findElement<HTMLInputElement>("#item-password"),
    "SuperSecretPassword123!",
  );
  await user.type(
    findElement<HTMLTextAreaElement>("#item-notes"),
    "Tài khoản dev chính",
  );

  const saveLoginBtn = findElement<HTMLButtonElement>(
    ".detail-footer-bar button[type='submit']",
  );
  await clickElement(saveLoginBtn);
  await waitForDOM(() => {
    const title =
      document.querySelector(".detail-title")?.textContent?.toLowerCase() || "";
    return (
      title.includes("detail") ||
      title.includes("tiết") ||
      title.includes("view") ||
      title.includes("xem") ||
      document.querySelector(".header-btn-new") !== null
    );
  });
  const backToVaultBtn1 = document.querySelector<HTMLElement>(
    ".detail-header .back-btn",
  );
  if (backToVaultBtn1) {
    await clickElement(backToVaultBtn1);
  }
  await waitForDOM(() => document.querySelector(".header-btn-new") !== null);

  // 3.2 Create Secure Note Item via Header "+" Menu
  const addMenuBtn2 = findElement<HTMLButtonElement>(".header-btn-new");
  await clickElement(addMenuBtn2);
  await waitForDOM(() => document.querySelector(".add-dropdown") !== null);

  const addDropdownItems2 = Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      ".add-dropdown .dropdown-item",
    ),
  );
  const addNoteOption = addDropdownItems2.find(
    (item) =>
      item.textContent?.includes("ghi chú") ||
      item.textContent?.includes("Note"),
  );
  assert(
    Boolean(addNoteOption),
    "Secure Note option must exist in add dropdown",
  );
  if (addNoteOption) {
    await clickElement(addNoteOption);
  }

  await waitForDOM(() => document.querySelector("#item-name") !== null);
  await user.type(
    findElement<HTMLInputElement>("#item-name"),
    "Mã Phục Hồi Server VIP",
  );
  await user.type(
    findElement<HTMLTextAreaElement>("#item-notes"),
    "Recovery keys: AAAA-BBBB-CCCC-DDDD",
  );

  const saveNoteBtn = findElement<HTMLButtonElement>(
    ".detail-footer-bar button[type='submit']",
  );
  await clickElement(saveNoteBtn);
  await waitForDOM(() => {
    const title =
      document.querySelector(".detail-title")?.textContent?.toLowerCase() || "";
    return (
      title.includes("detail") ||
      title.includes("tiết") ||
      title.includes("view") ||
      title.includes("xem") ||
      document.querySelector(".header-btn-new") !== null
    );
  });
  const backToVaultBtn2 = document.querySelector<HTMLElement>(
    ".detail-header .back-btn",
  );
  if (backToVaultBtn2) {
    await clickElement(backToVaultBtn2);
  }
  await waitForDOM(() => document.querySelector(".header-btn-new") !== null);

  // 3.3 Create Card Item via Header "+" Menu
  const addMenuBtn3 = findElement<HTMLButtonElement>(".header-btn-new");
  await clickElement(addMenuBtn3);
  await waitForDOM(() => document.querySelector(".add-dropdown") !== null);

  const addDropdownItems3 = Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      ".add-dropdown .dropdown-item",
    ),
  );
  const addCardOption = addDropdownItems3.find(
    (item) =>
      item.textContent?.includes("Thẻ") || item.textContent?.includes("Card"),
  );
  assert(Boolean(addCardOption), "Card option must exist in add dropdown");
  if (addCardOption) {
    await clickElement(addCardOption);
  }

  await waitForDOM(() => document.querySelector("#item-name") !== null);
  await user.type(
    findElement<HTMLInputElement>("#item-name"),
    "Thẻ Doanh Nghiệp VISA",
  );
  await user.type(
    findElement<HTMLInputElement>("#card-holder"),
    "NGUYEN VAN A",
  );
  await user.type(
    findElement<HTMLInputElement>("#card-number"),
    "4111222233334444",
  );

  const saveCardBtn = findElement<HTMLButtonElement>(
    ".detail-footer-bar button[type='submit']",
  );
  await clickElement(saveCardBtn);
  await waitForDOM(() => {
    const title =
      document.querySelector(".detail-title")?.textContent?.toLowerCase() || "";
    return (
      title.includes("detail") ||
      title.includes("tiết") ||
      title.includes("view") ||
      title.includes("xem") ||
      document.querySelector(".header-btn-new") !== null
    );
  });
  const backToVaultBtn3 = document.querySelector<HTMLElement>(
    ".detail-header .back-btn",
  );
  if (backToVaultBtn3) {
    await clickElement(backToVaultBtn3);
  }
  await waitForDOM(() => document.querySelector(".header-btn-new") !== null);

  // 3.4 Create Identity Item via Header "+" Menu
  const addMenuBtn4 = findElement<HTMLButtonElement>(".header-btn-new");
  await clickElement(addMenuBtn4);
  await waitForDOM(() => document.querySelector(".add-dropdown") !== null);

  const addDropdownItems4 = Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      ".add-dropdown .dropdown-item",
    ),
  );
  const addIdOption = addDropdownItems4.find(
    (item) =>
      item.textContent?.includes("Danh tính") ||
      item.textContent?.includes("Identity"),
  );
  assert(Boolean(addIdOption), "Identity option must exist in add dropdown");
  if (addIdOption) {
    await clickElement(addIdOption);
  }

  await waitForDOM(() => document.querySelector("#item-name") !== null);
  await user.type(
    findElement<HTMLInputElement>("#item-name"),
    "Hồ Sơ Giám Đốc",
  );
  await user.type(findElement<HTMLInputElement>("#id-firstname"), "Van A");
  await user.type(findElement<HTMLInputElement>("#id-lastname"), "Nguyen");

  const saveIdBtn = findElement<HTMLButtonElement>(
    ".detail-footer-bar button[type='submit']",
  );
  await clickElement(saveIdBtn);
  await waitForDOM(() => {
    const title =
      document.querySelector(".detail-title")?.textContent?.toLowerCase() || "";
    return (
      title.includes("detail") ||
      title.includes("tiết") ||
      title.includes("view") ||
      title.includes("xem") ||
      document.querySelector(".header-btn-new") !== null
    );
  });
  const backToVaultBtn4 = document.querySelector<HTMLElement>(
    ".detail-header .back-btn",
  );
  if (backToVaultBtn4) {
    await clickElement(backToVaultBtn4);
  }
  await waitForDOM(() => document.querySelector(".header-btn-new") !== null);

  // 3.5 Verify all items are displayed on Vault DOM list
  await waitForDOM(
    () =>
      document.body.textContent?.includes("Tài khoản GitHub Công Ty") ?? false,
    "Login item must be rendered on Vault DOM list",
  );
  await waitForDOM(
    () =>
      document.body.textContent?.includes("Mã Phục Hồi Server VIP") ?? false,
    "SecureNote item must be rendered on Vault DOM list",
  );
  await waitForDOM(
    () => document.body.textContent?.includes("Thẻ Doanh Nghiệp VISA") ?? false,
    "Card item must be rendered on Vault DOM list",
  );
  await waitForDOM(
    () => document.body.textContent?.includes("Hồ Sơ Giám Đốc") ?? false,
    "Identity item must be rendered on Vault DOM list",
  );

  // 3.6 Edit an Item strictly via DOM clicks
  const vaultRows = Array.from(
    document.querySelectorAll<HTMLElement>(".vault-item-row"),
  );
  const loginItemRow = vaultRows.find((row) =>
    row.textContent?.includes("Tài khoản GitHub Công Ty"),
  );
  assert(Boolean(loginItemRow), "Login item row must exist on Vault DOM");
  if (loginItemRow) {
    await clickElement(loginItemRow);
  }

  // ItemDetail view opens -> click Edit button in footer bar
  await waitForDOM(
    () => document.querySelector(".detail-footer-bar button") !== null,
  );
  const editItemBtn = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".detail-footer-bar button"),
  ).find(
    (b) =>
      b.textContent?.includes("Edit") ||
      b.textContent?.includes("Sửa") ||
      b.textContent?.includes("Chỉnh sửa"),
  );
  assert(Boolean(editItemBtn), "Edit button must exist in Detail footer");
  if (editItemBtn) {
    await clickElement(editItemBtn);
  }

  // ItemEdit form opens -> update name
  await waitForDOM(() => document.querySelector("#item-name") !== null);
  const editNameInput = findElement<HTMLInputElement>("#item-name");
  await user.clear(editNameInput);
  await user.type(editNameInput, "Tài khoản GitHub VIP");

  const saveEditedItemBtn = findElement<HTMLButtonElement>(
    ".detail-footer-bar button[type='submit']",
  );
  await clickElement(saveEditedItemBtn);

  // Click back button from Detail view to return to Vault list
  await waitForDOM(() => {
    const title =
      document.querySelector(".detail-title")?.textContent?.toLowerCase() || "";
    return (
      title.includes("detail") ||
      title.includes("tiết") ||
      title.includes("view") ||
      title.includes("xem") ||
      document.querySelector(".header-btn-new") !== null
    );
  });
  const backToVaultBtn = findElement<HTMLElement>(".detail-header .back-btn");
  await clickElement(backToVaultBtn);

  await waitForDOM(
    () =>
      (document.body.textContent?.includes("Tài khoản GitHub VIP") ?? false) &&
      document.querySelector(".header-btn-new") !== null,
    "Updated item name 'Tài khoản GitHub VIP' must be rendered on Vault DOM",
  );

  // 3.7 Delete Item to Trash via DOM
  const updatedVaultRows = Array.from(
    document.querySelectorAll<HTMLElement>(".vault-item-row"),
  );
  const itemToDeleteRow = updatedVaultRows.find((row) =>
    row.textContent?.includes("Tài khoản GitHub VIP"),
  );
  assert(Boolean(itemToDeleteRow), "Item to delete must exist on Vault DOM");
  if (itemToDeleteRow) {
    await clickElement(itemToDeleteRow);
  }

  // In ItemDetail -> click Delete button in footer
  await waitForDOM(() => document.querySelector(".detail-delete-btn") !== null);
  const deleteItemBtn = findElement<HTMLButtonElement>(".detail-delete-btn");
  await clickElement(deleteItemBtn);

  // Modal confirm popup -> click confirm button
  await waitForDOM(
    () => document.querySelector(".confirm-modal-actions button") !== null,
  );
  const confirmDeleteBtn = findElement<HTMLButtonElement>(
    ".confirm-modal-actions button",
  );
  await clickElement(confirmDeleteBtn);

  // Verify item is removed from active Vault DOM list
  await waitForDOM(() => document.querySelector(".header-btn-new") !== null);
  assert(
    !document.body.textContent?.includes("Tài khoản GitHub VIP"),
    "Deleted item must NOT appear on active Vault DOM list",
  );

  // Verify item is visible in Trash DOM by navigating there
  await waitForDOM(() => document.querySelector(".app-nav") !== null);
  const navSettingsTabForTrash = Array.from(
    document.querySelectorAll<HTMLElement>(".app-nav .nav-item"),
  ).find(
    (el) =>
      el.textContent?.includes(t("nav_settings")) ||
      el.textContent?.includes("Settings"),
  );
  assert(
    Boolean(navSettingsTabForTrash),
    "Settings nav tab must exist in app-nav",
  );
  if (navSettingsTabForTrash) {
    await clickElement(navSettingsTabForTrash);
  }
  await waitForDOM(() =>
    Boolean(
      document
        .querySelector(".header-title")
        ?.textContent?.includes("Setting") ||
        document
          .querySelector(".header-title")
          ?.textContent?.includes("Cài đặt"),
    ),
  );

  const settingsRowsForTrash = Array.from(
    document.querySelectorAll<HTMLElement>(".card-list .setting-row"),
  );
  const vaultOptsForTrash = settingsRowsForTrash.find(
    (r) =>
      r.textContent?.includes("Tùy chọn kho") ||
      r.textContent?.includes("Vault Options"),
  );
  if (vaultOptsForTrash) {
    await clickElement(vaultOptsForTrash);
  }
  await waitForDOM(() => document.querySelector(".card-list") !== null);

  const vaultOptionRowsForTrash = Array.from(
    document.querySelectorAll<HTMLElement>(".card-list .setting-row"),
  );
  const trashRow = vaultOptionRowsForTrash.find(
    (r) =>
      r.textContent?.includes("Thùng rác") || r.textContent?.includes("Trash"),
  );
  assert(Boolean(trashRow), "Trash row must exist in Vault Options");
  if (trashRow) {
    await clickElement(trashRow);
  }
  await waitForDOM(
    () => document.querySelector(".detail-header .back-btn") !== null,
  );

  await waitForDOM(
    () => document.body.textContent.includes("Tài khoản GitHub VIP"),
    "Deleted item must appear in Trash DOM list",
  );

  // Return from Trash -> Vault Options -> Settings
  await waitForDOM(
    () => document.querySelector(".detail-header .back-btn") !== null,
  );
  await clickElement(findElement<HTMLElement>(".detail-header .back-btn"));
  await waitForDOM(
    () => document.querySelector(".detail-header .back-btn") !== null,
  );
  await clickElement(findElement<HTMLElement>(".detail-header .back-btn"));
  await waitForDOM(() =>
    Boolean(
      document
        .querySelector(".header-title")
        ?.textContent?.includes("Setting") ||
        document
          .querySelector(".header-title")
          ?.textContent?.includes("Cài đặt"),
    ),
  );

  // =========================================================================
  // STAGE 4: PIN SETUP & 3-WRONG-ATTEMPT AUTO-WIPE VIA <LockScreen />
  // =========================================================================
  // 4.1 Navigate to Account Security via DOM
  const settingsRowsForSec = Array.from(
    document.querySelectorAll<HTMLElement>(".card-list .setting-row"),
  );
  const securityRow = settingsRowsForSec.find(
    (r) =>
      r.textContent?.includes("Bảo mật") || r.textContent?.includes("Security"),
  );
  assert(
    Boolean(securityRow),
    "Account Security row must exist on Settings DOM",
  );
  if (securityRow) {
    await clickElement(securityRow);
  }
  await waitForDOM(() => document.querySelector("#unlock-pin") !== null);

  // 4.2 Click toggle to enable PIN
  await waitForDOM(() => document.querySelector("#unlock-pin") !== null);
  const pinCheckbox = findElement<HTMLInputElement>("#unlock-pin");
  await clickElement(pinCheckbox);

  // Modal opens: type PIN "123456"
  await waitForDOM(() => document.querySelector("#set-pin-input") !== null);
  const setPinInput = findElement<HTMLInputElement>("#set-pin-input");
  await user.type(setPinInput, pinCode);

  const savePinModalBtn = findElement<HTMLButtonElement>(
    ".modal-panel-footer button[type='submit']",
  );
  await clickElement(savePinModalBtn);
  await flushMicrotasks(50);

  // 4.3 Lock Vault strictly via Header Profile Menu click
  await waitForDOM(
    () => document.querySelector(".detail-header .back-btn") !== null,
  );
  await clickElement(findElement<HTMLElement>(".detail-header .back-btn")); // Back to Settings
  await waitForDOM(() => document.querySelector(".app-nav") !== null);
  const navVaultTabForLock = Array.from(
    document.querySelectorAll<HTMLElement>(".app-nav .nav-item"),
  ).find(
    (el) =>
      el.textContent?.includes(t("nav_vault")) ||
      el.textContent?.includes("Vault"),
  );
  assert(Boolean(navVaultTabForLock), "Vault nav tab must exist in app-nav");
  if (navVaultTabForLock) {
    await clickElement(navVaultTabForLock);
  }
  await waitForDOM(
    () => document.querySelector(".profile-avatar-btn") !== null,
  );

  const profileAvatarBtn = findElement<HTMLElement>(".profile-avatar-btn");
  await clickElement(profileAvatarBtn);
  await waitForDOM(() => document.querySelector(".profile-dropdown") !== null);

  const profileDropdownItems = Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      ".profile-dropdown .dropdown-item",
    ),
  );
  const lockOption = profileDropdownItems.find(
    (item) =>
      item.textContent?.includes("Khóa kho") ||
      item.textContent?.includes("Lock"),
  );
  assert(Boolean(lockOption), "Lock option must exist in profile dropdown");
  if (lockOption) {
    await clickElement(lockOption);
  }

  // 4.4 Test Wrong PIN 3 Times via LockScreen DOM
  await waitForDOM(
    () =>
      document.querySelector("#master-password") !== null ||
      document.querySelector("#pin-unlock-input") !== null,
    "Lock screen was not rendered after clicking Lock",
  );

  // Switch to PIN form if on MasterPasswordForm
  const switchToPinBtn = Array.from(
    document.querySelectorAll<HTMLButtonElement>("button"),
  ).find((b) => b.textContent?.includes("PIN"));
  if (switchToPinBtn) {
    await clickElement(switchToPinBtn);
    await flushMicrotasks(50);
  }

  // Attempt 1: Wrong PIN "000000"
  await waitForDOM(() => document.querySelector("#pin-unlock-input") !== null);
  const pinInput1 = findElement<HTMLInputElement>("#pin-unlock-input");
  await user.type(pinInput1, "000000");
  const pinSubmitBtn1 = findElement<HTMLButtonElement>('button[type="submit"]');
  await clickElement(pinSubmitBtn1);
  await flushMicrotasks(50);

  assert(
    document.body.textContent.includes("2") ||
      document.body.textContent.includes("sai"),
    "DOM should display error message with 2 attempts remaining",
  );

  // Attempt 2: Wrong PIN "000000"
  const pinInput2 = findElement<HTMLInputElement>("#pin-unlock-input");
  await user.type(pinInput2, "000000");
  const pinSubmitBtn2 = findElement<HTMLButtonElement>('button[type="submit"]');
  await clickElement(pinSubmitBtn2);
  await flushMicrotasks(50);

  assert(
    document.body.textContent.includes("1") ||
      document.body.textContent.includes("sai"),
    "DOM should display error message with 1 attempt remaining",
  );

  // Attempt 3: Wrong PIN "000000" -> Triggers Auto-Wipe
  const pinInput3 = findElement<HTMLInputElement>("#pin-unlock-input");
  await user.type(pinInput3, "000000");
  const pinSubmitBtn3 = findElement<HTMLButtonElement>('button[type="submit"]');
  await clickElement(pinSubmitBtn3);
  await flushMicrotasks(100);

  // Auto-wipe resets PIN and returns user to Master Password form on LockScreen
  await waitForDOM(
    () => document.querySelector("#master-password") !== null,
    "After 3 failed PIN attempts, DOM must reset to Master Password unlock form",
  );

  // =========================================================================
  // STAGE 5: EXTENSION EXCLUSIVE FEATURE - SESSION TIMEOUT SETTINGS ON DOM
  // =========================================================================
  // Unlock with valid Master Password first
  const unlockMpInput = findElement<HTMLInputElement>("#master-password");
  await user.type(unlockMpInput, masterPassword);
  const unlockBtn = findElement<HTMLButtonElement>('button[type="submit"]');
  await clickElement(unlockBtn);
  await waitForDOM(
    () =>
      document.querySelector("#master-password") === null &&
      document.querySelector(".header-btn-new") !== null,
    "Vault view was not unlocked after entering Master Password",
    10000,
  );
  await flushMicrotasks(300);

  // Navigate to Account Security
  await waitForDOM(() => document.querySelector(".app-nav") !== null);
  const navSettingsTabForTimeout = Array.from(
    document.querySelectorAll<HTMLElement>(".app-nav .nav-item"),
  ).find(
    (el) =>
      el.textContent?.includes(t("nav_settings")) ||
      el.textContent?.includes("Settings"),
  );
  assert(
    Boolean(navSettingsTabForTimeout),
    "Settings nav tab must exist in app-nav",
  );
  if (navSettingsTabForTimeout) {
    await clickElement(navSettingsTabForTimeout);
  }
  await waitForDOM(() =>
    Boolean(
      document
        .querySelector(".header-title")
        ?.textContent?.includes("Setting") ||
        document
          .querySelector(".header-title")
          ?.textContent?.includes("Cài đặt"),
    ),
  );

  const secRowForTimeout = Array.from(
    document.querySelectorAll<HTMLElement>(".card-list .setting-row"),
  ).find(
    (r) =>
      r.textContent?.includes("Bảo mật") || r.textContent?.includes("Security"),
  );
  assert(
    Boolean(secRowForTimeout),
    "Account Security row must exist in Settings",
  );
  if (secRowForTimeout) {
    await clickElement(secRowForTimeout);
  }
  await waitForDOM(() => document.querySelector("#timeout-select") !== null);

  // Verify Extension-specific SessionTimeoutSettings is present on DOM
  const timeoutSelect = findElement<HTMLElement>("#timeout-select");
  await selectOption(timeoutSelect, "15"); // 15 minutes timeout

  const timeoutActionSelect = findElement<HTMLElement>(
    "#timeout-action-select",
  );
  await selectOption(timeoutActionSelect, "lock");

  // =========================================================================
  // STAGE 6: CHANGE MASTER PASSWORD VIA DOM ONLY (<ChangeMasterPassword />)
  // =========================================================================
  const changeMpRow = Array.from(
    document.querySelectorAll<HTMLElement>(".card-list .setting-row"),
  ).find(
    (r) =>
      r.textContent?.includes("Đổi Mật khẩu") ||
      r.textContent?.includes("Change Master Password"),
  );
  assert(
    Boolean(changeMpRow),
    "Change Master Password row must exist in Account Security",
  );
  if (changeMpRow) {
    await clickElement(changeMpRow);
  }
  await waitForDOM(() => document.querySelector("#current-pass") !== null);

  await user.type(
    findElement<HTMLInputElement>("#current-pass"),
    masterPassword,
  );
  await user.type(
    findElement<HTMLInputElement>("#new-pass"),
    newMasterPassword,
  );
  await user.type(
    findElement<HTMLInputElement>("#confirm-pass"),
    newMasterPassword,
  );

  const changePassSubmitBtn = findElement<HTMLButtonElement>(
    'button[type="submit"]',
  );
  await clickElement(changePassSubmitBtn);

  await waitForDOM(
    () =>
      document.querySelector(".toast-notification") !== null ||
      document.querySelector("#current-pass") === null,
    "Change Master Password did not complete on DOM",
    10000,
  );

  // =========================================================================
  // STAGE 7: LOGOUT & RELOGIN WITH NEW MASTER PASSWORD VIA DOM
  // =========================================================================
  // Return from AccountSecurity -> Settings -> Vault
  await waitForDOM(
    () => document.querySelector(".detail-header .back-btn") !== null,
  );
  await clickElement(findElement<HTMLElement>(".detail-header .back-btn"));
  await waitForDOM(() =>
    Boolean(
      document
        .querySelector(".header-title")
        ?.textContent?.includes("Setting") ||
        document
          .querySelector(".header-title")
          ?.textContent?.includes("Cài đặt"),
    ),
  );

  const navVaultTabForLogout = Array.from(
    document.querySelectorAll<HTMLElement>(".app-nav .nav-item"),
  ).find(
    (el) =>
      el.textContent?.includes(t("nav_vault")) ||
      el.textContent?.includes("Vault"),
  );
  if (navVaultTabForLogout) {
    await clickElement(navVaultTabForLogout);
  }
  await waitForDOM(
    () =>
      document.querySelector(".header-title")?.textContent === "Vault" ||
      document.querySelector(".profile-avatar-btn") !== null,
  );

  // Click Profile -> Logout
  await clickElement(findElement<HTMLElement>(".profile-avatar-btn"));
  await waitForDOM(() => document.querySelector(".profile-dropdown") !== null);

  const profileDropdownLogoutItems = Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      ".profile-dropdown .dropdown-item",
    ),
  );
  const logoutOption = profileDropdownLogoutItems.find(
    (item) =>
      item.textContent?.includes("Đăng xuất") ||
      item.textContent?.includes("Logout"),
  );
  assert(Boolean(logoutOption), "Logout option must exist in profile dropdown");
  if (logoutOption) {
    await clickElement(logoutOption);
  }

  // Confirm logout modal
  await waitForDOM(
    () => document.querySelector(".confirm-modal-actions button") !== null,
  );
  await clickElement(
    findElement<HTMLButtonElement>(".confirm-modal-actions button"),
  );

  // In Login screen (after logout, select Local provider)
  await waitForDOM(
    () =>
      document.querySelector("#provider-select") !== null ||
      document.querySelector(".card button") !== null,
  );

  const reProviderSelect =
    document.querySelector<HTMLElement>("#provider-select");
  if (reProviderSelect) {
    await selectOption(reProviderSelect, "local_storage");
    await flushMicrotasks(50);
  }

  const reAccessBtn = document.querySelector<HTMLButtonElement>(".card button");
  if (reAccessBtn) {
    await clickElement(reAccessBtn);
    await flushMicrotasks(50);
  }

  // Relogin with NEW master password on LockScreen DOM
  await waitForDOM(() => document.querySelector("#master-password") !== null);
  const reloginMpInput = findElement<HTMLInputElement>("#master-password");
  await user.type(reloginMpInput, newMasterPassword);
  const reloginBtn = findElement<HTMLButtonElement>('button[type="submit"]');
  await clickElement(reloginBtn);

  await waitForDOM(
    () =>
      document.querySelector(".header-title")?.textContent === "Vault" ||
      document.querySelector(".app-nav") !== null,
    "Relogin with new master password failed on DOM",
    10000,
  );

  // Verify vault items remain intact after relogin
  await waitForDOM(
    () =>
      document.body.textContent?.includes("Mã Phục Hồi Server VIP") ?? false,
    "Vault items must still be present after relogin with new master password",
  );

  // =========================================================================
  // STAGE 8: CLEAR / DELETE VAULT IN DANGER ZONE VIA DOM (<VaultOptions />)
  // =========================================================================
  const navSettingsTabForClear = Array.from(
    document.querySelectorAll<HTMLElement>(".app-nav .nav-item"),
  ).find(
    (el) =>
      el.textContent?.includes(t("nav_settings")) ||
      el.textContent?.includes("Settings"),
  );
  if (navSettingsTabForClear) {
    await clickElement(navSettingsTabForClear);
  }
  await waitForDOM(() =>
    Boolean(
      document
        .querySelector(".header-title")
        ?.textContent?.includes("Setting") ||
        document
          .querySelector(".header-title")
          ?.textContent?.includes("Cài đặt"),
    ),
  );

  const settingsRowsForClear = Array.from(
    document.querySelectorAll<HTMLElement>(".card-list .setting-row"),
  );
  const vaultOptsForClear = settingsRowsForClear.find(
    (r) =>
      r.textContent?.includes("Tùy chọn kho") ||
      r.textContent?.includes("Vault Options"),
  );
  if (vaultOptsForClear) {
    await clickElement(vaultOptsForClear);
  }
  await waitForDOM(
    () => document.querySelector(".setting-label.text-error") !== null,
  );

  // Click on Danger Zone "Xóa kho dữ liệu"
  const clearVaultRow = findElement<HTMLElement>(".setting-label.text-error");
  await clickElement(clearVaultRow);

  // TypedConfirmModal appears requiring typing "DELETE"
  await waitForDOM(
    () => document.querySelector(".confirm-modal-box input") !== null,
    "Typed confirm modal did not appear on DOM",
  );

  const typedConfirmInput = findElement<HTMLInputElement>(
    ".confirm-modal-box input",
  );
  await user.type(typedConfirmInput, "DELETE");

  const modalConfirmBtn = findElement<HTMLButtonElement>(
    ".confirm-modal-actions button.btn-danger",
  );
  await clickElement(modalConfirmBtn);
  await flushMicrotasks(100);

  // If reprompt modal appears, unlock reprompt
  const repromptInput =
    document.querySelector<HTMLInputElement>("#reprompt-password");
  if (repromptInput) {
    await user.type(repromptInput, newMasterPassword);
    const repromptSubmitBtn = document.querySelector<HTMLButtonElement>(
      ".reprompt-modal button[type='submit']",
    );
    if (repromptSubmitBtn) {
      await clickElement(repromptSubmitBtn);
      await flushMicrotasks(100);
    }
  }

  // Wait for clear vault confirmation
  await waitForDOM(
    () =>
      !document.body.textContent?.includes("Mã Phục Hồi Server VIP") ||
      document.querySelector(".toast-notification") !== null,
    "Vault was not cleared",
  );

  // Verify Vault items are cleared
  assert(
    !document.body.textContent?.includes("Mã Phục Hồi Server VIP"),
    "All vault items must be cleared after deleting vault",
  );

  cleanup();
  document.body.innerHTML = "";
}, 60000);

test("Chrome Extension Pure DOM - GitHub Gist Provider Setup Flow (Welcome -> Select Gist -> PAT Input -> Gist Discovery -> Master Password Setup -> Unlock to Vault)", async () => {
  cleanup();
  document.body.innerHTML = "";
  mockChromeExtensionEnvironment();
  sessionManager.clearKey();
  void clearDerivedKey();
  resetAccountStore();
  resetUiStore();
  resetSettingsStore();

  let storedGistPayload = "";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method?.toUpperCase() || "GET";

    if (url.startsWith("https://api.github.com")) {
      if (url.endsWith("/user")) {
        return new Response(
          JSON.stringify({
            login: "testgithubuser",
            avatar_url: "https://github.com/testuser.png",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.includes("/gists")) {
        if (method === "GET") {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (method === "POST" || method === "PATCH") {
          return new Response(
            JSON.stringify({
              id: "mock_gist_id",
              description: "gistwarden_vault",
              updated_at: new Date().toISOString(),
              files: {
                "gistwarden.json": {
                  content: storedGistPayload,
                  raw_url:
                    "https://gist.githubusercontent.com/raw/mock_gist_id/gistwarden.json",
                },
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
      }
    }
    return originalFetch
      ? originalFetch(input, init)
      : new Response(null, { status: 404 });
  }) as typeof fetch;

  registerInMemoryRoute(uploadToGistRoute, async (payload) => {
    if (payload && typeof payload.content === "string") {
      storedGistPayload = payload.content;
    }
    return { success: true };
  });

  registerInMemoryRoute(downloadVaultRoute, async () => {
    return { success: true, content: storedGistPayload };
  });

  render(() => createComponent(ExtensionTestApp, {}));
  await flushMicrotasks(100);

  // 1. Welcome Tour (Slide 0 -> 1 -> 2 -> 3 -> Accept)
  for (let slide = 0; slide < 3; slide++) {
    await waitForDOM(
      () => document.querySelector(".tour-action-area button") !== null,
    );
    const nextSlideBtn = findElement<HTMLButtonElement>(
      ".tour-action-area button",
    );
    await clickElement(nextSlideBtn);
    await flushMicrotasks(60);
  }

  await waitForDOM(() => document.querySelector(".tour-checkbox") !== null);
  const termsCheckbox = findElement<HTMLInputElement>(".tour-checkbox");
  await clickElement(termsCheckbox);
  await flushMicrotasks(60);

  await waitForDOM(() => {
    const btn = document.querySelector<HTMLButtonElement>(
      ".tour-action-area button",
    );
    return Boolean(btn && !btn.disabled);
  });
  const continueBtn = findElement<HTMLButtonElement>(
    ".tour-action-area button",
  );
  await clickElement(continueBtn);
  await flushMicrotasks(60);

  // 2. Select Provider: GitHub Gist
  await waitForDOM(() => document.querySelector("#provider-select") !== null);
  const providerSelect = findElement<HTMLElement>("#provider-select");
  await selectOption(providerSelect, "github_gist");
  await flushMicrotasks(50);

  // 3. Switch to PAT tab in GithubSetupForm
  await waitForDOM(
    () => document.querySelectorAll<HTMLElement>(".login-tab-btn").length >= 2,
  );
  const patTab = Array.from(
    document.querySelectorAll<HTMLElement>(".login-tab-btn"),
  ).find(
    (el) =>
      el.textContent?.includes(t("login_method_pat")) ||
      el.textContent?.includes("Token") ||
      el.textContent?.includes("PAT"),
  );
  assert(Boolean(patTab), "PAT tab must exist in GithubSetupForm");
  if (patTab) {
    await clickElement(patTab);
    await flushMicrotasks(50);
  }

  // 4. Enter GitHub Token
  await waitForDOM(() => document.querySelector("#github-token") !== null);
  const tokenInput = findElement<HTMLInputElement>("#github-token");
  await user.type(tokenInput, "ghp_mocktesttoken1234567890abcdef");

  const saveTokenBtn = findElement<HTMLButtonElement>('button[type="submit"]');
  await clickElement(saveTokenBtn);

  // 5. Gist discovered as new -> Fill Master Password
  await waitForDOM(
    () =>
      document.querySelector("#master-password") !== null &&
      document.querySelector("#confirm-password") !== null,
    "Master Password creation form did not render for GitHub Gist setup",
    35000,
  );

  const mpInput = findElement<HTMLInputElement>("#master-password");
  const confirmMpInput = findElement<HTMLInputElement>("#confirm-password");
  await user.type(mpInput, "GistMasterPassword123!");
  await user.type(confirmMpInput, "GistMasterPassword123!");

  const registerSubmitBtn = findElement<HTMLButtonElement>(
    'button[type="submit"]',
  );
  await clickElement(registerSubmitBtn);

  // 6. Vault unlocked to Main Shell
  await waitForDOM(
    () =>
      Boolean(
        accountStore.vaultConfigured &&
          !accountStore.isLocked &&
          (document.querySelector(".header-btn-new") ||
            document.querySelector(".app-nav") ||
            document.querySelector(".search-container")),
      ),
    "Vault view did not unlock after GitHub Gist registration",
    35000,
  );

  assert(
    accountStore.vaultConfigured === true,
    "Account store should record vault configured for GitHub Gist",
  );
  assert(
    !accountStore.isLocked,
    "Vault should be unlocked after GitHub Gist registration",
  );

  globalThis.fetch = originalFetch;
  cleanup();
  document.body.innerHTML = "";
}, 50000);

test("Chrome Extension Pure DOM - Self-Hosted Server Provider Setup Flow (Welcome -> Select Self-Hosted -> Server URL & Register Form -> Master Password Setup -> Unlock to Vault)", async () => {
  cleanup();
  document.body.innerHTML = "";
  mockChromeExtensionEnvironment();
  sessionManager.clearKey();
  void clearDerivedKey();
  resetAccountStore();
  resetUiStore();
  resetSettingsStore();

  let storedServerPayload = "";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method?.toUpperCase() || "GET";

    if (url.startsWith("http://localhost:3000")) {
      if (url.endsWith("/user")) {
        return new Response(JSON.stringify({ username: "admin" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.endsWith("/auth/register") || url.endsWith("/auth/login")) {
        return new Response(
          JSON.stringify({ accessToken: "mock_jwt_access_token_123" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.endsWith("/vault")) {
        if (method === "GET") {
          if (!storedServerPayload) {
            return new Response(JSON.stringify({ error: "Not Found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }
          return new Response(storedServerPayload, {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (method === "POST") {
          const body = typeof init?.body === "string" ? init.body : "";
          storedServerPayload = body;
          return new Response(JSON.stringify({ status: "success" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
    }
    return originalFetch
      ? originalFetch(input, init)
      : new Response(null, { status: 404 });
  }) as typeof fetch;

  registerInMemoryRoute(uploadToGistRoute, async (payload) => {
    if (payload && typeof payload.content === "string") {
      storedServerPayload = payload.content;
    }
    return { success: true };
  });

  registerInMemoryRoute(downloadVaultRoute, async () => {
    return { success: true, content: storedServerPayload };
  });

  render(() => createComponent(ExtensionTestApp, {}));
  await flushMicrotasks(100);

  // 1. Welcome Tour (Slide 0 -> 1 -> 2 -> 3 -> Accept)
  for (let slide = 0; slide < 3; slide++) {
    await waitForDOM(
      () => document.querySelector(".tour-action-area button") !== null,
    );
    const nextSlideBtn = findElement<HTMLButtonElement>(
      ".tour-action-area button",
    );
    await clickElement(nextSlideBtn);
    await flushMicrotasks(60);
  }

  await waitForDOM(() => document.querySelector(".tour-checkbox") !== null);
  const termsCheckbox = findElement<HTMLInputElement>(".tour-checkbox");
  await clickElement(termsCheckbox);
  await flushMicrotasks(60);

  await waitForDOM(() => {
    const btn = document.querySelector<HTMLButtonElement>(
      ".tour-action-area button",
    );
    return Boolean(btn && !btn.disabled);
  });
  const continueBtn = findElement<HTMLButtonElement>(
    ".tour-action-area button",
  );
  await clickElement(continueBtn);
  await flushMicrotasks(60);

  // 2. Select Provider: Self-Hosted Server
  await waitForDOM(() => document.querySelector("#provider-select") !== null);
  const providerSelect = findElement<HTMLElement>("#provider-select");
  await selectOption(providerSelect, "self_hosted_server");
  await flushMicrotasks(50);

  // 3. Configure Server URL via ServerConfigModal
  await waitForDOM(
    () => document.querySelector(".server-config-btn") !== null,
    "Server config button did not appear",
    20000,
  );
  const serverConfigBtn = findElement<HTMLButtonElement>(".server-config-btn");
  await clickElement(serverConfigBtn);

  await waitForDOM(() => document.querySelector("#modal-server-url") !== null);
  const modalUrlInput = findElement<HTMLInputElement>("#modal-server-url");
  await user.type(modalUrlInput, "http://localhost:3000");

  // Test connection button in modal
  await waitForDOM(() => document.querySelector(".modal-slide-panel") !== null);
  const testConnBtn = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".modal-slide-panel button"),
  ).find(
    (b) =>
      b.textContent?.includes("Test") ||
      b.textContent?.includes("Thử") ||
      b.textContent?.includes("Kết Nối"),
  );
  assert(
    Boolean(testConnBtn),
    "Test connection button must exist in ServerConfigModal",
  );
  if (testConnBtn) {
    await clickElement(testConnBtn);
    await flushMicrotasks(100);
  }

  // Save server config in modal
  await waitForDOM(() => {
    const saveBtn = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".modal-slide-panel button"),
    ).find(
      (b) => b.textContent?.includes("Save") || b.textContent?.includes("Lưu"),
    );
    return Boolean(saveBtn && !saveBtn.disabled);
  });
  const saveModalBtn = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".modal-slide-panel button"),
  ).find(
    (b) => b.textContent?.includes("Save") || b.textContent?.includes("Lưu"),
  );
  if (saveModalBtn) {
    await clickElement(saveModalBtn);
    await flushMicrotasks(50);
  }

  // 4. Switch to Register tab
  await waitForDOM(
    () => document.querySelectorAll<HTMLElement>(".login-tab-btn").length >= 2,
  );
  const registerTab = Array.from(
    document.querySelectorAll<HTMLElement>(".login-tab-btn"),
  ).find(
    (el) =>
      el.textContent?.includes(t("login_self_hosted_tab_register")) ||
      el.textContent?.includes("Đăng ký") ||
      el.textContent?.includes("Register"),
  );
  assert(
    Boolean(registerTab),
    "Register tab must exist in SelfHostedSetupForm",
  );
  if (registerTab) {
    await clickElement(registerTab);
    await flushMicrotasks(50);
  }

  // 5. Fill username and password
  await waitForDOM(() => document.querySelector("#server-username") !== null);
  const usernameInput = findElement<HTMLInputElement>("#server-username");
  const passwordInput = findElement<HTMLInputElement>("#server-password");
  await user.type(usernameInput, "admin");
  await user.type(passwordInput, "adminpassword123");

  const selfHostSubmitBtn = findElement<HTMLButtonElement>(
    'button[type="submit"]',
  );
  await clickElement(selfHostSubmitBtn);

  // 6. Master Password creation form
  await waitForDOM(
    () =>
      document.querySelector("#master-password") !== null &&
      document.querySelector("#confirm-password") !== null,
    "Master Password creation form did not render for Self-Hosted setup",
    35000,
  );

  const mpInput = findElement<HTMLInputElement>("#master-password");
  const confirmMpInput = findElement<HTMLInputElement>("#confirm-password");
  await user.type(mpInput, "SelfHostMasterPassword123!");
  await user.type(confirmMpInput, "SelfHostMasterPassword123!");

  const registerSubmitBtn = findElement<HTMLButtonElement>(
    'button[type="submit"]',
  );
  await clickElement(registerSubmitBtn);

  // 7. Vault unlocked to Main Shell
  await waitForDOM(
    () =>
      Boolean(
        accountStore.vaultConfigured &&
          !accountStore.isLocked &&
          (document.querySelector(".header-btn-new") ||
            document.querySelector(".app-nav") ||
            document.querySelector(".search-container")),
      ),
    "Vault view did not unlock after Self-Hosted registration",
    35000,
  );

  assert(
    accountStore.vaultConfigured === true,
    "Account store should record vault configured for Self-Hosted",
  );
  assert(
    !accountStore.isLocked,
    "Vault should be unlocked after Self-Hosted registration",
  );

  globalThis.fetch = originalFetch;
  cleanup();
  document.body.innerHTML = "";
}, 50000);
