# Báo Cáo Tự Động Rà Soát Toàn Bộ File và Function (Automated Codebase AST Audit)

> **Báo cáo này được tạo tự động bởi script `scripts/audit_functions.ts`**.
>
> - **Tổng số file (.ts, .tsx)**: **243**
> - **Tổng số hàm/methods/classes phát hiện được**: **596**

---

## Danh Sách Chi Tiết Theo File

### 📄 File: `apps/extension/build.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L41  | `compileSCSS`               | function  | ❌ Không (Internal) |
| L64  | `copyAssets`                | function  | ❌ Không (Internal) |
| L79  | `copyAssetsToDir`           | function  | ❌ Không (Internal) |
| L112 | `copyDirRecursive`          | function  | ❌ Không (Internal) |
| L141 | `createZipPackages`         | function  | ❌ Không (Internal) |
| L159 | `runCommandOrExit`          | function  | ❌ Không (Internal) |
| L174 | `runVerifications`          | function  | ❌ Không (Internal) |
| L190 | `runBuild`                  | function  | ❌ Không (Internal) |
| L210 | `setup`                     | method    | ❌ Không (Internal) |

### 📄 File: `apps/extension/src/extension/autofill-content-script.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L132 | `checkPendingNotification`  | arrow     | ❌ Không (Internal) |

### 📄 File: `apps/extension/src/extension/autofill-core.ts`

| Dòng | Tên Hàm / Component / Class    | Phân Loại | Exported?           |
| :--- | :----------------------------- | :-------- | :------------------ |
| L11  | `setInputValue`                | function  | ✅ Có               |
| L44  | `isLoginKeywordMatch`          | function  | ❌ Không (Internal) |
| L49  | `submitElementFoundAndClicked` | function  | ❌ Không (Internal) |
| L77  | `autoSubmitLogin`              | function  | ✅ Có               |
| L115 | `performAutofill`              | function  | ✅ Có               |
| L233 | `extractSubmittedCredentials`  | function  | ✅ Có               |
| L310 | `setupFormSubmitMonitoring`    | function  | ✅ Có               |
| L315 | `triggerSubmission`            | arrow     | ❌ Không (Internal) |
| L361 | `isSearchOrFilterInput`        | function  | ✅ Có               |
| L392 | `isCandidateLoginInput`        | function  | ✅ Có               |
| L428 | `setupAutofillFocusMonitoring` | function  | ✅ Có               |
| L431 | `handleFocus`                  | arrow     | ❌ Không (Internal) |

### 📄 File: `apps/extension/src/extension/background-alarms.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L18  | `updateTimeoutAlarm`        | function  | ✅ Có     |
| L47  | `setupAlarmsListener`       | function  | ✅ Có     |

### 📄 File: `apps/extension/src/extension/background-badge.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L7   | `updateExtensionBadge`      | function  | ✅ Có     |
| L46  | `syncLockStateBadge`        | function  | ✅ Có     |

### 📄 File: `apps/extension/src/extension/background-idle.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L12  | `setupIdleListener`         | function  | ✅ Có     |

### 📄 File: `apps/extension/src/extension/background.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L35  | `initSession`               | function  | ❌ Không (Internal) |

### 📄 File: `apps/extension/src/extension/fido2-content-script.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `apps/extension/src/extension/fido2-page-script.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L52  | `base64UrlToBuffer`         | function  | ❌ Không (Internal) |
| L77  | `bufferToBase64Url`         | function  | ❌ Không (Internal) |
| L116 | `sendToContentScript`       | function  | ❌ Không (Internal) |

### 📄 File: `apps/extension/src/extension/handlers/auth-handlers.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L9   | `handleFido2Heartbeat`      | function  | ✅ Có     |
| L14  | `handleUserActivity`        | function  | ✅ Có     |
| L23  | `registerAuthRoutes`        | function  | ✅ Có     |

### 📄 File: `apps/extension/src/extension/handlers/autofill-handlers.ts`

| Dòng | Tên Hàm / Component / Class       | Phân Loại | Exported? |
| :--- | :-------------------------------- | :-------- | :-------- |
| L26  | `handleSaveCredentialAction`      | function  | ✅ Có     |
| L32  | `handleCheckAutofillSuggestion`   | function  | ✅ Có     |
| L38  | `handleCheckPendingNotification`  | function  | ✅ Có     |
| L63  | `handleCredentialsSubmitted`      | function  | ✅ Có     |
| L76  | `handleSaveCredentialActionRoute` | function  | ✅ Có     |
| L94  | `registerAutofillRoutes`          | function  | ✅ Có     |

### 📄 File: `apps/extension/src/extension/handlers/fido2-handlers.ts`

| Dòng | Tên Hàm / Component / Class            | Phân Loại | Exported?           |
| :--- | :------------------------------------- | :-------- | :------------------ |
| L39  | `handleFido2CredentialRequestInternal` | function  | ❌ Không (Internal) |
| L83  | `handleFido2CredentialCreationRequest` | function  | ✅ Có               |
| L94  | `handleFido2CredentialGetRequest`      | function  | ✅ Có               |
| L105 | `handleGetPendingFido2Request`         | function  | ✅ Có               |
| L122 | `handleResolveFido2Request`            | function  | ✅ Có               |
| L141 | `handleRejectFido2Request`             | function  | ✅ Có               |
| L160 | `registerFido2Routes`                  | function  | ✅ Có               |

### 📄 File: `apps/extension/src/extension/handlers/report-handlers.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L9   | `registerReportRoutes`      | function  | ✅ Có     |

### 📄 File: `apps/extension/src/extension/handlers/sync-handlers.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L15  | `registerSyncRoutes`        | function  | ✅ Có     |

### 📄 File: `apps/extension/src/extension/message-router.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L37  | `isRegisteredRoute`         | function  | ❌ Không (Internal) |
| L49  | `isRouteContract`           | function  | ❌ Không (Internal) |
| L56  | `isZodSchema`               | function  | ❌ Không (Internal) |
| L60  | `isHandlerFn`               | function  | ❌ Không (Internal) |
| L66  | `MessageRouter`             | class     | ✅ Có               |
| L189 | `listen`                    | method    | ❌ Không (Internal) |
| L213 | `hasRoute`                  | method    | ❌ Không (Internal) |

### 📄 File: `apps/extension/src/guide-entry.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `apps/extension/src/popup-entry.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L256 | `resetTimeout`              | arrow     | ❌ Không (Internal) |

### 📄 File: `apps/web/build.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L31  | `compileSCSS`               | function  | ❌ Không (Internal) |
| L48  | `copyAssets`                | function  | ❌ Không (Internal) |
| L58  | `runBuild`                  | function  | ❌ Không (Internal) |
| L64  | `setup`                     | method    | ❌ Không (Internal) |

### 📄 File: `apps/web/src/web-entry.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L4   | `WebApp`                    | function  | ❌ Không (Internal) |

### 📄 File: `packages/domain/mod.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/domain/src/cbor-utils.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L6   | `concatBytes`               | function  | ✅ Có     |
| L18  | `cborEncodeLength`          | function  | ✅ Có     |
| L37  | `cborTextString`            | function  | ✅ Có     |
| L42  | `cborByteString`            | function  | ✅ Có     |
| L46  | `cborMapHeader`             | function  | ✅ Có     |
| L50  | `cborPositiveInt`           | function  | ✅ Có     |
| L54  | `cborNegativeInt`           | function  | ✅ Có     |
| L60  | `packAttestationObject`     | function  | ✅ Có     |
| L73  | `encodeCoseEC2PublicKey`    | function  | ✅ Có     |

