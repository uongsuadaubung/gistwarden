use regex::RegexBuilder;
use serde_json::Value as JsonValue;

use serde::Deserialize;

#[derive(Debug, Deserialize, Default)]
pub struct UriMatchOptions {
    pub stored_uri: String,
    pub current_url: String,
    pub match_mode: Option<u8>,
    pub override_mode: Option<u8>,
    pub target_host: Option<String>,
    pub item_host: Option<String>,
    pub target_base: Option<String>,
    pub item_base: Option<String>,
}

pub fn is_single_uri_match(opts: &UriMatchOptions) -> bool {
    let s_uri = opts.stored_uri.trim();
    let c_url = opts.current_url.trim();

    if s_uri.is_empty() || c_url.is_empty() {
        return false;
    }

    // UriMatchMode Enum:
    // 0: Domain
    // 1: Host
    // 2: StartsWith
    // 3: Exact
    // 4: Regex
    // 5: Never
    let mode = opts.match_mode.or(opts.override_mode).unwrap_or(0);

    if mode == 5 {
        // Never
        return false;
    }

    if mode == 3 {
        // Exact
        return c_url.eq_ignore_ascii_case(s_uri);
    }

    if mode == 2 {
        // StartsWith
        return c_url.to_ascii_lowercase().starts_with(&s_uri.to_ascii_lowercase());
    }

    if mode == 1 {
        // Host
        let t_host = opts.target_host.as_deref().unwrap_or("");
        let i_host = opts.item_host.as_deref().unwrap_or("");
        return !t_host.is_empty() && !i_host.is_empty() && t_host.eq_ignore_ascii_case(i_host);
    }

    if mode == 4 {
        // Regex
        if s_uri.len() > 250 {
            return false;
        }
        if let Ok(re) = RegexBuilder::new(s_uri).case_insensitive(true).build() {
            return re.is_match(c_url);
        }
        return false;
    }

    // Default (mode == 0 Domain): compare base domains
    let t_base = opts.target_base.as_deref().unwrap_or("");
    let i_base = opts.item_base.as_deref().unwrap_or("");
    !t_base.is_empty() && !i_base.is_empty() && t_base.eq_ignore_ascii_case(i_base)
}

pub fn filter_vault_items_by_query_values(
    mut items: Vec<JsonValue>,
    search_query: &str,
    filter_type: &str,
) -> Vec<JsonValue> {
    let q = search_query.trim().to_lowercase();

    // 1. Filter by item type
    if let Ok(target_type) = filter_type.parse::<u64>() {
        items.retain(|item| {
            item.get("type").and_then(|t| t.as_u64()) == Some(target_type)
        });
    }

    // 2. Filter by search query
    if !q.is_empty() {
        items.retain(|item| {
            let name_match = item.get("name")
                .and_then(|n| n.as_str())
                .map(|n| n.to_lowercase().contains(&q))
                .unwrap_or(false);

            if name_match {
                return true;
            }

            let item_type = item.get("type").and_then(|t| t.as_u64()).unwrap_or(0);
            if item_type == 1 {
                // LoginItem
                if let Some(login) = item.get("login") {
                    let username_match = login.get("username")
                        .and_then(|u| u.as_str())
                        .map(|u| u.to_lowercase().contains(&q))
                        .unwrap_or(false);
                    if username_match {
                        return true;
                    }

                    if let Some(uris) = login.get("uris").and_then(|u| u.as_array()) {
                        for u_obj in uris {
                            if u_obj.get("uri").and_then(|v| v.as_str()).map(|u| u.to_lowercase().contains(&q)).unwrap_or(false) {
                                return true;
                            }
                        }
                    }
                }
            }

            item.get("notes")
                .and_then(|n| n.as_str())
                .map(|n| n.to_lowercase().contains(&q))
                .unwrap_or(false)
        });
    }

    // 3. Sort items by name (natural string sorting)
    items.sort_by(|a, b| {
        let name_a = a.get("name").and_then(|n| n.as_str()).unwrap_or("");
        let name_b = b.get("name").and_then(|n| n.as_str()).unwrap_or("");
        name_a.to_lowercase().cmp(&name_b.to_lowercase())
    });

    items
}

