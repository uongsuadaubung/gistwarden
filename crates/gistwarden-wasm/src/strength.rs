use serde::Serialize;

#[derive(Serialize)]
pub struct StrengthOutput {
    pub score: u8,
    pub entropy: f64,
    pub guesses: u64,
}

/**
 * Đánh giá độ mạnh yếu mật khẩu và tính toán Entropy bằng Rust WASM zxcvbn engine.
 */
pub fn estimate_password_strength(password: &str, user_inputs_json: &str) -> Result<String, String> {
    if password.is_empty() {
        let empty = StrengthOutput {
            score: 0,
            entropy: 0.0,
            guesses: 1,
        };
        return serde_json::to_string(&empty).map_err(|e| e.to_string());
    }

    let user_inputs: Vec<String> = if user_inputs_json.is_empty() {
        Vec::new()
    } else {
        serde_json::from_str(user_inputs_json).unwrap_or_default()
    };

    let user_input_refs: Vec<&str> = user_inputs.iter().map(|s| s.as_str()).collect();
    let estimate = zxcvbn::zxcvbn(password, &user_input_refs);

    let score = estimate.score() as u8;
    let guesses = estimate.guesses();
    let entropy = (guesses as f64).log2();

    let output = StrengthOutput {
        score,
        entropy,
        guesses,
    };

    serde_json::to_string(&output).map_err(|e| e.to_string())
}
