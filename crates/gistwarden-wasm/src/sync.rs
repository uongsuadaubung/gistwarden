use serde_json::Value;
use std::collections::HashMap;

fn parse_timestamp(date_str: Option<&str>) -> u64 {
    let s = match date_str {
        Some(val) if !val.trim().is_empty() => val.trim(),
        _ => return 0,
    };

    if let Ok(ts) = chrono_like_parse(s) {
        return ts;
    }
    0
}

fn chrono_like_parse(s: &str) -> Result<u64, ()> {
    if s.len() < 19 {
        return Err(());
    }
    let parts: Vec<&str> = s.split('T').collect();
    if parts.len() != 2 {
        return Err(());
    }
    let date_parts: Vec<u64> = parts[0].split('-').filter_map(|p| p.parse().ok()).collect();
    if date_parts.len() != 3 {
        return Err(());
    }

    let time_str = parts[1].trim_matches('Z');
    let time_parts: Vec<&str> = time_str.split(':').collect();
    if time_parts.len() < 3 {
        return Err(());
    }

    let hour: u64 = time_parts[0].parse().map_err(|_| ())?;
    let min: u64 = time_parts[1].parse().map_err(|_| ())?;

    let sec_parts: Vec<&str> = time_parts[2].split('.').collect();
    let sec: u64 = sec_parts[0].parse().map_err(|_| ())?;
    let millis: u64 = if sec_parts.len() > 1 {
        let ms_raw = sec_parts[1];
        if ms_raw.len() >= 3 {
            ms_raw[..3].parse().unwrap_or(0)
        } else {
            ms_raw.parse().unwrap_or(0) * 10u64.pow((3 - ms_raw.len()) as u32)
        }
    } else {
        0
    };

    let year = date_parts[0];
    let month = date_parts[1];
    let day = date_parts[2];

    let mut days_since_epoch = (year.saturating_sub(1970)) * 365 + (year.saturating_sub(1969)) / 4;
    let days_in_months = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for m in 1..month {
        days_since_epoch += days_in_months[m as usize];
    }
    if month > 2 && (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)) {
        days_since_epoch += 1;
    }
    days_since_epoch += day.saturating_sub(1);

    let total_secs = days_since_epoch * 86400 + hour * 3600 + min * 60 + sec;
    Ok(total_secs * 1000 + millis)
}

