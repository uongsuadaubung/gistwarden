import { type Context, Hono } from "hono";
import { corsMiddleware } from "./middleware/cors";
import { authRouter, userRouter } from "./routes/auth";
import { oauthRouter } from "./routes/oauth";
import { timeRouter } from "./routes/time";
import { vaultRouter } from "./routes/vault";
import type { AppContext } from "./types";

const app = new Hono<AppContext>();

// 1. Global CORS middleware for all endpoints
app.use("*", corsMiddleware);

// 2. Health & Service info endpoint
const healthHandler = (c: Context<AppContext>) => {
  return c.json({
    message: "Gistwarden API is online.",
    service: "GistWarden Unified Cloudflare Worker API",
    status: "healthy",
    runtime: "Cloudflare Workers + Hono",
    storage: "Cloudflare D1 SQLite",
    version: "1.0.0",
  });
};

app.get("/", healthHandler);
app.get("/api", healthHandler);

// 3. API Sub-router (Standard /api namespace)
const api = new Hono<AppContext>();
api.route("/time", timeRouter); // GET /api/time
api.route("/vault", vaultRouter); // GET, POST, DELETE /api/vault
api.route("/auth", authRouter); // POST /api/auth/register, POST /api/auth/login
api.route("/user", userRouter); // GET /api/user
api.route("/", oauthRouter); // GET /api/oauth/callback, GET /api/callback

// Mount the /api router (New recommended standard)
app.route("/api", api);

// 4. Backward-compatible fallback routes (Root namespace)
app.route("/time", timeRouter); // GET /time
app.route("/vault", vaultRouter); // GET, POST, DELETE /vault
app.route("/auth", authRouter); // POST /auth/register, POST /auth/login
app.route("/user", userRouter); // GET /user
app.route("/", oauthRouter); // GET /oauth/callback, GET /callback

// 4. Global 404 Not Found Handler
app.notFound((c) => {
  return c.json(
    {
      error: "not_found",
      message: `Đường dẫn [${c.req.method}] ${c.req.path} không tồn tại trên hệ thống API`,
    },
    404,
  );
});

// 5. Global Exception Handler
app.onError((err, c) => {
  console.error(`[Worker Unhandled Error] ${c.req.method} ${c.req.path}:`, err);
  return c.json(
    {
      error: "internal_server_error",
      message:
        err.message || "Đã xảy ra lỗi hệ thống nội bộ trên Cloudflare Worker",
    },
    500,
  );
});

export default app;
