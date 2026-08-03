use addr::parse_domain_name;
use url::Url;

pub fn get_hostname(input: &str) -> String {
    let s = input.trim();
    if s.is_empty() {
        return String::new();
    }

    let parsed_url = if s.contains("://") {
        Url::parse(s)
    } else {
        Url::parse(&format!("http://{}", s))
    };

    if let Ok(url) = parsed_url {
        if let Some(host) = url.host_str() {
            let clean_host = host.strip_prefix("www.").unwrap_or(host);
            return clean_host.to_string();
        }
    }

    String::new()
}

pub fn get_base_domain_from_host(host: &str) -> String {
    let h = host.trim();
    if h.is_empty() {
        return String::new();
    }

    if let Ok(domain) = parse_domain_name(h) {
        if domain.is_private() {
            let suffix = domain.suffix();
            if !suffix.is_empty() {
                return suffix.to_string();
            }
        }
        if let Some(root) = domain.root() {
            return root.to_string();
        }
    }

    h.to_string()
}

pub fn get_base_domain(input: &str) -> String {
    let host = get_hostname(input);
    if host.is_empty() {
        return String::new();
    }
    get_base_domain_from_host(&host)
}