pub fn merge_vault_payload(
    local_json: &str,
    remote_json: &str,
    last_sync_timestamp: u64,
) -> Result<String, String> {
    let local: Value = serde_json::from_str(local_json).map_err(|e| e.to_string())?;
    let remote: Value = serde_json::from_str(remote_json).map_err(|e| e.to_string())?;

    let local_folders = local
        .get("folders")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    let remote_folders = remote
        .get("folders")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    // 1. Merge Folders
    let mut folder_map: HashMap<String, Value> = HashMap::new();
    for f in &local_folders {
        if let Some(id) = f.get("id").and_then(|v| v.as_str()) {
            if f.get("name").and_then(|v| v.as_str()).is_some() {
                folder_map.insert(id.to_string(), f.clone());
            }
        }
    }
    for f in &remote_folders {
        if let Some(id) = f.get("id").and_then(|v| v.as_str()) {
            if f.get("name").and_then(|v| v.as_str()).is_some() && !folder_map.contains_key(id) {
                folder_map.insert(id.to_string(), f.clone());
            }
        }
    }

    let mut merged_folders: Vec<Value> = folder_map.into_values().collect();
    merged_folders.sort_by(|a, b| {
        let name_a = a.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let name_b = b.get("name").and_then(|v| v.as_str()).unwrap_or("");
        name_a.to_lowercase().cmp(&name_b.to_lowercase())
    });

    // 2. Merge Trash
    let local_trash = local
        .get("trash")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    let remote_trash = remote
        .get("trash")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    let mut trash_map: HashMap<String, Value> = HashMap::new();
    for t_item in local_trash.into_iter().chain(remote_trash.into_iter()) {
        let item_id = match t_item
            .get("item")
            .and_then(|i| i.get("id"))
            .and_then(|v| v.as_str())
        {
            Some(id) => id.to_string(),
            None => continue,
        };

        if let Some(existing) = trash_map.get(&item_id) {
            let existing_del_time =
                parse_timestamp(existing.get("deletedDate").and_then(|v| v.as_str()));
            let new_del_time = parse_timestamp(t_item.get("deletedDate").and_then(|v| v.as_str()));
            if new_del_time >= existing_del_time {
                trash_map.insert(item_id, t_item);
            }
        } else {
            trash_map.insert(item_id, t_item);
        }
    }

    // 3. Merge Vault Items
    let local_items = local
        .get("items")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    let remote_items = remote
        .get("items")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    let mut local_map: HashMap<String, Value> = HashMap::new();
    for item in &local_items {
        if let Some(id) = item.get("id").and_then(|v| v.as_str()) {
            local_map.insert(id.to_string(), item.clone());
        }
    }

    let mut item_map: HashMap<String, Value> = HashMap::new();

    for remote_item in &remote_items {
        let id = match remote_item.get("id").and_then(|v| v.as_str()) {
            Some(i) => i.to_string(),
            None => continue,
        };

        if let Some(local_item) = local_map.get(&id) {
            let local_rev_time =
                parse_timestamp(local_item.get("revisionDate").and_then(|v| v.as_str()));
            let remote_rev_time =
                parse_timestamp(remote_item.get("revisionDate").and_then(|v| v.as_str()));

            if local_rev_time >= remote_rev_time {
                item_map.insert(id, local_item.clone());
            } else {
                item_map.insert(id, remote_item.clone());
            }
        } else {
            let remote_creation_time =
                parse_timestamp(remote_item.get("creationDate").and_then(|v| v.as_str()));
            let remote_rev_time =
                parse_timestamp(remote_item.get("revisionDate").and_then(|v| v.as_str()));

            if last_sync_timestamp == 0
                || remote_creation_time > last_sync_timestamp
                || remote_rev_time > last_sync_timestamp
            {
                item_map.insert(id, remote_item.clone());
            }
        }
    }

    for local_item in &local_items {
        let id = match local_item.get("id").and_then(|v| v.as_str()) {
            Some(i) => i.to_string(),
            None => continue,
        };

        if !item_map.contains_key(&id) {
            let remote_item = remote_items
                .iter()
                .find(|r| r.get("id").and_then(|v| v.as_str()) == Some(&id));
            if remote_item.is_none() {
                let local_creation_time =
                    parse_timestamp(local_item.get("creationDate").and_then(|v| v.as_str()));
                let local_rev_time =
                    parse_timestamp(local_item.get("revisionDate").and_then(|v| v.as_str()));

                if last_sync_timestamp == 0
                    || local_creation_time > last_sync_timestamp
                    || local_rev_time > last_sync_timestamp
                {
                    item_map.insert(id, local_item.clone());
                }
            }
        }
    }

    // Filter candidate items against trash
    let mut final_items: Vec<Value> = Vec::new();
    for (id, item) in item_map {
        if let Some(trash_entry) = trash_map.get(&id) {
            let del_time =
                parse_timestamp(trash_entry.get("deletedDate").and_then(|v| v.as_str()));
            let rev_time = parse_timestamp(item.get("revisionDate").and_then(|v| v.as_str()));
            if del_time >= rev_time {
                continue;
            } else {
                trash_map.remove(&id);
            }
        }
        final_items.push(item);
    }

    final_items.sort_by(|a, b| {
        let name_a = a.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let name_b = b.get("name").and_then(|v| v.as_str()).unwrap_or("");
        name_a.to_lowercase().cmp(&name_b.to_lowercase())
    });

    let result_trash: Vec<Value> = trash_map.into_values().collect();

    let output = serde_json::json!({
        "folders": merged_folders,
        "items": final_items,
        "trash": result_trash,
    });

    serde_json::to_string(&output).map_err(|e| e.to_string())
}