### 📄 File: `packages/domain/src/constants.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/domain/src/crypto.ts`

| Dòng | Tên Hàm / Component / Class    | Phân Loại | Exported?           |
| :--- | :----------------------------- | :-------- | :------------------ |
| L8   | `deriveKey`                    | function  | ✅ Có               |
| L34  | `encryptData`                  | function  | ✅ Có               |
| L59  | `decryptData`                  | function  | ✅ Có               |
| L91  | `generateSalt`                 | function  | ✅ Có               |
| L95  | `arrayBufferToBase64`          | function  | ✅ Có               |
| L99  | `base64ToArrayBuffer`          | function  | ✅ Có               |
| L112 | `computeHmac`                  | function  | ✅ Có               |
| L140 | `hashValue`                    | function  | ✅ Có               |
| L169 | `importAesGcmKey`              | function  | ✅ Có               |
| L192 | `Asn1Reader`                   | class     | ❌ Không (Internal) |
| L201 | `readTag`                      | method    | ❌ Không (Internal) |
| L206 | `readLength`                   | method    | ❌ Không (Internal) |
| L220 | `readIntegerBytes`             | method    | ❌ Không (Internal) |
| L230 | `readSequence`                 | method    | ❌ Không (Internal) |
| L245 | `encodeMpint`                  | function  | ❌ Không (Internal) |
| L262 | `parseLegacyRsaPem`            | function  | ❌ Không (Internal) |
| L313 | `SshBufferReader`              | class     | ❌ Không (Internal) |
| L325 | `readUint32`                   | method    | ❌ Không (Internal) |
| L332 | `readBytes`                    | method    | ❌ Không (Internal) |
| L339 | `readString`                   | method    | ❌ Không (Internal) |
| L345 | `readStringBytes`              | method    | ❌ Không (Internal) |
| L352 | `parseSshKey`                  | function  | ✅ Có               |
| L537 | `hashPasswordSHA1PrefixSuffix` | function  | ✅ Có               |

### 📄 File: `packages/domain/src/csv-parser.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L7   | `parseCSV`                  | function  | ✅ Có     |

### 📄 File: `packages/domain/src/domain-utils.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L10  | `safeParseUrl`              | function  | ✅ Có     |
| L22  | `getHostname`               | function  | ✅ Có     |
| L41  | `getBaseDomain`             | function  | ✅ Có     |
| L53  | `getDomainFromItem`         | function  | ✅ Có     |
| L68  | `extractDomainFromTabUrl`   | function  | ✅ Có     |

### 📄 File: `packages/domain/src/fido2-schemas.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/domain/src/generator-utils.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L10  | `getRandomBoundedInt`       | function  | ✅ Có               |
| L34  | `generatePassword`          | function  | ✅ Có               |
| L75  | `getRandomChar`             | arrow     | ❌ Không (Internal) |
| L114 | `generatePassphrase`        | function  | ✅ Có               |

### 📄 File: `packages/domain/src/i18n.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L815 | `setLanguage`               | function  | ✅ Có     |
| L824 | `initI18n`                  | function  | ✅ Có     |
| L833 | `t`                         | function  | ✅ Có     |
| L850 | `formatDateTime`            | function  | ✅ Có     |

### 📄 File: `packages/domain/src/json-utils.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L5   | `safeJsonParse`             | function  | ✅ Có     |

### 📄 File: `packages/domain/src/locales/en.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/domain/src/locales/vi.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/domain/src/logger.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/domain/src/password-strength.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L20  | `evaluatePasswordStrength`  | function  | ✅ Có     |

### 📄 File: `packages/domain/src/session-manager.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L3   | `getSessionKeyInMemory`     | function  | ✅ Có     |
| L7   | `setSessionKeyInMemory`     | function  | ✅ Có     |
| L11  | `clearSessionKeyInMemory`   | function  | ✅ Có     |
| L15  | `isSessionKeyUnlocked`      | function  | ✅ Có     |

### 📄 File: `packages/domain/src/session-signal.ts`

| Dòng | Tên Hàm / Component / Class  | Phân Loại | Exported?           |
| :--- | :--------------------------- | :-------- | :------------------ |
| L3   | `createSessionStorageSignal` | function  | ✅ Có               |
| L13  | `setSessionSignal`           | arrow     | ❌ Không (Internal) |
| L21  | `createSessionSignal`        | function  | ✅ Có               |
| L25  | `createSessionSignal`        | function  | ✅ Có               |
| L29  | `createSessionSignal`        | function  | ✅ Có               |

### 📄 File: `packages/domain/src/totp-utils.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L11  | `parseTotpSecret`           | function  | ✅ Có     |
| L31  | `safeDecodeQr`              | function  | ✅ Có     |
| L46  | `generateTotpSafe`          | function  | ✅ Có     |

### 📄 File: `packages/domain/src/types.ts`

| Dòng | Tên Hàm / Component / Class          | Phân Loại | Exported? |
| :--- | :----------------------------------- | :-------- | :-------- |
| L47  | `createSuccessPayloadResponseSchema` | function  | ✅ Có     |

### 📄 File: `packages/domain/src/vault-domain-matching.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L9   | `isSingleUriMatch`          | function  | ✅ Có     |
| L55  | `isMatchingDomain`          | function  | ✅ Có     |
| L71  | `isExactDomainMatch`        | function  | ✅ Có     |
| L87  | `sortVaultItemsByName`      | function  | ✅ Có     |
| L96  | `filterMatchingDomainItems` | function  | ✅ Có     |
| L139 | `filterVaultItemsByQuery`   | function  | ✅ Có     |

### 📄 File: `packages/domain/src/vault-item-utils.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L11  | `mapCustomFields`           | function  | ✅ Có               |
| L46  | `createBaseVaultItem`       | function  | ✅ Có               |
| L63  | `isVaultItemType`           | function  | ❌ Không (Internal) |
| L71  | `getSubPayload`             | function  | ❌ Không (Internal) |
| L133 | `mergeVaultItem`            | function  | ✅ Có               |
| L172 | `createDefaultVaultItem`    | function  | ✅ Có               |

### 📄 File: `packages/domain/src/vault-schemas.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L148 | `isObjectRecord`            | function  | ❌ Không (Internal) |

### 📄 File: `packages/domain/src/vault-types.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/domain/src/vietnamese-wordlist.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/domain/src/wordlist.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/network/mod.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/network/src/breach-api.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L5   | `fetchPwnedPasswordsRange`  | function  | ✅ Có     |
| L33  | `fetchXposedOrNotBreach`    | function  | ✅ Có     |

### 📄 File: `packages/network/src/fetch-utils.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L8   | `safeFetch`                 | function  | ✅ Có     |
| L19  | `fetchText`                 | function  | ✅ Có     |
| L54  | `fetchJson`                 | function  | ✅ Có     |
| L83  | `fetchBlob`                 | function  | ✅ Có     |

