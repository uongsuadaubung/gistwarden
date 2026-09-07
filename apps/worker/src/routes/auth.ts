import { type Context, Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import type { AppContext, UserRow } from "../types";
import { createJwtToken, hashPassword, verifyPassword } from "../utils/crypto";

const DEFAULT_SECRET = "gistwarden-default-secure-jwt-key-2026";

export const authRouter = new Hono<AppContext>();

/**
 * POST /auth/register
 * Register a new user account on the Cloudflare D1 database.
 */
authRouter.post("/register", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const rawUsername =
    typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!rawUsername || !password) {
    return c.json(
      {
        error: "missing_fields",
        message: "Username và mật khẩu là bắt buộc",
      },
      400,
    );
  }

  if (rawUsername.length < 2) {
    return c.json(
      {
        error: "username_too_short",
        message: "Username phải có ít nhất 2 ký tự",
      },
      400,
    );
  }

  if (rawUsername.length > 64) {
    return c.json(
      {
        error: "username_too_long",
        message: "Username không được vượt quá 64 ký tự",
      },
      400,
    );
  }

  if (password.length < 6) {
    return c.json(
      {
        error: "password_too_short",
        message: "Mật khẩu máy chủ phải có ít nhất 6 ký tự",
      },
      400,
    );
  }

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

  // Check if username already exists (case-insensitive)
  const existingUser = await db
    .prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE")
    .bind(rawUsername)
    .first<{ id: string }>();

  if (existingUser) {
    return c.json(
      {
        error: "user_already_exists",
        message: `Tài khoản "${rawUsername}" đã tồn tại trên hệ thống`,
      },
      409,
    );
  }

  // Hash password with salt using PBKDF2-SHA256
  const { hash, salt } = await hashPassword(password);
  const userId = crypto.randomUUID();

  // Save new user into D1
  await db
    .prepare(
      "INSERT INTO users (id, username, password_hash, salt, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))",
    )
    .bind(userId, rawUsername, hash, salt)
    .run();

  // Create JWT Bearer token
  const secret = c.env.JWT_SECRET || DEFAULT_SECRET;
  const accessToken = await createJwtToken(
    { userId, username: rawUsername },
    secret,
  );

  return c.json({
    accessToken,
    username: rawUsername,
  });
});

/**
 * POST /auth/login
 * Authenticate user credentials and return a Bearer access token.
 */
authRouter.post("/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const rawUsername =
    typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!rawUsername || !password) {
    return c.json(
      {
        error: "missing_fields",
        message: "Username và mật khẩu là bắt buộc",
      },
      400,
    );
  }

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

  // Find user by username
  const user = await db
    .prepare(
      "SELECT id, username, password_hash, salt FROM users WHERE username = ? COLLATE NOCASE",
    )
    .bind(rawUsername)
    .first<UserRow>();

  if (!user) {
    return c.json(
      {
        error: "invalid_credentials",
        message: "Tên đăng nhập hoặc mật khẩu không chính xác",
      },
      401,
    );
  }

  // Verify PBKDF2 password hash
  const isMatch = await verifyPassword(password, user.password_hash, user.salt);
  if (!isMatch) {
    return c.json(
      {
        error: "invalid_credentials",
        message: "Tên đăng nhập hoặc mật khẩu không chính xác",
      },
      401,
    );
  }

  // Generate new JWT Token
  const secret = c.env.JWT_SECRET || DEFAULT_SECRET;
  const accessToken = await createJwtToken(
    { userId: user.id, username: user.username },
    secret,
  );

  return c.json({
    accessToken,
    username: user.username,
  });
});

export const userRouter = new Hono<AppContext>();

/**
 * Helper: Validate the bearer token and return user profile details.
 * Used by GistWarden client to confirm the account is logged in and active.
 */
async function handleGetUser(c: Context<AppContext>) {
  const authUser = c.get("user")!;
  const db = c.env.DB;

  if (db) {
    // Double-check the user still exists in database
    const userInDb = await db
      .prepare("SELECT id, username, created_at FROM users WHERE id = ?")
      .bind(authUser.userId)
      .first<{ id: string; username: string; created_at: string }>();

    if (!userInDb) {
      return c.json(
        {
          error: "unauthorized",
          message: "Tài khoản không còn tồn tại trên máy chủ",
        },
        401,
      );
    }
  }

  return c.json({
    id: authUser.userId,
    username: authUser.username,
    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
      authUser.username,
    )}`,
  });
}

// Support GET /user both on userRouter (mounted at /user) and on authRouter (mounted at /auth)
userRouter.get("/", requireAuth, handleGetUser);
userRouter.get("/user", requireAuth, handleGetUser);
authRouter.get("/user", requireAuth, handleGetUser);
