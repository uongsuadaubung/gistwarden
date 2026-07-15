/**
 * Bóc tách secret key (Base32) ra khỏi định dạng otpauth:// URI nếu người dùng lưu cả URL,
 * hoặc chuẩn hóa và viết hoa khóa bí mật nếu là chuỗi thô.
 */
export function parseTotpSecret(rawSecret: string): string {
  let secret = rawSecret.trim();
  if (secret.toLowerCase().startsWith("otpauth:") || secret.includes("secret=")) {
    try {
      const parseableUrl = secret.replace(/^otpauth:/i, "http:");
      const url = new URL(parseableUrl);
      const secretParam = url.searchParams.get("secret");
      if (secretParam) {
        secret = secretParam;
      }
    } catch (_e) {
      const match = secret.match(/[?&]secret=([^&]+)/i);
      if (match) {
        secret = match[1];
      }
    }
  }
  return secret.replace(/\s+/g, "").toUpperCase();
}
