import { type Context, Hono } from "hono";
import type { AppContext } from "../types";

export const oauthRouter = new Hono<AppContext>();

/**
 * Helper: Xử lý logic trao đổi OAuth code lấy access_token từ GitHub
 * và chuyển hướng về Extension / Web app dựa trên phân tích state thông minh.
 */
async function handleOauthCallback(c: Context<AppContext>) {
  const code = c.req.query("code");
  const state = c.req.query("state"); // ID của extension hoặc URL redirect đầy đủ

  if (!code || !state) {
    return c.text("Error: Missing code or state parameters.", 400);
  }

  const clientId = c.env.GITHUB_CLIENT_ID;
  const clientSecret = c.env.GITHUB_CLIENT_SECRET;

  // Tự kiểm tra biến môi trường
  if (!clientId || !clientSecret) {
    return c.text(
      "Error: GITHUB_CLIENT_ID hoặc GITHUB_CLIENT_SECRET chưa được cấu hình (hoặc chưa được Save & Deploy) trong mục Settings -> Variables của Cloudflare Worker.",
      500,
    );
  }

  try {
    // Gửi yêu cầu đổi mã lấy access_token lên GitHub sử dụng chuẩn urlencoded
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      },
    );

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (tokenData.error) {
      return c.text(
        `GitHub OAuth Error: ${tokenData.error_description || tokenData.error}`,
        400,
      );
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return c.text(
        "Error: Failed to obtain access token from GitHub response.",
        500,
      );
    }

    // PHÂN TÍCH STATE THÔNG MINH - ĐỀ PHÒNG CẢ CACHE PHIÊN BẢN CŨ
    let redirectUrl = "";

    if (state.includes("://")) {
      // 1. Nếu là URL đầy đủ (ví dụ: https://...)
      const targetUrl = new URL(state);
      targetUrl.searchParams.set("token", accessToken);
      redirectUrl = targetUrl.toString();
    } else if (state.includes(".")) {
      // 2. Nếu là ID Firefox tạm thời có dạng tên miền (chứa dấu chấm)
      // Xóa dấu gạch chéo cuối nếu có rồi redirect trực tiếp
      const cleanState = state.replace(/\/$/, "");
      redirectUrl = `https://${cleanState}/?token=${accessToken}`;
    } else {
      // 3. Nếu là ID Chrome trơn (không có dấu chấm)
      redirectUrl = `https://${state}.chromiumapp.org/oauth2?token=${accessToken}`;
    }

    return c.redirect(redirectUrl, 302);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.text(`Internal Server Error: ${message}`, 500);
  }
}

// Hỗ trợ cả 2 đường dẫn để tương thích 100% với cấu hình hiện tại
oauthRouter.get("/oauth/callback", handleOauthCallback);
oauthRouter.get("/callback", handleOauthCallback);
