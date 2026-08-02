use rand::RngCore;

static EFF_WORDLIST_RAW: &str = include_str!("wordlist.txt");

pub fn get_random_bounded_int(max: u32) -> u32 {
    if max <= 1 {
        return 0;
    }
    let max_uint32 = 0xffffffff_u32;
    let limit = max_uint32 - (max_uint32 % max);
    let mut rng = rand::thread_rng();
    loop {
        let val = rng.next_u32();
        if val < limit {
            return val % max;
        }
    }
}

pub fn generate_password(
    length: usize,
    uppercase: bool,
    lowercase: bool,
    numbers: bool,
    specials: bool,
    avoid_ambiguous: bool,
    min_numbers: usize,
    min_specials: usize,
) -> Result<String, String> {
    let mut available_u = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".to_string();
    let mut available_l = "abcdefghijklmnopqrstuvwxyz".to_string();
    let mut available_n = "0123456789".to_string();
    let mut available_s = "!@#$%^&*()_+-=[]{}|;:,.<>?".to_string();

    if avoid_ambiguous {
        let ambiguous_chars = ['I', 'l', '1', 'O', '0', 'o'];
        available_u.retain(|c| !ambiguous_chars.contains(&c));
        available_l.retain(|c| !ambiguous_chars.contains(&c));
        available_n.retain(|c| !ambiguous_chars.contains(&c));
        available_s.retain(|c| !ambiguous_chars.contains(&c));
    }

    let mut charset = String::new();
    if uppercase { charset.push_str(&available_u); }
    if lowercase { charset.push_str(&available_l); }
    if numbers { charset.push_str(&available_n); }
    if specials { charset.push_str(&available_s); }

    if charset.is_empty() {
        return Err("gen_error_charset_empty".to_string());
    }

    let min_num = if numbers { min_numbers } else { 0 };
    let min_spec = if specials { min_specials } else { 0 };

    if min_num + min_spec > length {
        return Err("gen_error_min_exceeds_length".to_string());
    }

    let mut result_chars: Vec<char> = Vec::with_capacity(length);

    let get_random_char = |s: &str| -> Option<char> {
        let chars: Vec<char> = s.chars().collect();
        if chars.is_empty() {
            None
        } else {
            let idx = get_random_bounded_int(chars.len() as u32) as usize;
            Some(chars[idx])
        }
    };

    if numbers && min_num > 0 && !available_n.is_empty() {
        for _ in 0..min_num {
            if let Some(ch) = get_random_char(&available_n) {
                result_chars.push(ch);
            }
        }
    }

    if specials && min_spec > 0 && !available_s.is_empty() {
        for _ in 0..min_spec {
            if let Some(ch) = get_random_char(&available_s) {
                result_chars.push(ch);
            }
        }
    }

    let remaining = length.saturating_sub(result_chars.len());
    for _ in 0..remaining {
        if let Some(ch) = get_random_char(&charset) {
            result_chars.push(ch);
        }
    }

    // Fisher-Yates Shuffle using CSPRNG Rejection Sampling
    let len = result_chars.len();
    if len > 1 {
        for i in (1..len).rev() {
            let j = get_random_bounded_int((i + 1) as u32) as usize;
            result_chars.swap(i, j);
        }
    }

    Ok(result_chars.into_iter().collect())
}

pub fn generate_passphrase(
    num_words: usize,
    word_separator: &str,
    capitalize: bool,
    include_number: bool,
    custom_wordlist: Option<Vec<String>>,
) -> Result<String, String> {
    if num_words < 3 || num_words > 20 {
        return Err("gen_error_invalid_words_count".to_string());
    }

    let word_list: Vec<&str> = match &custom_wordlist {
        Some(list) if !list.is_empty() => list.iter().map(|s| s.as_str()).collect(),
        _ => EFF_WORDLIST_RAW.lines().map(|s| s.trim()).filter(|s| !s.is_empty()).collect(),
    };

    if word_list.is_empty() {
        return Err("gen_error_charset_empty".to_string());
    }

    let mut chosen_words: Vec<String> = Vec::with_capacity(num_words);

    for _ in 0..num_words {
        let idx = get_random_bounded_int(word_list.len() as u32) as usize;
        let mut word = word_list[idx].to_string();
        if capitalize {
            let mut chars = word.chars();
            if let Some(first) = chars.next() {
                word = first.to_uppercase().collect::<String>() + chars.as_str();
            }
        }
        chosen_words.push(word);
    }

    if include_number && !chosen_words.is_empty() {
        let target_word_idx = get_random_bounded_int(chosen_words.len() as u32) as usize;
        let random_digit = get_random_bounded_int(10);
        chosen_words[target_word_idx] = format!("{}{}", chosen_words[target_word_idx], random_digit);
    }

    Ok(chosen_words.join(word_separator))
}
