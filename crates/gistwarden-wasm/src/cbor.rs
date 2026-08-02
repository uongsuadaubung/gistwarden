use ciborium::Value;
use wasm_bindgen::JsCast;

pub fn concat_bytes(chunks: js_sys::Array) -> Vec<u8> {
    let len = chunks.length();
    let mut total_len = 0;
    for i in 0..len {
        let val = chunks.get(i);
        if let Ok(arr) = val.dyn_into::<js_sys::Uint8Array>() {
            total_len += arr.length() as usize;
        }
    }
    let mut out = Vec::with_capacity(total_len);
    for i in 0..len {
        let val = chunks.get(i);
        if let Ok(arr) = val.dyn_into::<js_sys::Uint8Array>() {
            out.extend_from_slice(&arr.to_vec());
        }
    }
    out
}

pub fn cbor_encode_length(major_type: u8, length: usize) -> Vec<u8> {
    let mt = major_type << 5;
    if length < 24 {
        vec![mt | (length as u8)]
    } else if length < 256 {
        vec![mt | 24, length as u8]
    } else if length < 65536 {
        vec![
            mt | 25,
            ((length >> 8) & 0xff) as u8,
            (length & 0xff) as u8,
        ]
    } else {
        vec![
            mt | 26,
            ((length >> 24) & 0xff) as u8,
            ((length >> 16) & 0xff) as u8,
            ((length >> 8) & 0xff) as u8,
            (length & 0xff) as u8,
        ]
    }
}

pub fn cbor_text_string(s: &str) -> Vec<u8> {
    let mut buf = Vec::new();
    let val = Value::Text(s.to_string());
    ciborium::into_writer(&val, &mut buf).expect("CBOR encoding failed");
    buf
}

pub fn cbor_byte_string(bytes: &[u8]) -> Vec<u8> {
    let mut buf = Vec::new();
    let val = Value::Bytes(bytes.to_vec());
    ciborium::into_writer(&val, &mut buf).expect("CBOR encoding failed");
    buf
}

pub fn cbor_map_header(num_pairs: usize) -> Vec<u8> {
    cbor_encode_length(5, num_pairs)
}

pub fn cbor_positive_int(n: usize) -> Vec<u8> {
    cbor_encode_length(0, n)
}

pub fn cbor_negative_int(n: usize) -> Vec<u8> {
    cbor_encode_length(1, n)
}

pub fn pack_attestation_object(auth_data: &[u8]) -> Vec<u8> {
    let map = Value::Map(vec![
        (Value::Text("fmt".to_string()), Value::Text("none".to_string())),
        (Value::Text("attStmt".to_string()), Value::Map(vec![])),
        (Value::Text("authData".to_string()), Value::Bytes(auth_data.to_vec())),
    ]);

    let mut buf = Vec::new();
    ciborium::into_writer(&map, &mut buf).expect("CBOR encoding failed");
    buf
}

pub fn encode_cose_ec2_public_key(x: &[u8], y: &[u8]) -> Vec<u8> {
    let map = Value::Map(vec![
        (Value::Integer(1.into()), Value::Integer(2.into())), // 1(kty): 2(EC2)
        (Value::Integer(3.into()), Value::Integer((-7).into())), // 3(alg): -7(ES256)
        (Value::Integer((-1).into()), Value::Integer(1.into())), // -1(crv): 1(P-256)
        (Value::Integer((-2).into()), Value::Bytes(x.to_vec())), // -2(x)
        (Value::Integer((-3).into()), Value::Bytes(y.to_vec())), // -3(y)
    ]);

    let mut buf = Vec::new();
    ciborium::into_writer(&map, &mut buf).expect("CBOR encoding failed");
    buf
}

pub const AAGUID: &[u8; 16] = b"LazyPasskeyGist1";

pub fn generate_auth_data(
    rp_id: &str,
    counter: u32,
    user_present: bool,
    user_verified: bool,
    credential_id: Option<&[u8]>,
    key_x: Option<&[u8]>,
    key_y: Option<&[u8]>,
) -> Vec<u8> {
    let mut auth_data = Vec::with_capacity(37 + credential_id.map_or(0, |c| c.len() + 16 + 2 + 77));

    // 1. rpIdHash (32-byte SHA-256)
    use sha2::{Digest, Sha256};
    let rp_id_hash = Sha256::digest(rp_id.as_bytes());
    auth_data.extend_from_slice(&rp_id_hash);

    // 2. flags (1 byte) according to W3C WebAuthn Spec
    let mut flags: u8 = 0;
    if user_present {
        flags |= 0x01; // UP (User Present)
    }
    if user_verified {
        flags |= 0x04; // UV (User Verified)
    }
    if credential_id.is_some() && key_x.is_some() && key_y.is_some() {
        flags |= 0x40; // AT (Attested Credential Data)
    }
    flags |= 0x08; // BE (Backup Eligibility)
    flags |= 0x10; // BS (Backup State)
    auth_data.push(flags);

    // 3. signCount (4-byte big-endian)
    auth_data.extend_from_slice(&counter.to_be_bytes());

    // 4. attestedCredentialData (if creating credential)
    if let (Some(cred_id), Some(x), Some(y)) = (credential_id, key_x, key_y) {
        auth_data.extend_from_slice(AAGUID);
        let cred_len = cred_id.len() as u16;
        auth_data.extend_from_slice(&cred_len.to_be_bytes());
        auth_data.extend_from_slice(cred_id);
        let cose_bytes = encode_cose_ec2_public_key(x, y);
        auth_data.extend_from_slice(&cose_bytes);
    }

    auth_data
}

pub fn generate_assertion_signature_base(auth_data: &[u8], client_data_hash: &[u8]) -> Vec<u8> {
    let mut sig_base = Vec::with_capacity(auth_data.len() + client_data_hash.len());
    sig_base.extend_from_slice(auth_data);
    sig_base.extend_from_slice(client_data_hash);
    sig_base
}
