use thiserror::Error;

/// Standardized TranslationKey enum for Rust WASM matching packages/domain/src/i18n.ts
#[derive(Error, Debug, Clone, Copy, PartialEq, Eq)]
pub enum WasmError {
    #[error("crypto_error_encrypt_failed")]
    CryptoEncryptFailed,
    #[error("crypto_error_hmac_failed")]
    CryptoHmacFailed,
    #[error("crypto_error_invalid_signature")]
    CryptoInvalidSignature,

    #[error("totp_error_invalid_secret")]
    TotpInvalidSecret,

    #[error("ssh_invalid_key")]
    SshInvalidKey,

    #[error("gen_error_charset_empty")]
    GenCharsetEmpty,
    #[error("gen_error_min_exceeds_length")]
    GenMinExceedsLength,
    #[error("gen_error_invalid_words_count")]
    GenInvalidWordsCount,

    #[error("vault_import_error_invalid")]
    VaultImportInvalid,
    #[error("vault_import_csv_error_fail")]
    VaultImportCsvFail,
    #[error("vault_export_error_fail")]
    VaultExportFail,
    #[error("import_error_browser_invalid")]
    ImportBrowserInvalid,
    #[error("import_error_bitwarden_invalid")]
    ImportBitwardenInvalid,

    #[error("sync_error_invalid_format")]
    SyncInvalidFormat,

    #[error("edit_qr_error_no_match")]
    EditQrNoMatch,
    #[error("edit_qr_error_fail")]
    EditQrFail,

    #[error("fido2_error_create_failed")]
    Fido2CreateFailed,
    #[error("fido2_error_assert_failed")]
    Fido2AssertFailed,
    #[error("fido2_error_counter_update_failed")]
    Fido2CounterUpdateFailed,
}