pub fn merge_folders(
    local_folders_json: &str,
    remote_folders_json: &str,
) -> Result<String, String> {
    let local: Vec<Value> = serde_json::from_str(local_folders_json).map_err(|e| e.to_string())?;
    let remote: Vec<Value> = serde_json::from_str(remote_folders_json).map_err(|e| e.to_string())?;

    let mut folder_map: HashMap<String, Value> = HashMap::new();
    for f in &local {
        if let Some(id) = f.get("id").and_then(|v| v.as_str()) {
            if f.get("name").and_then(|v| v.as_str()).is_some() {
                folder_map.insert(id.to_string(), f.clone());
            }
        }
    }
    for f in &remote {
        if let Some(id) = f.get("id").and_then(|v| v.as_str()) {
            if f.get("name").and_then(|v| v.as_str()).is_some() && !folder_map.contains_key(id) {
                folder_map.insert(id.to_string(), f.clone());
            }
        }
    }

    let mut merged_folders: Vec<Value> = folder_map.into_values().collect();
    merged_folders.sort_by(|a, b| {
        let name_a = a.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let name_b = b.get("name").and_then(|v| v.as_str()).unwrap_or("");
        name_a.to_lowercase().cmp(&name_b.to_lowercase())
    });
    serde_json::to_string(&merged_folders).map_err(|e| e.to_string())
}

pub fn merge_vault_items(
    local_items_json: &str,
    remote_items_json: &str,
    last_sync_timestamp: u64,
) -> Result<String, String> {
    let local_items: Vec<Value> = serde_json::from_str(local_items_json).map_err(|e| e.to_string())?;
    let remote_items: Vec<Value> = serde_json::from_str(remote_items_json).map_err(|e| e.to_string())?;

    let mut local_map: HashMap<String, Value> = HashMap::new();
    for item in &local_items {
        if let Some(id) = item.get("id").and_then(|v| v.as_str()) {
            local_map.insert(id.to_string(), item.clone());
        }
    }

    let mut item_map: HashMap<String, Value> = HashMap::new();

    for remote_item in &remote_items {
        let id = match remote_item.get("id").and_then(|v| v.as_str()) {
            Some(i) => i.to_string(),
            None => continue,
        };

        if let Some(local_item) = local_map.get(&id) {
            let local_rev_time =
                parse_timestamp(local_item.get("revisionDate").and_then(|v| v.as_str()));
            let remote_rev_time =
                parse_timestamp(remote_item.get("revisionDate").and_then(|v| v.as_str()));

            if local_rev_time >= remote_rev_time {
                item_map.insert(id, local_item.clone());
            } else {
                item_map.insert(id, remote_item.clone());
            }
        } else {
            let remote_creation_time =
                parse_timestamp(remote_item.get("creationDate").and_then(|v| v.as_str()));
            let remote_rev_time =
                parse_timestamp(remote_item.get("revisionDate").and_then(|v| v.as_str()));

            if last_sync_timestamp == 0
                || remote_creation_time > last_sync_timestamp
                || remote_rev_time > last_sync_timestamp
            {
                item_map.insert(id, remote_item.clone());
            }
        }
    }

    for local_item in &local_items {
        let id = match local_item.get("id").and_then(|v| v.as_str()) {
            Some(i) => i.to_string(),
            None => continue,
        };

        if !item_map.contains_key(&id) {
            let remote_item = remote_items
                .iter()
                .find(|r| r.get("id").and_then(|v| v.as_str()) == Some(&id));
            if remote_item.is_none() {
                let local_creation_time =
                    parse_timestamp(local_item.get("creationDate").and_then(|v| v.as_str()));
                let local_rev_time =
                    parse_timestamp(local_item.get("revisionDate").and_then(|v| v.as_str()));

                if last_sync_timestamp == 0
                    || local_creation_time > last_sync_timestamp
                    || local_rev_time > last_sync_timestamp
                {
                    item_map.insert(id, local_item.clone());
                }
            }
        }
    }

    let mut merged_items: Vec<Value> = item_map.into_values().collect();
    merged_items.sort_by(|a, b| {
        let name_a = a.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let name_b = b.get("name").and_then(|v| v.as_str()).unwrap_or("");
        name_a.to_lowercase().cmp(&name_b.to_lowercase())
    });
    serde_json::to_string(&merged_items).map_err(|e| e.to_string())
}