### 📄 File: `packages/network/src/github-api.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L39  | `githubRequest`             | function  | ❌ Không (Internal) |
| L68  | `validateToken`             | function  | ✅ Có               |
| L99  | `findGistId`                | function  | ✅ Có               |
| L114 | `createGist`                | function  | ✅ Có               |
| L139 | `updateGist`                | function  | ✅ Có               |
| L156 | `uploadToGist`              | function  | ✅ Có               |
| L197 | `getGist`                   | function  | ✅ Có               |
| L243 | `downloadFromGistPublic`    | function  | ✅ Có               |
| L274 | `downloadFromGist`          | function  | ✅ Có               |
| L322 | `deleteGist`                | function  | ✅ Có               |
| L337 | `launchGithubOauthFlow`     | function  | ✅ Có               |

### 📄 File: `packages/network/src/github-gist-provider.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L15  | `GithubGistProvider`        | class     | ✅ Có               |
| L19  | `upload`                    | method    | ❌ Không (Internal) |
| L23  | `download`                  | method    | ❌ Không (Internal) |
| L27  | `delete`                    | method    | ❌ Không (Internal) |

### 📄 File: `packages/network/src/sync-provider-registry.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L10  | `registerSyncProvider`      | function  | ✅ Có     |
| L14  | `getSyncProvider`           | function  | ✅ Có     |

### 📄 File: `packages/network/src/sync-provider-types.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/orchestrator/mod.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/orchestrator/src/alarms.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L4   | `hasAlarms`                 | function  | ✅ Có     |
| L8   | `createAlarm`               | function  | ✅ Có     |
| L22  | `clearAlarm`                | function  | ✅ Có     |
| L41  | `onAlarm`                   | function  | ✅ Có     |

### 📄 File: `packages/orchestrator/src/crypto-usecases.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L16  | `clearDerivedKey`           | function  | ✅ Có     |
| L20  | `setDerivedKey`             | function  | ✅ Có     |
| L24  | `getOrDeriveKey`            | function  | ✅ Có     |
| L42  | `getSessionKey`             | function  | ✅ Có     |
| L46  | `verifyMasterPassword`      | function  | ✅ Có     |

### 📄 File: `packages/orchestrator/src/idle.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L5   | `hasIdle`                   | function  | ✅ Có     |
| L17  | `onIdleStateChanged`        | function  | ✅ Có     |

### 📄 File: `packages/orchestrator/src/messaging-contracts.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L226 | `isValidResponse`           | function  | ✅ Có     |

### 📄 File: `packages/orchestrator/src/messaging.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L19  | `defineRoute`               | function  | ✅ Có     |
| L42  | `onExtensionMessage`        | function  | ✅ Có     |
| L62  | `sendBackgroundMessage`     | function  | ✅ Có     |
| L104 | `notifyBackground`          | function  | ✅ Có     |
| L126 | `broadcastMessage`          | function  | ✅ Có     |

### 📄 File: `packages/orchestrator/src/pending-notification-manager.ts`

| Dòng | Tên Hàm / Component / Class   | Phân Loại | Exported?           |
| :--- | :---------------------------- | :-------- | :------------------ |
| L14  | `isPendingTabNotification`    | function  | ❌ Không (Internal) |
| L20  | `isGlobalPendingNotification` | function  | ❌ Không (Internal) |
| L35  | `PendingNotificationManager`  | class     | ✅ Có               |
| L41  | `clearFido2Result`            | method    | ❌ Không (Internal) |
| L56  | `resolveFido2Callback`        | method    | ❌ Không (Internal) |
| L89  | `deleteTabNotification`       | method    | ❌ Không (Internal) |
| L116 | `clearAll`                    | method    | ❌ Không (Internal) |
| L131 | `persistFido2Result`          | method    | ❌ Không (Internal) |
| L141 | `checkAndFlushFido2Result`    | method    | ❌ Không (Internal) |
| L158 | `persistTabNotifications`     | method    | ❌ Không (Internal) |
| L167 | `loadTabNotifications`        | method    | ❌ Không (Internal) |
| L184 | `persistGlobalNotification`   | method    | ❌ Không (Internal) |
| L194 | `loadGlobalNotification`      | method    | ❌ Không (Internal) |

### 📄 File: `packages/orchestrator/src/report-usecases.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L15  | `checkPasswordHIBPUseCase`  | function  | ✅ Có     |
| L46  | `checkEmailBreachUseCase`   | function  | ✅ Có     |

### 📄 File: `packages/orchestrator/src/session-usecases.ts`

| Dòng | Tên Hàm / Component / Class    | Phân Loại | Exported? |
| :--- | :----------------------------- | :-------- | :-------- |
| L19  | `persistSessionKey`            | function  | ✅ Có     |
| L32  | `restoreSessionKeyFromStorage` | function  | ✅ Có     |
| L67  | `recordUserActivity`           | function  | ✅ Có     |
| L71  | `updateSessionTimeoutUseCase`  | function  | ✅ Có     |

### 📄 File: `packages/orchestrator/src/sync-usecases.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L19  | `uploadToGistUseCase`       | function  | ✅ Có     |
| L29  | `deleteGistUseCase`         | function  | ✅ Có     |
| L40  | `downloadFromGistUseCase`   | function  | ✅ Có     |
| L48  | `validateTokenUseCase`      | function  | ✅ Có     |
| L63  | `startGithubOauthUseCase`   | function  | ✅ Có     |

### 📄 File: `packages/orchestrator/src/vault-merge-usecase.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L8   | `parseTimestamp`            | function  | ❌ Không (Internal) |
| L14  | `mergeFolders`              | function  | ✅ Có               |
| L32  | `mergeVaultItems`           | function  | ✅ Có               |
| L91  | `mergeVaultPayload`         | function  | ✅ Có               |

### 📄 File: `packages/orchestrator/src/vault-mutation-usecases.ts`

| Dòng | Tên Hàm / Component / Class   | Phân Loại | Exported? |
| :--- | :---------------------------- | :-------- | :-------- |
| L17  | `executeVaultMutationUseCase` | function  | ✅ Có     |
| L46  | `addFolderUseCase`            | function  | ✅ Có     |
| L74  | `renameFolderUseCase`         | function  | ✅ Có     |
| L100 | `deleteFolderUseCase`         | function  | ✅ Có     |
| L114 | `saveItemUseCase`             | function  | ✅ Có     |
| L137 | `deleteVaultItemsUseCase`     | function  | ✅ Có     |
| L163 | `restoreVaultItemUseCase`     | function  | ✅ Có     |
| L184 | `purgeTrashItemUseCase`       | function  | ✅ Có     |
| L195 | `purgeAllTrashUseCase`        | function  | ✅ Có     |
| L205 | `clearVaultUseCase`           | function  | ✅ Có     |

### 📄 File: `packages/orchestrator/src/vault-sync-usecase.ts`

| Dòng | Tên Hàm / Component / Class       | Phân Loại | Exported? |
| :--- | :-------------------------------- | :-------- | :-------- |
| L24  | `fetchAndMergeRemoteVaultUseCase` | function  | ✅ Có     |
| L98  | `syncVaultToGist`                 | function  | ✅ Có     |

### 📄 File: `packages/repository/mod.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/repository/src/storage-schemas.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/repository/src/storage.ts`

