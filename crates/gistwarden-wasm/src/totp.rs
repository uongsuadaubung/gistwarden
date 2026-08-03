use crate::errors::WasmError;
use totp_rs::{Algorithm, Secret, TOTP};
use url::Url;

/**
 * Bóc tách secret key (Base32) ra khỏi định dạng otpauth:// URI hoặc chuỗi mã khóa bí mật thô.
 */
pub fn parse_totp_secret(raw_secret: &str) -> String {
    let trimmed = raw_secret.trim();
    if trimmed.is_empty() {
        return String::new();
    }

    let secret_str = if trimmed.starts_with("otpauth://") || trimmed.contains("://") {
        if let Ok(parsed_url) = Url::parse(trimmed) {
            parsed_url
                .query_pairs()
                .find(|(k, _)| k.eq_ignore_ascii_case("secret"))
                .map(|(_, v)| v.into_owned())
                .unwrap_or_else(|| trimmed.to_string())
        } else {
            trimmed.to_string()
        }
    } else {
        trimmed.to_string()
    };

    secret_str
        .replace([' ', '-'], "")
        .trim_end_matches('=')
        .to_uppercase()
}

/**
 * Sinh mã TOTP 6 chữ số theo chuẩn RFC 6238 sử dụng crate totp-rs.
 */
pub fn generate_totp_code(
    secret_base32: &str,
    timestamp_ms: u64,
    period_secs: u64,
) -> Result<String, String> {
    let clean_secret = parse_totp_secret(secret_base32);
    if clean_secret.is_empty() {
        return Err(WasmError::TotpInvalidSecret.to_string());
    }

    let step = if period_secs == 0 { 30 } else { period_secs };
    let secret_bytes = Secret::Encoded(clean_secret)
        .to_bytes()
        .map_err(|_| WasmError::TotpInvalidSecret.to_string())?;

    let totp = TOTP::new_unchecked(Algorithm::SHA1, 6, 1, step, secret_bytes);

    Ok(totp.generate(timestamp_ms / 1000))
}
