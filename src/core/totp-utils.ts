import { safeParseUrl } from "@/core/domain-utils.ts";
import qrcodeParser from "qrcode-parser";
import { Result, ResultAsync } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import * as OTPAuth from "otpauth";

/**
 * Bóc tách secret key (Base32) ra khỏi định dạng otpauth:// URI nếu người dùng lưu cả URL,
 * hoặc chuẩn hóa và viết hoa khóa bí mật nếu là chuỗi thô.
 */
export function parseTotpSecret(rawSecret: string): string {
  let secret = rawSecret.trim();
  if (
    secret.toLowerCase().startsWith("otpauth:") || secret.includes("secret=")
  ) {
    const parseableUrl = secret.replace(/^otpauth:/i, "http:");
    const urlResult = safeParseUrl(parseableUrl);
    if (urlResult.isOk()) {
      const secretParam = urlResult.value.searchParams.get("secret");
      if (secretParam) {
        secret = secretParam;
      }
    } else {
      const match = secret.match(/[?&]secret=([^&]+)/i);
      if (match) {
        secret = match[1];
      }
    }
  }
  return secret.replace(/\s+/g, "").toUpperCase();
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
      return "toast_error";
    },
  )();
}