| Dòng | Tên Hàm / Component / Class   | Phân Loại | Exported? |
| :--- | :---------------------------- | :-------- | :-------- |
| L26  | `isRecord`                    | function  | ✅ Có     |
| L30  | `hasLocalStorage`             | function  | ✅ Có     |
| L35  | `hasSessionStorage`           | function  | ✅ Có     |
| L40  | `hasStorageOnChanged`         | function  | ✅ Có     |
| L48  | `getExtensionSettings`        | function  | ✅ Có     |
| L63  | `updateExtensionSettings`     | function  | ✅ Có     |
| L81  | `getAccountSettings`          | function  | ✅ Có     |
| L98  | `updateAccountSettings`       | function  | ✅ Có     |
| L114 | `resetAccountSettings`        | function  | ✅ Có     |
| L128 | `getSessionItem`              | function  | ✅ Có     |
| L146 | `setSessionItem`              | function  | ✅ Có     |
| L162 | `getSessionItems`             | function  | ✅ Có     |
| L179 | `setSessionItems`             | function  | ✅ Có     |
| L193 | `removeSessionItem`           | function  | ✅ Có     |
| L207 | `configureSessionAccessLevel` | function  | ✅ Có     |
| L229 | `clearUnlockedSessionState`   | function  | ✅ Có     |
| L236 | `getGithubToken`              | function  | ✅ Có     |
| L292 | `isSessionUnlocked`           | function  | ✅ Có     |
| L298 | `setSessionUnlocked`          | function  | ✅ Có     |
| L306 | `clearLocal`                  | function  | ✅ Có     |
| L319 | `clearSession`                | function  | ✅ Có     |
| L332 | `getLocalItem`                | function  | ✅ Có     |
| L350 | `setLocalItem`                | function  | ✅ Có     |
| L366 | `removeLocalItem`             | function  | ✅ Có     |
| L381 | `getPasswordHistory`          | function  | ✅ Có     |
| L396 | `addPasswordHistoryItem`      | function  | ✅ Có     |
| L408 | `clearPasswordHistory`        | function  | ✅ Có     |

### 📄 File: `packages/repository/src/sync-schemas.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/mod.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/components/ui/BaseSlideModal.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L14  | `BaseSlideModal`            | function  | ✅ Có               |
| L23  | `triggerClose`              | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/components/ui/Button.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L24  | `btnClass`                  | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/components/ui/CardBrandIcon.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L8   | `normalized`                | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/components/ui/Checkbox.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L14  | `handleChange`              | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/components/ui/ConfirmModal.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L9   | `boxClass`                  | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/components/ui/CustomFieldModal.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L23  | `fieldTypeOptions`          | arrow     | ❌ Không (Internal) |
| L54  | `handleSave`                | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/components/ui/DetailHeader.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/components/ui/Favicon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/components/ui/FolderModal.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L37  | `handleSubmit`              | arrow     | ❌ Không (Internal) |
| L53  | `handleDelete`              | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/components/ui/FormField.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/components/ui/Header.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L44  | `handleOutsideClick`        | arrow     | ❌ Không (Internal) |
| L61  | `initials`                  | arrow     | ❌ Không (Internal) |
| L70  | `getTypeLabel`              | arrow     | ❌ Không (Internal) |
| L87  | `getTypeIcon`               | arrow     | ❌ Không (Internal) |
| L102 | `handleAddTypeClick`        | arrow     | ❌ Không (Internal) |
| L110 | `handleAddFolderClick`      | arrow     | ❌ Không (Internal) |
| L118 | `handleOpenGistClick`       | arrow     | ❌ Không (Internal) |
| L126 | `handleSyncClick`           | arrow     | ❌ Không (Internal) |
| L140 | `handleLockClick`           | arrow     | ❌ Không (Internal) |
| L146 | `handleLogoutClick`         | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/components/ui/Input.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L21  | `handleStepUp`              | arrow     | ❌ Không (Internal) |
| L29  | `handleStepDown`            | arrow     | ❌ Không (Internal) |
| L80  | `checkCapsLock`             | arrow     | ❌ Không (Internal) |
| L86  | `isPasswordInput`           | arrow     | ❌ Không (Internal) |
| L94  | `showWarning`               | arrow     | ❌ Không (Internal) |
| L96  | `currentType`               | arrow     | ❌ Không (Internal) |
| L131 | `builtInActions`            | arrow     | ❌ Không (Internal) |
| L138 | `baseRightActions`          | arrow     | ❌ Không (Internal) |
| L144 | `effectiveRightActions`     | arrow     | ❌ Không (Internal) |
| L151 | `hasActions`                | arrow     | ❌ Không (Internal) |
| L154 | `inputClass`                | arrow     | ❌ Không (Internal) |
| L164 | `wrapperClass`              | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/components/ui/PasswordStrengthMeter.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/components/ui/RepromptModal.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L28  | `handleConfirm`             | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/components/ui/RouteTransition.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/components/ui/Select.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L32  | `handleClickOutside`        | arrow     | ❌ Không (Internal) |
| L49  | `selectedOption`            | arrow     | ❌ Không (Internal) |
| L55  | `handleSelect`              | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/core/app-init.ts`

| Dòng | Tên Hàm / Component / Class   | Phân Loại | Exported?           |
| :--- | :---------------------------- | :-------- | :------------------ |
| L48  | `handleBrowserRestartCleanup` | function  | ❌ Không (Internal) |
| L71  | `loadAndApplyTheme`           | function  | ✅ Có               |
| L83  | `fetchEncryptedVaultContent`  | function  | ❌ Không (Internal) |
| L107 | `resolveSavedViewAndItem`     | function  | ❌ Không (Internal) |
| L155 | `loadAndDecryptVault`         | function  | ❌ Không (Internal) |
| L160 | `handleInitError`             | arrow     | ❌ Không (Internal) |
| L206 | `applyInitialView`            | function  | ❌ Không (Internal) |
| L221 | `init`                        | function  | ✅ Có               |

### 📄 File: `packages/ui/src/core/clipboard-utils.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L8   | `writeClipboardText`        | function  | ✅ Có     |

### 📄 File: `packages/ui/src/core/navigation.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L16  | `NavigationManager`         | class     | ✅ Có               |
| L19  | `setNavigator`              | method    | ❌ Không (Internal) |
| L23  | `getNavigator`              | method    | ❌ Không (Internal) |
| L27  | `navigate`                  | method    | ❌ Không (Internal) |
| L36  | `setActiveNavigator`        | function  | ✅ Có               |
| L40  | `navigatePath`              | function  | ✅ Có               |
| L55  | `navigate`                  | function  | ✅ Có               |
| L60  | `setCurrentSelectedItem`    | function  | ❌ Không (Internal) |
| L73  | `selectItem`                | function  | ✅ Có               |
| L77  | `openItem`                  | function  | ✅ Có               |

### 📄 File: `packages/ui/src/core/popout-utils.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L9   | `handlePopout`              | arrow     | ✅ Có     |

### 📄 File: `packages/ui/src/core/router.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L40  | `getViewPath`               | function  | ✅ Có               |
| L44  | `getPathView`               | function  | ✅ Có               |
| L58  | `getPathDepth`              | function  | ✅ Có               |
| L74  | `get`                       | method    | ❌ Không (Internal) |
| L87  | `calculateTransition`       | function  | ✅ Có               |

