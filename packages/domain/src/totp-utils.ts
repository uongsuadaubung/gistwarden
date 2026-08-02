import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "./i18n.ts";
import {
  parseTotpSecretWasm,
  generateTotpCodeWasm,
  decodeQrFromBytesWasm,
  initWasmAsync,
} from "./wasm/index.ts";

export type QrImageInput = Blob | File | Uint8Array | ArrayBuffer | string;

/**
 * Bóc tách secret key (Base32) ra khỏi định dạng otpauth:// URI nếu người dùng lưu cả URL.
 */
export function parseTotpSecret(rawSecret: string): string {
  return parseTotpSecretWasm(rawSecret);
}

/**
 * Giải mã mã QR trực tiếp từ file ảnh (File, Blob, Data URL string, Uint8Array) ủy quyền 100% cho Rust WASM.
 */
export async function safeDecodeQr(
  imageSource: QrImageInput,
): Promise<Result<string, TranslationKey>> {
  try {
    await initWasmAsync();
    let bytes: Uint8Array;
    if (typeof imageSource === "string") {
      const base64Data = imageSource.includes(",")
        ? imageSource.split(",")[1]
        : imageSource;
      const binaryStr = atob(base64Data);
      bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
    } else if (imageSource instanceof Uint8Array) {
      bytes = imageSource;
    } else if (imageSource instanceof ArrayBuffer) {
      bytes = new Uint8Array(imageSource);
    } else {
      bytes = new Uint8Array(await imageSource.arrayBuffer());
    }

    const code = decodeQrFromBytesWasm(bytes);
    return code ? ok(code) : err("edit_qr_error_fail");
  } catch (e) {
    console.error("QR Code decoding error:", e);
    return err("edit_qr_error_fail");
  }
}

/**
 * Sinh mã TOTP an toàn từ khóa bí mật, trả về Result phẳng.
 */
export async function generateTotpSafe(
  rawSecret: string,
  timeOffset = 0,
): Promise<Result<string, TranslationKey>> {
  try {
    await initWasmAsync();
    const secret = parseTotpSecret(rawSecret);
    if (!secret) return err("totp_error_invalid_secret");
    return ok(generateTotpCodeWasm(secret, Date.now() + timeOffset));
  } catch (e) {
    console.error("TOTP Generation error:", e);
    return err("totp_error_invalid_secret");
  }
}
