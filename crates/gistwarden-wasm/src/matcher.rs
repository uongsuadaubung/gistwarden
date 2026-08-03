use crate::errors::WasmError;
use crate::types::{ItemType, VaultItem, VaultItemExt};
use regex::RegexBuilder;
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Debug, Deserialize, Default)]
pub struct UriMatchOptionsOwned {
    pub stored_uri: String,
    pub current_url: String,
    pub match_mode: Option<u8>,
    pub override_mode: Option<u8>,
    pub target_host: Option<String>,
    pub item_host: Option<String>,
    pub target_base: Option<String>,
    pub item_base: Option<String>,
}

#[derive(Debug, Default)]
pub struct UriMatchOptions<'a> {
    pub stored_uri: &'a str,
    pub current_url: &'a str,
    pub match_mode: Option<u8>,
    pub override_mode: Option<u8>,
    pub target_host: Option<&'a str>,
    pub item_host: Option<&'a str>,
    pub target_base: Option<&'a str>,
    pub item_base: Option<&'a str>,
}

pub fn is_single_uri_match(opts: &UriMatchOptions) -> bool {
    let s_uri = opts.stored_uri.trim();
    let c_url = opts.current_url.trim();

    if s_uri.is_empty() || c_url.is_empty() {
        return false;
    }

    let mode = opts.match_mode.or(opts.override_mode).unwrap_or(0);

    if mode == 5 {
        return false;
    }

    if mode == 3 {
        return c_url.eq_ignore_ascii_case(s_uri);
    }

    if mode == 2 {
        return c_url
            .get(..s_uri.len())
            .map_or(false, |sub| sub.eq_ignore_ascii_case(s_uri));
    }

    if mode == 1 {
        let t_host = opts.target_host.unwrap_or("");
        let i_host = opts.item_host.unwrap_or("");
        return !t_host.is_empty() && !i_host.is_empty() && t_host.eq_ignore_ascii_case(i_host);
    }

    if mode == 4 {
        if s_uri.len() > 250 {
            return false;
        }
        if let Ok(re) = RegexBuilder::new(s_uri).case_insensitive(true).build() {
            return re.is_match(c_url);
        }
        return false;
    }

    let t_base = opts.target_base.unwrap_or("");
    let i_base = opts.item_base.unwrap_or("");
    !t_base.is_empty() && !i_base.is_empty() && t_base.eq_ignore_ascii_case(i_base)
}

fn contains_ignore_case(haystack: &str, needle_lower: &str) -> bool {
    if needle_lower.is_empty() {
        return true;
    }
    if haystack.is_ascii() && needle_lower.is_ascii() {
        haystack
            .as_bytes()
            .windows(needle_lower.len())
            .any(|w| w.eq_ignore_ascii_case(needle_lower.as_bytes()))
    } else {
        haystack.to_lowercase().contains(needle_lower)
    }
}

pub fn filter_vault_items_by_query_values(
    mut items: Vec<VaultItem>,
    search_query: &str,
    filter_type: &str,
) -> Vec<VaultItem> {
    let q = search_query.trim().to_lowercase();

    // 1. Filter by item type
    if let Ok(target_type_num) = filter_type.parse::<u64>() {
        let target_type = ItemType::from(target_type_num);
        items.retain(|item| item.item_type == target_type);
    }

    // 2. Filter by search query
    if !q.is_empty() {
        items.retain(|item| {
            if contains_ignore_case(&item.name, &q) {
                return true;
            }

            if item.is_login() {
                if let Some(u) = item.username() {
                    if contains_ignore_case(u, &q) {
                        return true;
                    }
                }
                if let Some(ref login) = item.login {
                    if let Some(ref uris) = login.uris {
                        if uris.iter().any(|u| contains_ignore_case(u.as_ref(), &q)) {
                            return true;
                        }
                    }
                }
            }

            item.notes().map_or(false, |n| contains_ignore_case(n, &q))
        });
    }

    // 3. Sort items by name (natural string sorting)
    items.sort_by(|a, b| crate::utils::cmp_ignore_case(&a.name, &b.name));

    items
}

pub fn filter_vault_items_by_query(
    items_json: &str,
    search_query: &str,
    filter_type: &str,
) -> Result<String, String> {
    let items: Vec<VaultItem> = serde_json::from_str(items_json)
        .map_err(|_| WasmError::VaultImportInvalid.to_string())?;
    let filtered = filter_vault_items_by_query_values(items, search_query, filter_type);
    serde_json::to_string(&filtered).map_err(|_| WasmError::VaultImportInvalid.to_string())
}