### 📄 File: `packages/ui/src/core/runtime.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L6   | `hasRuntime`                | function  | ✅ Có     |
| L14  | `getAssetUrl`               | function  | ✅ Có     |
| L25  | `getAppVersion`             | function  | ✅ Có     |
| L36  | `getExtensionId`            | function  | ✅ Có     |
| L46  | `isFirefox`                 | function  | ✅ Có     |
| L54  | `isEdge`                    | function  | ✅ Có     |

### 📄 File: `packages/ui/src/core/store.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L158 | `applyVaultPayloadToStore`  | function  | ✅ Có     |
| L166 | `resetAccountStore`         | function  | ✅ Có     |
| L173 | `resetUiStore`              | function  | ✅ Có     |
| L179 | `loadAllStores`             | function  | ✅ Có     |

### 📄 File: `packages/ui/src/core/tabs.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L7   | `getCurrentTab`             | function  | ✅ Có     |
| L26  | `sendMessageToTab`          | function  | ✅ Có     |
| L50  | `captureVisibleTab`         | function  | ✅ Có     |
| L76  | `openTab`                   | function  | ✅ Có     |
| L106 | `openPopup`                 | function  | ✅ Có     |

### 📄 File: `packages/ui/src/core/ui-service.ts`

| Dòng | Tên Hàm / Component / Class  | Phân Loại | Exported? |
| :--- | :--------------------------- | :-------- | :-------- |
| L29  | `showToast`                  | function  | ✅ Có     |
| L42  | `copyToClipboardWithMessage` | function  | ✅ Có     |
| L57  | `setGlobalLoading`           | function  | ✅ Có     |
| L64  | `confirm`                    | function  | ✅ Có     |
| L80  | `resolveConfirm`             | function  | ✅ Có     |
| L94  | `requestReprompt`            | function  | ✅ Có     |
| L103 | `resolveReprompt`            | function  | ✅ Có     |
| L114 | `updateLanguage`             | function  | ✅ Có     |
| L120 | `updateTheme`                | function  | ✅ Có     |
| L134 | `syncTimeOffset`             | function  | ✅ Có     |

### 📄 File: `packages/ui/src/features/auth/AccountSecurity.tsx`

| Dòng | Tên Hàm / Component / Class  | Phân Loại | Exported?           |
| :--- | :--------------------------- | :-------- | :------------------ |
| L24  | `handleBack`                 | arrow     | ❌ Không (Internal) |
| L28  | `handlePinToggle`            | arrow     | ❌ Không (Internal) |
| L48  | `handleSavePin`              | arrow     | ❌ Không (Internal) |
| L64  | `handleRequireRestartChange` | arrow     | ❌ Không (Internal) |
| L80  | `isPinEnabled`               | arrow     | ❌ Không (Internal) |
| L81  | `isRequireRestart`           | arrow     | ❌ Không (Internal) |
| L82  | `currentTimeout`             | arrow     | ❌ Không (Internal) |
| L83  | `currentTimeoutAction`       | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/auth/auth-service.ts`

| Dòng | Tên Hàm / Component / Class     | Phân Loại | Exported?           |
| :--- | :------------------------------ | :-------- | :------------------ |
| L92  | `setupUnlockedSession`          | function  | ❌ Không (Internal) |
| L141 | `resolveGistContent`            | function  | ❌ Không (Internal) |
| L177 | `createNewVault`                | function  | ✅ Có               |
| L252 | `fetchEncryptedVaultContent`    | function  | ✅ Có               |
| L273 | `decryptGistVault`              | function  | ✅ Có               |
| L346 | `verifyMasterPasswordSecurity`  | function  | ✅ Có               |
| L383 | `recordMasterPasswordFailure`   | function  | ✅ Có               |
| L406 | `resetMasterPasswordSecurity`   | function  | ✅ Có               |
| L420 | `unlock`                        | function  | ✅ Có               |
| L568 | `unlockVaultWithKey`            | function  | ✅ Có               |
| L611 | `unlockVaultWithMasterPassword` | function  | ✅ Có               |
| L659 | `clearPinUnlockState`           | function  | ❌ Không (Internal) |
| L666 | `handlePinFailure`              | function  | ❌ Không (Internal) |
| L680 | `unlockVaultWithPin`            | function  | ✅ Có               |
| L784 | `lockVaultSession`              | function  | ✅ Có               |
| L803 | `logoutVaultSession`            | function  | ✅ Có               |
| L815 | `lock`                          | function  | ✅ Có               |
| L819 | `logout`                        | function  | ✅ Có               |
| L823 | `acceptWelcome`                 | function  | ✅ Có               |
| L829 | `reloadVaultItems`              | function  | ✅ Có               |
| L846 | `updateSessionTimeout`          | function  | ✅ Có               |

### 📄 File: `packages/ui/src/features/auth/ChangeMasterPassword.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L18  | `handleBack`                | arrow     | ❌ Không (Internal) |
| L22  | `handleChangePassword`      | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/auth/components/GithubSetupForm.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L17  | `handleSubmit`              | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/auth/components/MasterPasswordCreate.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L18  | `handleSubmit`              | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/auth/components/MasterPasswordForm.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L19  | `handleSubmit`              | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/auth/Login.tsx`

| Dòng | Tên Hàm / Component / Class  | Phân Loại | Exported?           |
| :--- | :--------------------------- | :-------- | :------------------ |
| L108 | `handlePinUnlock`            | arrow     | ❌ Không (Internal) |
| L118 | `handleSaveToken`            | arrow     | ❌ Không (Internal) |
| L132 | `handleGithubOauth`          | arrow     | ❌ Không (Internal) |
| L136 | `handleOauthError`           | arrow     | ❌ Không (Internal) |
| L164 | `handleCreateMasterPassword` | arrow     | ❌ Không (Internal) |
| L178 | `handleUnlock`               | arrow     | ❌ Không (Internal) |
| L193 | `handleResetToken`           | arrow     | ❌ Không (Internal) |
| L198 | `handleForgotPassword`       | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/auth/master-password-service.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L20  | `changeMasterPassword`      | function  | ✅ Có     |

### 📄 File: `packages/ui/src/features/auth/pin-service.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L16  | `setPinUnlock`              | function  | ✅ Có     |
| L64  | `unlockWithPin`             | function  | ✅ Có     |
| L70  | `disablePinUnlock`          | function  | ✅ Có     |