pub fn filter_vault_items_by_query(
    items_json: &str,
    search_query: &str,
    filter_type: &str,
) -> Result<String, String> {
    let items: Vec<JsonValue> = serde_json::from_str(items_json)
        .map_err(|e| format!("JSON parse error: {}", e))?;
    let filtered = filter_vault_items_by_query_values(items, search_query, filter_type);
    serde_json::to_string(&filtered).map_err(|e| format!("JSON serialize error: {}", e))
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

    // High-performance O(log N) Binary Search over sorted HIBP range response
    let idx = lines.binary_search_by(|line| {
        let line_suffix = line.split(':').next().unwrap_or("").trim();
        line_suffix.to_ascii_uppercase().cmp(&s_upper)
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

    let lines: Vec<&str> = response_text
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .collect();

    let mut result_map = serde_json::Map::new();

    for suffix in suffixes {
        let s_upper = suffix.trim().to_uppercase();
        if s_upper.is_empty() {
            result_map.insert(suffix, serde_json::Value::Number(0.into()));
            continue;
        }

        let count = match lines.binary_search_by(|line| {
            let line_suffix = line.split(':').next().unwrap_or("").trim();
            line_suffix.to_ascii_uppercase().cmp(&s_upper)
        }) {
            Ok(found_idx) => {
                let line = lines[found_idx];
                line.find(':')
                    .map(|idx| line[idx + 1..].trim().parse::<u32>().unwrap_or(0))
                    .unwrap_or(0)
            }
            Err(_) => 0,
        };

        result_map.insert(suffix, serde_json::Value::Number(count.into()));
    }

    serde_json::Value::Object(result_map).to_string()
}

pub fn filter_matching_domain_items_values(
    items: Vec<JsonValue>,
    domain_or_url: &str,
    override_mode: Option<u8>,
) -> Vec<JsonValue> {
    if domain_or_url.trim().is_empty() {
        return Vec::new();
    }

    let target_host = crate::domain::get_hostname(domain_or_url);
    let target_base = crate::domain::get_base_domain(domain_or_url);

    let mut exact_matches: Vec<JsonValue> = Vec::new();
    let mut other_matches: Vec<JsonValue> = Vec::new();

    for item in items {
        let item_type = item.get("type").and_then(|v| v.as_u64()).unwrap_or(0);
        if item_type != 1 {
            // Only Login VaultItems (type 1) match URIs
            continue;
        }

        let uris = match item.get("login").and_then(|l| l.get("uris")).and_then(|u| u.as_array()) {
            Some(u_arr) if !u_arr.is_empty() => u_arr,
            _ => continue,
        };

        let mut is_matched = false;
        let mut is_exact = false;

        for u_obj in uris {
            let uri = u_obj.get("uri").and_then(|v| v.as_str()).unwrap_or("");
            if uri.is_empty() {
                continue;
            }

            let match_mode = u_obj.get("match").and_then(|v| v.as_u64()).map(|v| v as u8);
            let item_host = crate::domain::get_hostname(uri);
            let item_base = crate::domain::get_base_domain(uri);
            let opts = UriMatchOptions {
                stored_uri: uri.to_string(),
                current_url: domain_or_url.to_string(),
                match_mode,
                override_mode,
                target_host: Some(target_host.clone()),
                item_host: Some(item_host.clone()),
                target_base: Some(target_base.clone()),
                item_base: Some(item_base),
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
    let items: Vec<JsonValue> = serde_json::from_str(items_json)
        .map_err(|e| format!("JSON parse error: {}", e))?;
    let res = filter_matching_domain_items_values(items, domain_or_url, override_mode);
    serde_json::to_string(&res).map_err(|e| format!("JSON serialize error: {}", e))
}
