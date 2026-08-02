use addr::parse_domain_name;
use url::Url;

pub fn get_hostname(input: &str) -> String {
    let s = input.trim();
    if s.is_empty() {
        return String::new();
    }

    let input_with_scheme = if !s.contains("://") {
        format!("http://{}", s)
    } else {
        s.to_string()
    };

    if let Ok(url) = Url::parse(&input_with_scheme) {
        if let Some(host) = url.host_str() {
            let h = if host.starts_with("www.") {
                &host[4..]
            } else {
                host
            };
            return h.to_string();
        }
    }

    String::new()
}

pub fn get_base_domain(input: &str) -> String {
    let s = input.trim();
    if s.is_empty() {
        return String::new();
    }

    let host = get_hostname(s);
    if host.is_empty() {
        return String::new();
    }

    if let Ok(domain) = parse_domain_name(&host) {
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

    host
}
