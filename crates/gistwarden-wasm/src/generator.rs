use crate::errors::WasmError;
use rand::seq::SliceRandom;
use rand::Rng;
use serde::Deserialize;
use std::sync::LazyLock;

static EFF_WORDLIST_RAW: &str = include_str!("wordlist.txt");

static EFF_WORDLIST: LazyLock<Vec<&'static str>> = LazyLock::new(|| {
    EFF_WORDLIST_RAW
        .lines()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect()
});

#[derive(Debug, Deserialize, Default)]
pub struct PasswordOptions {
    pub length: usize,
    pub uppercase: bool,
    pub lowercase: bool,
    pub numbers: bool,
    pub specials: bool,
    pub avoid_ambiguous: bool,
    pub min_numbers: usize,
    pub min_specials: usize,
}

pub fn get_random_bounded_int(max: u32) -> u32 {
    if max <= 1 {
        return 0;
    }
    rand::thread_rng().gen_range(0..max)
}

fn get_random_char(chars: &[char]) -> Option<char> {
    chars.choose(&mut rand::thread_rng()).copied()
}

pub fn generate_password(opts: &PasswordOptions) -> Result<String, String> {
    let mut available_u = String::from("ABCDEFGHJKLMNPQRSTUVWXYZ");
    let mut available_l = String::from("abcdefghijkmnopqrstuvwxyz");
    let mut available_n = String::from("23456789");
    let mut available_s = String::from("!@#$%^&*");

    if !opts.avoid_ambiguous {
        available_u.push_str("IO");
        available_l.push_str("lo");
        available_n.push_str("01");
    } else {
        let ambiguous_chars = ['I', 'l', '1', 'O', '0', 'o'];
        available_u.retain(|c| !ambiguous_chars.contains(&c));
        available_l.retain(|c| !ambiguous_chars.contains(&c));
        available_n.retain(|c| !ambiguous_chars.contains(&c));
        available_s.retain(|c| !ambiguous_chars.contains(&c));
    }

    let mut charset_str = String::new();
    if opts.uppercase { charset_str.push_str(&available_u); }
    if opts.lowercase { charset_str.push_str(&available_l); }
    if opts.numbers { charset_str.push_str(&available_n); }
    if opts.specials { charset_str.push_str(&available_s); }

    if charset_str.is_empty() {
        return Err(WasmError::GenCharsetEmpty.to_string());
    }

    if opts.min_numbers + opts.min_specials > opts.length {
        return Err(WasmError::GenMinExceedsLength.to_string());
    }

    let charset_chars: Vec<char> = charset_str.chars().collect();
    let num_chars: Vec<char> = available_n.chars().collect();
    let spec_chars: Vec<char> = available_s.chars().collect();

    let mut result_chars: Vec<char> = Vec::with_capacity(opts.length);

    if opts.numbers && opts.min_numbers > 0 && !num_chars.is_empty() {
        for _ in 0..opts.min_numbers {
            if let Some(c) = get_random_char(&num_chars) {
                result_chars.push(c);
            }
        }
    }

    if opts.specials && opts.min_specials > 0 && !spec_chars.is_empty() {
        for _ in 0..opts.min_specials {
            if let Some(c) = get_random_char(&spec_chars) {
                result_chars.push(c);
            }
        }
    }

    let remaining = opts.length.saturating_sub(result_chars.len());
    for _ in 0..remaining {
        if let Some(c) = get_random_char(&charset_chars) {
            result_chars.push(c);
        }
    }

    result_chars.shuffle(&mut rand::thread_rng());

    Ok(result_chars.into_iter().collect())
}

pub fn generate_passphrase(
    num_words: usize,
    word_separator: &str,
    capitalize: bool,
    include_number: bool,
    custom_wordlist: Option<Vec<String>>,
) -> Result<String, String> {
    if !(3..=20).contains(&num_words) {
        return Err(WasmError::GenInvalidWordsCount.to_string());
    }

    let custom_refs;
    let word_list: &[&str] = match &custom_wordlist {
        Some(list) if !list.is_empty() => {
            custom_refs = list.iter().map(|s| s.as_str()).collect::<Vec<&str>>();
            &custom_refs
        }
        _ => EFF_WORDLIST.as_slice(),
    };

    if word_list.is_empty() {
        return Err(WasmError::GenCharsetEmpty.to_string());
    }

    let mut rng = rand::thread_rng();
    let mut chosen_words: Vec<String> = Vec::with_capacity(num_words);

    for _ in 0..num_words {
        let Some(&raw_word) = word_list.choose(&mut rng) else {
            break;
        };
        let mut word = raw_word.to_string();
        if capitalize {
            let mut chars = word.chars();
            if let Some(first) = chars.next() {
                word = first.to_uppercase().collect::<String>() + chars.as_str();
            }
        }
        chosen_words.push(word);
    }

    if include_number {
        if let Some(target_word) = chosen_words.choose_mut(&mut rng) {
            let random_digit: u32 = rng.gen_range(0..10);
            target_word.push_str(&random_digit.to_string());
        }
    }

    Ok(chosen_words.join(word_separator))
}
