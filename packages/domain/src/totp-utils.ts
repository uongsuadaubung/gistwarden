import qrcodeParser from "qrcode-parser";
import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "./i18n.ts";
import * as OTPAuth from "otpauth";
import { logger } from "./logger.ts";

/**
 * Bóc tách secret key (Base32) ra khỏi định dạng otpauth:// URI nếu người dùng lưu cả URL,
 * hoặc chuẩn hóa và viết hoa khóa bí mật nếu là chuỗi thô.
 */
export function parseTotpSecret(rawSecret: string): string {
  const trimmed = rawSecret.trim();
  try {
    const parsedUri = OTPAuth.URI.parse(trimmed);
    if (parsedUri && parsedUri.secret) {
      return parsedUri.secret.base32.replace(/\s+/g, "").toUpperCase();
    }
  } catch (e) {
    logger.vault.debug(
      "Raw secret is not OTPAuth URI format, falling back to raw secret string:",
      e,
    );
  }

  return trimmed.replace(/\s+/g, "").toUpperCase();
}

/**
 * Giải mã mã QR an toàn từ screenshot hoặc file ảnh, trả về ResultAsync.
 */
export async function safeDecodeQr(
  imageSource: Parameters<typeof qrcodeParser>[0],
): Promise<Result<string, TranslationKey>> {
  try {
    const res = await qrcodeParser(imageSource);
    return ok(res);
  } catch (e) {
    console.error("QR Code decoding error:", e);
    return err("edit_qr_error_fail");
  }
}

/**
 * Sinh mã TOTP an toàn từ khóa bí mật, trả về Result phẳng.
 */
export function generateTotpSafe(
  rawSecret: string,
  timeOffset = 0,
): Result<string, TranslationKey> {
  const secret = parseTotpSecret(rawSecret);
  try {
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const code = totp.generate({
      timestamp: Date.now() + timeOffset,
    });
    return ok(code);
  } catch (e) {
    console.error("TOTP Generation error:", e);
    return err("totp_error_invalid_secret");
  }
}
