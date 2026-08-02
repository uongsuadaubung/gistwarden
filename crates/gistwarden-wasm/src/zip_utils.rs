use std::io::{Cursor, Write};
use wasm_bindgen::JsCast;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

pub fn create_zip_archive(files: js_sys::Array) -> Result<Vec<u8>, String> {
    let mut buf = Vec::new();
    {
        let mut zip = ZipWriter::new(Cursor::new(&mut buf));
        let options = SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated);

        let len = files.length();
        for i in 0..len {
            let item = files.get(i);
            let path_val = js_sys::Reflect::get(&item, &"path".into())
                .map_err(|_| "Missing path property")?;
            let path_str = path_val
                .as_string()
                .ok_or("path property must be a string")?;

            let bytes_val = js_sys::Reflect::get(&item, &"bytes".into())
                .map_err(|_| "Missing bytes property")?;
            let u8_arr: js_sys::Uint8Array = bytes_val
                .dyn_into()
                .map_err(|_| "bytes property must be Uint8Array")?;

            zip.start_file(&path_str, options)
                .map_err(|e| format!("Zip start file error ({}): {}", path_str, e))?;
            zip.write_all(&u8_arr.to_vec())
                .map_err(|e| format!("Zip write error ({}): {}", path_str, e))?;
        }

        zip.finish()
            .map_err(|e| format!("Zip finish error: {}", e))?;
    }

    Ok(buf)
}