### 📄 File: `packages/ui/src/features/auth/PinUnlockForm.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L15  | `handleSubmit`              | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/auth/SetPinModal.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L34  | `handleSave`                | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/generator/Generator.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L53  | `generate`                  | arrow     | ❌ Không (Internal) |
| L61  | `handleGeneratePassword`    | arrow     | ❌ Không (Internal) |
| L83  | `handleGeneratePassphrase`  | arrow     | ❌ Không (Internal) |
| L101 | `handleCopy`                | arrow     | ❌ Không (Internal) |
| L121 | `handleLengthChange`        | arrow     | ❌ Không (Internal) |
| L133 | `handleMinNumbersChange`    | arrow     | ❌ Không (Internal) |
| L143 | `handleMinSpecialsChange`   | arrow     | ❌ Không (Internal) |
| L154 | `handleNumWordsChange`      | arrow     | ❌ Không (Internal) |
| L166 | `handleWordSeparatorChange` | arrow     | ❌ Không (Internal) |
| L171 | `renderHighlightedPassword` | arrow     | ❌ Không (Internal) |
| L179 | `chars`                     | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/generator/PasswordHistory.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L17  | `loadHistory`               | arrow     | ❌ Không (Internal) |
| L28  | `handleCopyItem`            | arrow     | ❌ Không (Internal) |
| L34  | `handleClearHistory`        | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/guide/components/FaqTab.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/guide/components/GeneralTab.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/guide/components/GistTab.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/guide/components/ImportExportTab.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/guide/components/PasskeyTab.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/guide/components/PrivacyTab.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/guide/components/SecurityTab.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/guide/components/TotpTab.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/guide/Guide.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L45  | `handleLangChange`          | arrow     | ❌ Không (Internal) |
| L49  | `handleOpenGist`            | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/notification/index.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/notification/notification-bar.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L8   | `NotificationBarManager`    | class     | ✅ Có               |
| L25  | `isUnloading`               | method    | ❌ Không (Internal) |
| L29  | `removeNotificationBar`     | method    | ❌ Không (Internal) |
| L41  | `showNotificationBar`       | method    | ❌ Không (Internal) |
| L97  | `removeNotificationBar`     | function  | ✅ Có               |
| L101 | `showNotificationBar`       | function  | ✅ Có               |

### 📄 File: `packages/ui/src/features/notification/notification-toast.styles.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L269 | `attachNotificationStyles`  | function  | ✅ Có     |

### 📄 File: `packages/ui/src/features/notification/NotificationToast.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L18  | `NotificationToast`         | function  | ✅ Có               |
| L45  | `triggerCloseWithAnimation` | arrow     | ❌ Không (Internal) |
| L58  | `startAutoDismiss`          | arrow     | ❌ Không (Internal) |
| L65  | `handleKeyDown`             | arrow     | ❌ Không (Internal) |
| L89  | `handleMouseEnter`          | arrow     | ❌ Không (Internal) |
| L99  | `handleMouseLeave`          | arrow     | ❌ Không (Internal) |
| L109 | `handleAction`              | arrow     | ❌ Không (Internal) |
| L127 | `handleFillAccount`         | arrow     | ❌ Không (Internal) |
| L135 | `userDisplay`               | arrow     | ❌ Không (Internal) |
| L142 | `headerTitle`               | arrow     | ❌ Không (Internal) |
| L154 | `actionPromptPrefix`        | arrow     | ❌ Không (Internal) |
| L163 | `actionPromptSuffix`        | arrow     | ❌ Không (Internal) |
| L172 | `confirmBtnText`            | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/passkey/fido2-service.ts`

| Dòng | Tên Hàm / Component / Class    | Phân Loại | Exported? |
| :--- | :----------------------------- | :-------- | :-------- |
| L51  | `findMatchingFido2Accounts`    | function  | ✅ Có     |
| L67  | `findMatchingFido2Credentials` | function  | ✅ Có     |
| L97  | `registerFido2Passkey`         | function  | ✅ Có     |
| L180 | `assertFido2Passkey`           | function  | ✅ Có     |
| L241 | `rejectFido2Request`           | function  | ✅ Có     |

### 📄 File: `packages/ui/src/features/passkey/Fido2Prompt.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L84  | `initPasskeyOptions`        | arrow     | ❌ Không (Internal) |
| L156 | `loadPendingRequest`        | arrow     | ❌ Không (Internal) |
| L190 | `findMatchingPasskeys`      | arrow     | ❌ Không (Internal) |
| L195 | `handleUnlock`              | arrow     | ❌ Không (Internal) |
| L215 | `handlePinUnlock`           | arrow     | ❌ Không (Internal) |
| L232 | `handleConfirmRegister`     | arrow     | ❌ Không (Internal) |
| L253 | `handleConfirmAssert`       | arrow     | ❌ Không (Internal) |
| L273 | `handleReject`              | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/passkey/passkey-crypto.ts`

| Dòng | Tên Hàm / Component / Class       | Phân Loại | Exported?           |
| :--- | :-------------------------------- | :-------- | :------------------ |
| L31  | `encodeDerInteger`                | function  | ❌ Không (Internal) |
| L55  | `p1363ToDer`                      | function  | ✅ Có               |
| L73  | `bufferToBase64Url`               | function  | ✅ Có               |
| L78  | `base64UrlToBuffer`               | function  | ✅ Có               |
| L89  | `exportKeyJwkAsync`               | function  | ✅ Có               |
| L102 | `exportKeyBufferAsync`            | function  | ✅ Có               |
| L133 | `importKeyAsync`                  | function  | ✅ Có               |
| L151 | `digestAsync`                     | function  | ✅ Có               |
| L165 | `signAsync`                       | function  | ✅ Có               |
| L186 | `createPasskeyKeyPair`            | function  | ✅ Có               |
| L217 | `generateAuthData`                | function  | ✅ Có               |
| L287 | `generateAssertionSignature`      | function  | ✅ Có               |
| L314 | `getRawCredentialId`              | function  | ✅ Có               |
| L363 | `generatePasskeyRegisterResponse` | function  | ✅ Có               |
| L465 | `generatePasskeyAssertResponse`   | function  | ✅ Có               |

### 📄 File: `packages/ui/src/features/passkey/PasskeySelectRow.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/reports/ReportDataBreach.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L17  | `handleCheckEmail`          | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/reports/ReportExposed.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L31  | `handleStartScan`           | arrow     | ❌ Không (Internal) |
| L82  | `handleEditItem`            | arrow     | ❌ Không (Internal) |
| L87  | `handleExportHtml`          | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/reports/ReportInactive2FA.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L22  | `handleEditItem`            | arrow     | ❌ Không (Internal) |
| L27  | `titleWithCount`            | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/reports/ReportReused.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L43  | `handleEditItem`            | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/reports/reports-service.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L14  | `formatVaultItemUsername`   | function  | ✅ Có     |
| L18  | `checkPasswordHIBPUseCase`  | function  | ✅ Có     |
| L60  | `checkEmailBreachUseCase`   | function  | ✅ Có     |

