use std::cmp::Ordering;

pub fn greet(name: &str) -> String {
    format!("Hello, {}! Sent from Rust WebAssembly.", name)
}

/// Zero-allocation case-insensitive string comparison for UTF-8/ASCII strings.
fn cmp_iter<I1, I2, T>(mut a_iter: I1, mut b_iter: I2) -> Ordering
where
    I1: Iterator<Item = T>,
    I2: Iterator<Item = T>,
    T: Ord,
{
    loop {
        match (a_iter.next(), b_iter.next()) {
            (None, None) => return Ordering::Equal,
            (None, Some(_)) => return Ordering::Less,
            (Some(_), None) => return Ordering::Greater,
            (Some(x), Some(y)) => {
                let ord = x.cmp(&y);
                if ord != Ordering::Equal {
                    return ord;
                }
            }
        }
    }
}

pub fn cmp_ignore_case(a: &str, b: &str) -> Ordering {
    if a.is_ascii() && b.is_ascii() {
        cmp_iter(
            a.bytes().map(|b| b.to_ascii_lowercase()),
            b.bytes().map(|b| b.to_ascii_lowercase()),
        )
    } else {
        cmp_iter(
            a.chars().flat_map(|c| c.to_lowercase()),
            b.chars().flat_map(|c| c.to_lowercase()),
        )
    }
}

