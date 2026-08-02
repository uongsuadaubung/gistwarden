use totp_rs::{Algorithm, Secret, TOTP};

/**
 * Bóc tách secret key (Base32) ra khỏi định dạng otpauth:// URI hoặc chuỗi mã khóa bí mật thô.
 */
pub fn parse_totp_secret(raw_secret: &str) -> String {
    let trimmed = raw_secret.trim();
    let lower = trimmed.to_lowercase();

    let secret_str = if lower.contains("secret=") {
        if let Some(pos) = lower.find("secret=") {
            let rest = &trimmed[pos + 7..];
            rest.split('&').next().unwrap_or(rest)
        } else {
            trimmed
        }
    } else {
        trimmed
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
        return Err("Empty TOTP secret".into());
    }

    let step = if period_secs == 0 { 30 } else { period_secs };
    let secret_bytes = Secret::Encoded(clean_secret)
        .to_bytes()
        .map_err(|e| format!("Invalid Base32 secret: {:?}", e))?;

    let totp = TOTP::new_unchecked(Algorithm::SHA1, 6, 1, step, secret_bytes);

    Ok(totp.generate(timestamp_ms / 1000))
}
