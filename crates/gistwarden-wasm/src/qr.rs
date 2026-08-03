use crate::errors::WasmError;
use image::{DynamicImage, RgbaImage};
use rqrr::PreparedImage;

/**
 * Giải mã chuỗi dữ liệu mã QR từ mảng điểm ảnh RGBA sử dụng crate rqrr thuần Rust.
 */
pub fn decode_qr_code(width: u32, height: u32, rgba_bytes: &[u8]) -> Result<String, String> {
    let w = width as usize;
    let h = height as usize;

    let required_len = match w.checked_mul(h).and_then(|wh| wh.checked_mul(4)) {
        Some(len) => len,
        None => return Err(WasmError::EditQrFail.to_string()),
    };

    if w == 0 || h == 0 || rgba_bytes.len() < required_len {
        return Err(WasmError::EditQrFail.to_string());
    }

    let rgba_img = RgbaImage::from_raw(width, height, rgba_bytes[..required_len].to_vec())
        .ok_or_else(|| WasmError::EditQrFail.to_string())?;

    let luma_img = DynamicImage::ImageRgba8(rgba_img).into_luma8();

    let mut prepared = PreparedImage::prepare_from_greyscale(w, h, |x, y| {
        luma_img.get_pixel(x as u32, y as u32).0[0]
    });

    let grids = prepared.detect_grids();
    for grid in grids {
        if let Ok((_meta, content)) = grid.decode() {
            return Ok(content);
        }
    }

    Err(WasmError::EditQrNoMatch.to_string())
}

/**
 * Giải mã chuỗi dữ liệu mã QR trực tiếp từ mảng byte file ảnh (PNG, JPEG, WebP...) bằng Rust WASM.
 */
pub fn decode_qr_from_bytes(image_bytes: &[u8]) -> Result<String, String> {
    let img = image::load_from_memory(image_bytes).map_err(|_| WasmError::EditQrFail.to_string())?;
    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();
    decode_qr_code(width, height, &rgba)
}
