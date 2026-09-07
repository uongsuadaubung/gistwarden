import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import type { AppContext, VaultRow } from "../types";

// Giới hạn kích thước payload két sắt tối đa 5MB để chống DoS tràn bộ nhớ / dung lượng D1
const MAX_VAULT_PAYLOAD_BYTES = 5 * 1024 * 1024;

export const vaultRouter = new Hono<AppContext>();

// Apply authentication to all vault routes
vaultRouter.use("/*", requireAuth);

/**
 * GET /vault
 * Fetch the encrypted vault payload for the authenticated user.
 * Returns 404 if no vault has been uploaded yet (signaling the client to create a new one).
 */
vaultRouter.get("/", async (c) => {
  const authUser = c.get("user")!;
  const db = c.env.DB;

  if (!db) {
    return c.json(
      {
        error: "server_error",
        message: "D1 database binding 'DB' chưa được cấu hình",
      },
      500,
    );
  }

  const vault = await db
    .prepare(
      "SELECT salt, iv, ciphertext, updated_at FROM vaults WHERE user_id = ?",
    )
    .bind(authUser.userId)
    .first<VaultRow>();

  if (!vault) {
    return c.json(
      {
        error: "vault_not_found",
        message: "Chưa có két mật khẩu nào được lưu cho tài khoản này.",
      },
      404,
    );
  }

  return c.json({
    salt: vault.salt,
    iv: vault.iv,
    ciphertext: vault.ciphertext,
    updatedAt: vault.updated_at,
  });
});

/**
 * POST /vault
 * Save or update the encrypted vault payload (salt, iv, ciphertext) for the user.
 */
vaultRouter.post("/", async (c) => {
  const authUser = c.get("user")!;
  const db = c.env.DB;

  if (!db) {
    return c.json(
      {
        error: "server_error",
        message: "D1 database binding 'DB' chưa được cấu hình",
      },
      500,
    );
  }

  const body = await c.req.json().catch(() => ({}));
  const { salt, iv, ciphertext } = body;

  if (
    typeof salt !== "string" ||
    typeof iv !== "string" ||
    typeof ciphertext !== "string" ||
    !salt.trim() ||
    !iv.trim() ||
    !ciphertext.trim()
  ) {
    return c.json(
      {
        error: "bad_request",
        message: "Các trường salt, iv và ciphertext là bắt buộc",
      },
      400,
    );
  }

  if (ciphertext.length > MAX_VAULT_PAYLOAD_BYTES) {
    return c.json(
      {
        error: "payload_too_large",
        message: "Dữ liệu két sắt vượt quá dung lượng tối đa cho phép (5MB)",
      },
      413,
    );
  }

  // Upsert vault data (Insert or Update on conflict)
  await db
    .prepare(
      `INSERT INTO vaults (user_id, salt, iv, ciphertext, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         salt = excluded.salt,
         iv = excluded.iv,
         ciphertext = excluded.ciphertext,
         updated_at = datetime('now')`,
    )
    .bind(authUser.userId, salt.trim(), iv.trim(), ciphertext.trim())
    .run();

  return c.json({
    success: true,
  });
});

/**
 * DELETE /vault
 * Remove the vault payload for the authenticated user.
 */
vaultRouter.delete("/", async (c) => {
  const authUser = c.get("user")!;
  const db = c.env.DB;

  if (!db) {
    return c.json(
      {
        error: "server_error",
        message: "D1 database binding 'DB' chưa được cấu hình",
      },
      500,
    );
  }

  await db
    .prepare("DELETE FROM vaults WHERE user_id = ?")
    .bind(authUser.userId)
    .run();

  return c.json({
    success: true,
  });
});
