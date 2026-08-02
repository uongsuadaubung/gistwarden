use data_encoding::BASE64;
use sha2::{Digest, Sha256};
use ssh_key::{HashAlg, PrivateKey, PublicKey};

fn compute_sha256_fingerprint(blob: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(blob);
    let result = hasher.finalize();
    let b64 = BASE64.encode(&result);
    format!("SHA256:{}", b64.trim_end_matches('='))
}

pub fn parse_ssh_key(private_key_text: &str) -> Result<Vec<String>, String> {
    let trimmed = private_key_text.trim();

    // 1. Parse OpenSSH Private Key via ssh-key crate (RustCrypto)
    if let Ok(priv_key) = PrivateKey::from_openssh(trimmed) {
        if let Ok(public_key) = priv_key.public_key().to_openssh() {
            let fingerprint = priv_key.public_key().fingerprint(HashAlg::Sha256).to_string();
            return Ok(vec![public_key.to_string(), fingerprint]);
        }
    }

    // 2. Parse OpenSSH Public Key via ssh-key crate (RustCrypto)
    if let Ok(pub_key) = PublicKey::from_openssh(trimmed) {
        if let Ok(public_key) = pub_key.to_openssh() {
            let fingerprint = pub_key.fingerprint(HashAlg::Sha256).to_string();
            return Ok(vec![public_key.to_string(), fingerprint]);
        }
    }

    // 3. Direct Public Key string line format (e.g. "ssh-ed25519 AAAAC3Nza... comment")
    if trimmed.starts_with("ssh-") || trimmed.starts_with("ecdsa-") || trimmed.starts_with("sk-") {
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() >= 2 {
            if let Ok(blob) = BASE64.decode(parts[1].as_bytes()) {
                let fingerprint = compute_sha256_fingerprint(&blob);
                return Ok(vec![trimmed.to_string(), fingerprint]);
            }
        }
    }

    Err("ssh_invalid_key".to_string())
}
