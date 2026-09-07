import type { MiddlewareHandler } from "hono";
import type { AppContext } from "../types";
import { verifyJwtToken } from "../utils/crypto";

/**
 * Authentication Middleware: validates Bearer token and attaches user context.
 */
export const requireAuth: MiddlewareHandler<AppContext> = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      {
        error: "unauthorized",
        message: "Authorization header with Bearer token is required",
      },
      401,
    );
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return c.json(
      {
        error: "unauthorized",
        message: "Bearer token is empty",
      },
      401,
    );
  }

  const secret = c.env.JWT_SECRET;
  if (!secret) {
    return c.json(
      {
        error: "server_error",
        message: "Máy chủ chưa cấu hình JWT_SECRET trong biến môi trường",
      },
      500,
    );
  }
  const payload = await verifyJwtToken(token, secret);

  if (!payload) {
    return c.json(
      {
        error: "unauthorized",
        message: "Access token is invalid or expired",
      },
      401,
    );
  }

  c.set("user", {
    userId: payload.sub,
    username: payload.username,
  });

  await next();
};