pub fn parse_hibp_response(response_text: &str, suffix: &str) -> u32 {
    let s_upper = suffix.trim().to_uppercase();
    if s_upper.is_empty() {
        return 0;
    }

    let lines: Vec<&str> = response_text
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .collect();

    if lines.is_empty() {
        return 0;
    }

    let idx = lines.binary_search_by(|line| {
        let line_suffix = line.split(':').next().unwrap_or("").trim();
        line_suffix.cmp(&s_upper)
    });

    if let Ok(found_idx) = idx {
        let line = lines[found_idx];
        if let Some(colon_idx) = line.find(':') {
            return line[colon_idx + 1..].trim().parse::<u32>().unwrap_or(0);
        }
    }

    0
}

pub fn batch_parse_hibp_response(response_text: &str, suffixes_json: &str) -> String {
    let suffixes: Vec<String> = match serde_json::from_str(suffixes_json) {
        Ok(s) => s,
        Err(_) => return "{}".to_string(),
    };

    let mut hibp_map: HashMap<&str, u32> = HashMap::new();
    for line in response_text.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        if let Some((sfx, count_str)) = trimmed.split_once(':') {
            if let Ok(count) = count_str.trim().parse::<u32>() {
                hibp_map.insert(sfx.trim(), count);
            }
        }
    }

    let mut result_map = serde_json::Map::with_capacity(suffixes.len());

    for suffix in suffixes {
        let s_upper = suffix.trim().to_uppercase();
        let count = if s_upper.is_empty() {
            0
        } else {
            hibp_map.get(s_upper.as_str()).copied().unwrap_or(0)
        };
        result_map.insert(suffix, serde_json::Value::Number(count.into()));
    }

    serde_json::Value::Object(result_map).to_string()
}

pub fn filter_matching_domain_items_values(
    items: Vec<VaultItem>,
    domain_or_url: &str,
    override_mode: Option<u8>,
) -> Vec<VaultItem> {
    if domain_or_url.trim().is_empty() {
        return Vec::new();
    }

    let target_host = crate::domain::get_hostname(domain_or_url);
    let target_base = crate::domain::get_base_domain_from_host(&target_host);

    let mut exact_matches: Vec<VaultItem> = Vec::new();
    let mut other_matches: Vec<VaultItem> = Vec::new();

    for item in items {
        if item.item_type != ItemType::Login {
            continue;
        }

        let login_ref = match &item.login {
            Some(l) => l,
            None => continue,
        };

        let uris = match &login_ref.uris {
            Some(u_arr) if !u_arr.is_empty() => u_arr,
            _ => continue,
        };

        let mut is_matched = false;
        let mut is_exact = false;

        for u_obj in uris {
            let uri = u_obj.uri.trim();
            if uri.is_empty() {
                continue;
            }

            let match_mode = u_obj.match_mode;
            let item_host = crate::domain::get_hostname(uri);
            let item_base = crate::domain::get_base_domain_from_host(&item_host);
            let opts = UriMatchOptions {
                stored_uri: uri,
                current_url: domain_or_url,
                match_mode,
                override_mode,
                target_host: Some(&target_host),
                item_host: Some(&item_host),
                target_base: Some(&target_base),
                item_base: Some(&item_base),
            };

            if is_single_uri_match(&opts) {
                is_matched = true;

                let mode_val = opts.match_mode.or(opts.override_mode).unwrap_or(0);
                if mode_val != 5 && !target_host.is_empty() && item_host.eq_ignore_ascii_case(&target_host) {
                    is_exact = true;
                    break;
                }
            }
        }

        if is_matched {
            if is_exact {
                exact_matches.push(item);
            } else {
                other_matches.push(item);
            }
        }
    }

    exact_matches.extend(other_matches);
    exact_matches
}

pub fn filter_matching_domain_items(
    items_json: &str,
    domain_or_url: &str,
    override_mode: Option<u8>,
) -> Result<String, String> {
    let items: Vec<VaultItem> = serde_json::from_str(items_json)
        .map_err(|_| WasmError::VaultImportInvalid.to_string())?;
    let res = filter_matching_domain_items_values(items, domain_or_url, override_mode);
    serde_json::to_string(&res).map_err(|_| WasmError::VaultImportInvalid.to_string())
}
