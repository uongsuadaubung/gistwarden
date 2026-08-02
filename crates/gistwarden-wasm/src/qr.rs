use rqrr::PreparedImage;

/**
 * Giải mã chuỗi dữ liệu mã QR từ mảng điểm ảnh RGBA sử dụng crate rqrr thuần Rust.
 */
pub fn decode_qr_code(width: u32, height: u32, rgba_bytes: &[u8]) -> Result<String, String> {
    let w = width as usize;
    let h = height as usize;

    if w == 0 || h == 0 || rgba_bytes.len() < w * h * 4 {
        return Err("Invalid image buffer size".into());
    }

    let mut luma = Vec::with_capacity(w * h);
    for i in 0..(w * h) {
        let r = u16::from(rgba_bytes[i * 4]);
        let g = u16::from(rgba_bytes[i * 4 + 1]);
        let b = u16::from(rgba_bytes[i * 4 + 2]);
        let a = rgba_bytes[i * 4 + 3];

        if a < 128 {
            luma.push(255);
        } else {
            let gray = ((r * 299 + g * 587 + b * 114) / 1000) as u8;
            luma.push(gray);
        }
    }

    let mut prepared = PreparedImage::prepare_from_greyscale(w, h, |x, y| {
        luma[y * w + x]
    });

    let grids = prepared.detect_grids();
    for grid in grids {
        if let Ok((_meta, content)) = grid.decode() {
            return Ok(content);
        }
    }

    Err("No QR code detected or decoded".into())
}

/**
 * Giải mã chuỗi dữ liệu mã QR trực tiếp từ mảng byte file ảnh (PNG, JPEG, WebP...) bằng Rust WASM.
 */
pub fn decode_qr_from_bytes(image_bytes: &[u8]) -> Result<String, String> {
    let img = image::load_from_memory(image_bytes).map_err(|e| e.to_string())?;
    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();
    decode_qr_code(width, height, &rgba)
}