### 📄 File: `packages/ui/src/features/reports/Reports.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/reports/ReportUnsecure.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L22  | `handleUpgradeHttps`        | arrow     | ❌ Không (Internal) |
| L54  | `handleEditItem`            | arrow     | ❌ Không (Internal) |
| L59  | `titleWithCount`            | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/reports/ReportWeak.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L59  | `handleEditItem`            | arrow     | ❌ Không (Internal) |
| L64  | `titleWithCount`            | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/settings/About.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L21  | `handleBack`                | arrow     | ❌ Không (Internal) |
| L27  | `getRatingUrl`              | arrow     | ❌ Không (Internal) |
| L52  | `handleRateClick`           | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/settings/Appearance.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L12  | `handleBack`                | arrow     | ❌ Không (Internal) |
| L16  | `handleAnimationsToggle`    | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/settings/AutofillOptions.tsx`

| Dòng | Tên Hàm / Component / Class   | Phân Loại | Exported?           |
| :--- | :---------------------------- | :-------- | :------------------ |
| L11  | `handleBack`                  | arrow     | ❌ Không (Internal) |
| L15  | `handleAutoSubmitToggle`      | arrow     | ❌ Không (Internal) |
| L20  | `handleShowSuggestionsToggle` | arrow     | ❌ Không (Internal) |
| L36  | `isShowSuggestionsEnabled`    | arrow     | ❌ Không (Internal) |
| L38  | `isAutoSubmitEnabled`         | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/settings/Language.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L11  | `handleBack`                | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/settings/SessionTimeoutSettings.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L27  | `timeoutOptions`            | arrow     | ❌ Không (Internal) |
| L38  | `actionOptions`             | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/settings/Settings.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/settings/Theme.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L11  | `handleBack`                | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/settings/Troubleshooting.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L10  | `handleBack`                | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/sync/csv-export.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L9   | `exportToBrowserCsv`        | function  | ✅ Có     |
| L36  | `exportToBitwardenCsv`      | function  | ✅ Có     |

### 📄 File: `packages/ui/src/features/sync/csv-import.ts`

| Dòng | Tên Hàm / Component / Class    | Phân Loại | Exported?           |
| :--- | :----------------------------- | :-------- | :------------------ |
| L15  | `extractDomain`                | function  | ❌ Không (Internal) |
| L23  | `parseAndValidateBrowserCsv`   | function  | ✅ Có               |
| L112 | `parseAndValidateBitwardenCsv` | function  | ✅ Có               |

### 📄 File: `packages/ui/src/features/sync/ExportAccounts.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L19  | `handleBack`                | arrow     | ❌ Không (Internal) |
| L23  | `handleExportClick`         | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/sync/github-auth.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L15  | `setupGithub`               | function  | ✅ Có     |

### 📄 File: `packages/ui/src/features/sync/import-service.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L12  | `importJsonData`            | function  | ✅ Có     |
| L39  | `importCsvData`             | function  | ✅ Có     |

### 📄 File: `packages/ui/src/features/sync/ImportAccounts.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L20  | `handleBack`                | arrow     | ❌ Không (Internal) |
| L24  | `handleImportClick`         | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/sync/json-import.ts`

| Dòng | Tên Hàm / Component / Class  | Phân Loại | Exported? |
| :--- | :--------------------------- | :-------- | :-------- |
| L17  | `parseAndValidateImportJson` | function  | ✅ Có     |

### 📄 File: `packages/ui/src/features/sync/sync-merge.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/sync/sync-service.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L10  | `syncVault`                 | function  | ✅ Có     |

### 📄 File: `packages/ui/src/features/sync/sync-utils.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/vault/autofill-usecase.ts`

| Dòng | Tên Hàm / Component / Class                  | Phân Loại | Exported? |
| :--- | :------------------------------------------- | :-------- | :-------- |
| L28  | `processSubmittedCredentialsUseCase`         | function  | ✅ Có     |
| L106 | `processPendingUnapprovedCredentialsUseCase` | function  | ✅ Có     |
| L149 | `saveCredentialActionUseCase`                | function  | ✅ Có     |
| L190 | `checkAutofillSuggestionUseCase`             | function  | ✅ Có     |

### 📄 File: `packages/ui/src/features/vault/components/VaultBatchActionBar.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/vault/components/VaultFilterPanel.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L29  | `handleSelectType`          | arrow     | ❌ Không (Internal) |
| L34  | `handleSelectFolder`        | arrow     | ❌ Không (Internal) |
| L39  | `getFolderLabel`            | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/vault/components/VaultItemCopyMenu.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L23  | `isNotes`                   | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/vault/components/VaultItemOptionsMenu.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/vault/Folders.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L22  | `handleBack`                | arrow     | ❌ Không (Internal) |
| L26  | `handleEditFolder`          | arrow     | ❌ Không (Internal) |
| L31  | `handleNewFolder`           | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/vault/item-detail/CardDetailFields.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L15  | `isExpired`                 | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/vault/item-detail/IdentityDetailFields.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L17  | `getFullName`               | arrow     | ❌ Không (Internal) |
| L27  | `getFullAddress`            | arrow     | ❌ Không (Internal) |
| L40  | `hasPersonalDetails`        | arrow     | ❌ Không (Internal) |
| L45  | `hasIdentificationDetails`  | arrow     | ❌ Không (Internal) |
| L50  | `hasContactDetails`         | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/vault/item-detail/LoginDetailFields.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L35  | `strokeDashoffset`          | arrow     | ❌ Không (Internal) |
| L39  | `updateTotp`                | arrow     | ❌ Không (Internal) |
| L70  | `getFidoCredentials`        | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/vault/item-detail/NoteDetailFields.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/vault/item-detail/SshKeyDetailFields.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/vault/item-edit/CardEditFields.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/vault/item-edit/CustomFieldsEdit.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L23  | `initialField`              | arrow     | ❌ Không (Internal) |
| L28  | `handleOpenAddField`        | arrow     | ❌ Không (Internal) |
| L33  | `handleOpenEditField`       | arrow     | ❌ Không (Internal) |
| L53  | `handleCloseFieldModal`     | arrow     | ❌ Không (Internal) |
| L58  | `handleDragStart`           | arrow     | ❌ Không (Internal) |
| L65  | `handleDragOver`            | arrow     | ❌ Không (Internal) |
| L77  | `handleDragEnd`             | arrow     | ❌ Không (Internal) |
| L81  | `handleRemoveField`         | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/vault/item-edit/IdentityEditFields.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/vault/item-edit/LoginEditFields.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L32  | `toggleGear`                | arrow     | ❌ Không (Internal) |
| L36  | `isGearOpen`                | arrow     | ❌ Không (Internal) |
| L38  | `handleAddWebsite`          | arrow     | ❌ Không (Internal) |
| L44  | `handleUpdateWebsiteUri`    | arrow     | ❌ Không (Internal) |
| L52  | `handleMatchModeChange`     | arrow     | ❌ Không (Internal) |
| L94  | `handleDeleteWebsite`       | arrow     | ❌ Không (Internal) |
| L100 | `handleDragStart`           | arrow     | ❌ Không (Internal) |
| L108 | `handleDragOver`            | arrow     | ❌ Không (Internal) |
| L120 | `handleDragEnd`             | arrow     | ❌ Không (Internal) |
| L124 | `getDefaultMatchLabel`      | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/vault/item-edit/NoteEditFields.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/vault/item-edit/SshKeyEditFields.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L21  | `handlePasteSshKey`         | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/vault/item-edit/vault-edit-helper.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L66  | `getInitialFormState`       | function  | ✅ Có     |
| L171 | `mapFormStateToVaultItem`   | function  | ✅ Có     |
| L301 | `createDefaultVaultItem`    | function  | ✅ Có     |

