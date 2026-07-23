import qrcodeParser from "qrcode-parser";
import { Result, ResultAsync } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import * as OTPAuth from "otpauth";

/**
 * Bóc tách secret key (Base32) ra khỏi định dạng otpauth:// URI nếu người dùng lưu cả URL,
 * hoặc chuẩn hóa và viết hoa khóa bí mật nếu là chuỗi thô.
 */
export function parseTotpSecret(rawSecret: string): string {
  const trimmed = rawSecret.trim();
  const parsedUriRes = Result.fromThrowable(
    () => OTPAuth.URI.parse(trimmed),
    (e) => e,
  )();

  if (parsedUriRes.isOk() && parsedUriRes.value.secret) {
    return parsedUriRes.value.secret.base32.replace(/\s+/g, "").toUpperCase();
  }

  return trimmed.replace(/\s+/g, "").toUpperCase();
}

/**
 * Giải mã mã QR an toàn từ screenshot hoặc file ảnh, trả về ResultAsync.
 */
export function safeDecodeQr(
  imageSource: Parameters<typeof qrcodeParser>[0],
): ResultAsync<string, TranslationKey> {
  return ResultAsync.fromPromise(
    qrcodeParser(imageSource),
    (err) => {
      console.error("QR Code decoding error:", err);
      return "edit_qr_error_fail";
    },
  );
}

/**
 * Sinh mã TOTP an toàn từ khóa bí mật, trả về Result phẳng.
 */
export function generateTotpSafe(
  rawSecret: string,
  timeOffset = 0,
): Result<string, TranslationKey> {
  const secret = parseTotpSecret(rawSecret);
  return Result.fromThrowable(
    () => {
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secret),
      });
      return totp.generate({
        timestamp: Date.now() + timeOffset,
      });
    },
    (err): TranslationKey => {
      console.error("TOTP Generation error:", err);
      return "totp_error_invalid_secret";
    },
  )();
}
