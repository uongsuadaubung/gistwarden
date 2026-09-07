import { cors } from "hono/cors";

/**
 * Standard CORS middleware compatible with GistWarden Extension, Web, and Self-Hosted specifications.
 */
export const corsMiddleware = cors({
  origin: "*",
  allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowHeaders: ["*"],
  maxAge: 86400,
});