### 📄 File: `packages/ui/src/features/vault/ItemDetail.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L91  | `toggleFieldVisibility`     | arrow     | ❌ Không (Internal) |
| L95  | `handleCopy`                | arrow     | ❌ Không (Internal) |
| L99  | `handleDelete`              | arrow     | ❌ Không (Internal) |
| L108 | `handleBackToVault`         | arrow     | ❌ Không (Internal) |
| L112 | `handleGoToEdit`            | arrow     | ❌ Không (Internal) |
| L134 | `getDetailIcon`             | arrow     | ❌ Không (Internal) |
| L329 | `renderTypeFields`          | function  | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/vault/ItemEdit.tsx`

| Dòng | Tên Hàm / Component / Class  | Phân Loại | Exported?           |
| :--- | :--------------------------- | :-------- | :------------------ |
| L37  | `isEdit`                     | arrow     | ❌ Không (Internal) |
| L80  | `handleScanQr`               | arrow     | ❌ Không (Internal) |
| L120 | `handleDelete`               | arrow     | ❌ Không (Internal) |
| L129 | `handleDeleteFidoCredential` | arrow     | ❌ Không (Internal) |
| L145 | `handleSave`                 | arrow     | ❌ Không (Internal) |
| L181 | `handleCancel`               | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/vault/Trash.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L33  | `handleBack`                | arrow     | ❌ Không (Internal) |
| L37  | `handleRestore`             | arrow     | ❌ Không (Internal) |
| L50  | `handlePurge`               | arrow     | ❌ Không (Internal) |
| L73  | `handlePurgeAll`            | arrow     | ❌ Không (Internal) |
| L101 | `getItemIcon`               | arrow     | ❌ Không (Internal) |
| L117 | `formatDate`                | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/vault/vault-domain-matching.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/vault/vault-repository.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L21  | `getDecryptedVaultItems`    | function  | ✅ Có     |

### 📄 File: `packages/ui/src/features/vault/vault-service.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L41  | `getOrBuildCurrentPayload`  | function  | ❌ Không (Internal) |
| L50  | `persistAndReconcileVault`  | function  | ✅ Có               |
| L67  | `addFolder`                 | function  | ✅ Có               |
| L78  | `renameFolder`              | function  | ✅ Có               |
| L90  | `deleteFolder`              | function  | ✅ Có               |
| L101 | `saveItem`                  | function  | ✅ Có               |
| L112 | `deleteItem`                | function  | ✅ Có               |
| L118 | `deleteVaultItems`          | function  | ✅ Có               |
| L129 | `restoreVaultItem`          | function  | ✅ Có               |
| L140 | `purgeTrashItem`            | function  | ✅ Có               |
| L151 | `purgeAllTrash`             | function  | ✅ Có               |
| L160 | `clearVault`                | function  | ✅ Có               |
| L172 | `batchSavePayloads`         | function  | ✅ Có               |

### 📄 File: `packages/ui/src/features/vault/vault-utils.ts`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported? |
| :--- | :-------------------------- | :-------- | :-------- |
| L13  | `getVaultItemTypeLabel`     | arrow     | ✅ Có     |
| L30  | `getVaultItemTitle`         | arrow     | ✅ Có     |
| L60  | `getVaultItemToastMsg`      | arrow     | ✅ Có     |
| L90  | `getVaultItemDetailTitle`   | arrow     | ✅ Có     |

### 📄 File: `packages/ui/src/features/vault/Vault.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L134 | `toggleFilterPanel`         | arrow     | ❌ Không (Internal) |
| L148 | `toggleSelectMode`          | arrow     | ❌ Không (Internal) |
| L154 | `toggleSelectItem`          | arrow     | ❌ Không (Internal) |
| L176 | `handleSelectAll`           | arrow     | ❌ Không (Internal) |
| L185 | `handleDeleteSelected`      | arrow     | ❌ Không (Internal) |
| L210 | `handleGlobalClick`         | arrow     | ❌ Không (Internal) |
| L237 | `fetchTab`                  | arrow     | ❌ Không (Internal) |
| L253 | `matchingItems`             | arrow     | ❌ Không (Internal) |
| L261 | `allItems`                  | arrow     | ❌ Không (Internal) |
| L279 | `cardItems`                 | arrow     | ❌ Không (Internal) |
| L283 | `identityItems`             | arrow     | ❌ Không (Internal) |
| L287 | `favoriteItems`             | arrow     | ❌ Không (Internal) |
| L296 | `regularItems`              | arrow     | ❌ Không (Internal) |
| L305 | `handleCopyText`            | arrow     | ❌ Không (Internal) |
| L311 | `handleCopyTotpDirect`      | arrow     | ❌ Không (Internal) |
| L334 | `handleToggleMenu`          | arrow     | ❌ Không (Internal) |
| L344 | `handleToggleOptionsMenu`   | arrow     | ❌ Không (Internal) |
| L356 | `handleContextMenuRow`      | arrow     | ❌ Không (Internal) |
| L368 | `handleSelectFromMenu`      | arrow     | ❌ Không (Internal) |
| L379 | `handleFavoriteItem`        | arrow     | ❌ Không (Internal) |
| L396 | `handleCloneItem`           | arrow     | ❌ Không (Internal) |
| L409 | `handleDeleteItem`          | arrow     | ❌ Không (Internal) |
| L415 | `handleFillItem`            | arrow     | ❌ Không (Internal) |
| L447 | `handleAddNewItem`          | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/vault/VaultItemRow.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L72  | `domain`                    | arrow     | ❌ Không (Internal) |
| L86  | `handleRowClick`            | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/vault/VaultOptions.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L35  | `handleBack`                | arrow     | ❌ Không (Internal) |
| L39  | `handleSync`                | arrow     | ❌ Không (Internal) |
| L55  | `handleClearVault`          | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/features/welcome/components/PasskeyIllustration.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/welcome/components/SecurityIllustration.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/welcome/components/TotpIllustration.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/welcome/components/WarningIllustration.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/features/welcome/Welcome.tsx`

| Dòng | Tên Hàm / Component / Class | Phân Loại | Exported?           |
| :--- | :-------------------------- | :-------- | :------------------ |
| L51  | `handleAcceptWelcome`       | arrow     | ❌ Không (Internal) |
| L57  | `handleNext`                | arrow     | ❌ Không (Internal) |
| L63  | `handlePrev`                | arrow     | ❌ Không (Internal) |

### 📄 File: `packages/ui/src/icons/svg/AppIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/ArrowLeftIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/AutofillIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/CapsLockIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/CardIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/ChevronDownIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/ChevronRightIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/ClipboardIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/CloseIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/CopyIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/DatabaseBreachIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/DownloadIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/DragIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/EditIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/EnIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/ExternalLinkIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/EyeIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/EyeOffIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/FilterIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/FolderIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/GaugeIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/GeneratorIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/GithubIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/GlobeIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/GlobeUnlockIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/HeartFilledIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/HeartOutlineIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/IdentityIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/index.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/InfoIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/KeyIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/ListCheckIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/ListIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/LockIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/LogoutIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/MinusCircleIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/MoonIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/MoreVerticalIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/NoteIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/PaletteIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/PlusIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/PopoutIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/QrIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/QuestionIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/RefreshIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/RepeatKeyIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/ReportsIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/SearchIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/SettingsIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/Shield2FAIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/ShieldAlertIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/ShieldIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/SshKeyIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/SunIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/SyncIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/ThemeIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/TrashIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/types.ts`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/UploadIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/VaultIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._

### 📄 File: `packages/ui/src/icons/svg/ViIcon.tsx`

_Không chứa định nghĩa hàm hoặc class trực tiếp (File types, schemas hoặc
re-exports thuần)._
