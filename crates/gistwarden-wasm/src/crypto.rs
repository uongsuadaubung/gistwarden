use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Algorithm, Argon2, Params, Version,
};
use hmac::{Hmac, Mac};
use sha1::{Digest as Sha1Digest, Sha1};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

pub fn aes_gcm_encrypt(plaintext: &[u8], key_bytes: &[u8], iv_bytes: &[u8]) -> Result<Vec<u8>, String> {
    use aes_gcm::{aead::Aead, Aes256Gcm, KeyInit, Nonce};
    if key_bytes.len() != 32 {
        return Err("Encryption key must be 32 bytes".to_string());
    }
    if iv_bytes.len() != 12 {
        return Err("IV must be 12 bytes".to_string());
    }
    let cipher = Aes256Gcm::new_from_slice(key_bytes).map_err(|e| e.to_string())?;
    let nonce = Nonce::from_slice(iv_bytes);
    cipher.encrypt(nonce, plaintext).map_err(|e| format!("AES-GCM Encryption failed: {}", e))
}

pub fn aes_gcm_decrypt(ciphertext_and_tag: &[u8], key_bytes: &[u8], iv_bytes: &[u8]) -> Result<Vec<u8>, String> {
    use aes_gcm::{aead::Aead, Aes256Gcm, KeyInit, Nonce};
    if key_bytes.len() != 32 {
        return Err("Decryption key must be 32 bytes".to_string());
    }
    if iv_bytes.len() != 12 {
        return Err("IV must be 12 bytes".to_string());
    }
    let cipher = Aes256Gcm::new_from_slice(key_bytes).map_err(|e| e.to_string())?;
    let nonce = Nonce::from_slice(iv_bytes);
    cipher.decrypt(nonce, ciphertext_and_tag).map_err(|e| format!("AES-GCM Decryption failed: {}", e))
}

pub fn generate_random_bytes(length: usize) -> Vec<u8> {
    let mut buf = vec![0u8; length];
    let _ = getrandom::getrandom(&mut buf);
    buf
}

pub fn compress_deflate(data: &[u8]) -> Result<Vec<u8>, String> {
    use flate2::{write::ZlibEncoder, Compression};
    use std::io::Write;

    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder
        .write_all(data)
        .map_err(|e| format!("Deflate compression failed: {}", e))?;
    encoder
        .finish()
        .map_err(|e| format!("Deflate compression finish failed: {}", e))
}

pub fn decompress_deflate(data: &[u8]) -> Result<Vec<u8>, String> {
    use flate2::read::ZlibDecoder;
    use std::io::Read;

    if data.len() >= 2 && data[0] == 0x78 {
        let mut decoder = ZlibDecoder::new(data);
        let mut decompressed = Vec::new();
        if decoder.read_to_end(&mut decompressed).is_ok() {
            return Ok(decompressed);
        }
    }
    Ok(data.to_vec())
}

pub const ARGON2_DEFAULT_ITERATIONS: u32 = 3;
pub const ARGON2_DEFAULT_MEMORY_KIB: u32 = 65536; // 64MB
pub const ARGON2_DEFAULT_HASH_LEN: usize = 32;

pub fn fast_xor(data: &[u8], key: &[u8]) -> Vec<u8> {
    if key.is_empty() {
        return data.to_vec();
    }
    data.iter()
        .enumerate()
        .map(|(i, &b)| b ^ key[i % key.len()])
        .collect()
}

pub fn derive_key_argon2id(
    password: &str,
    salt: &[u8],
    iterations: Option<u32>,
    memory_kib: Option<u32>,
    hash_length: Option<usize>,
) -> Result<Vec<u8>, String> {
    let iters = iterations.unwrap_or(ARGON2_DEFAULT_ITERATIONS);
    let mem = memory_kib.unwrap_or(ARGON2_DEFAULT_MEMORY_KIB);
    let len = hash_length.unwrap_or(ARGON2_DEFAULT_HASH_LEN);

    let params = Params::new(mem, iters, 1, Some(len))
        .map_err(|e| format!("Argon2 params error: {}", e))?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

    let mut output = vec![0u8; len];
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut output)
        .map_err(|e| format!("Argon2 key derivation error: {}", e))?;

    Ok(output)
}

pub fn hash_password_argon2id(
    password: &str,
    salt: &[u8],
    iterations: Option<u32>,
    memory_kib: Option<u32>,
) -> Result<String, String> {
    let iters = iterations.unwrap_or(ARGON2_DEFAULT_ITERATIONS);
    let mem = memory_kib.unwrap_or(ARGON2_DEFAULT_MEMORY_KIB);

    let params = Params::new(mem, iters, 1, Some(32))
        .map_err(|e| format!("Argon2 params error: {}", e))?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let salt_string = SaltString::encode_b64(salt)
        .map_err(|e| format!("Invalid salt for Argon2 PHC: {}", e))?;

    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt_string)
        .map_err(|e| format!("Argon2 hashing error: {}", e))?;

    Ok(password_hash.to_string())
}

pub fn sha1_prefix_suffix(password: &str) -> Result<String, String> {
    let mut hasher = Sha1::new();
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    Ok(data_encoding::HEXUPPER.encode(&result))
}

pub fn hmac_sha256(message: &str, secret_key: &str) -> Result<String, String> {
    let key = if secret_key.is_empty() {
        "gistwarden_default_hmac_secret"
    } else {
        secret_key
    };

    let mut mac = HmacSha256::new_from_slice(key.as_bytes())
        .map_err(|e| format!("HMAC init error: {}", e))?;
    mac.update(message.as_bytes());
    let result = mac.finalize().into_bytes();
    Ok(data_encoding::BASE64.encode(&result))
}

pub fn p1363_to_der(signature: &[u8]) -> Result<Vec<u8>, String> {
    if signature.len() != 64 {
        return Err("toast_error".to_string());
    }

    fn encode_der_integer(bytes: &[u8]) -> Vec<u8> {
        let mut start = 0;
        while start < bytes.len().saturating_sub(1) && bytes[start] == 0 {
            start += 1;
        }
        let trimmed = &bytes[start..];
        let needs_zero = (trimmed[0] & 0x80) != 0;
        let len = trimmed.len() + if needs_zero { 1 } else { 0 };

        let mut res = Vec::with_capacity(2 + len);
        res.push(0x02);
        res.push(len as u8);
        if needs_zero {
            res.push(0x00);
        }
        res.extend_from_slice(trimmed);
        res
    }

    let r_bytes = encode_der_integer(&signature[..32]);
    let s_bytes = encode_der_integer(&signature[32..64]);
    let body_len = r_bytes.len() + s_bytes.len();

    let mut dst = Vec::with_capacity(2 + body_len);
    dst.push(0x30);
    dst.push(body_len as u8);
    dst.extend_from_slice(&r_bytes);
    dst.extend_from_slice(&s_bytes);

    Ok(dst)
}
