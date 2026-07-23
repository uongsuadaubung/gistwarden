const PORT = 8888;

// RAM storage for testing users
const usersDb = new Map<string, string>();
// Pre-populate a test user
usersDb.set("user@example.com", "Password123!");

console.log(`🚀 Web Test Login Server running at http://localhost:${PORT}`);
console.log(`📋 Pre-created account: user@example.com / Password123!`);

Deno.serve({ port: PORT }, async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Handle Static Files
  if (req.method === "GET") {
    let filePath = "./web_test_login/index.html";
    let contentType = "text/html; charset=utf-8";

    if (path === "/" || path === "/index.html") {
      filePath = "./web_test_login/index.html";
    } else if (path === "/register.html" || path === "/register") {
      filePath = "./web_test_login/register.html";
    } else if (path === "/styles.css") {
      filePath = "./web_test_login/styles.css";
      contentType = "text/css; charset=utf-8";
    } else {
      return new Response("Not Found", { status: 404 });
    }

    try {
      const fileContent = await Deno.readTextFile(filePath);
      return new Response(fileContent, {
        headers: { "Content-Type": contentType },
      });
    } catch (_err) {
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  // Handle Form POST Submissions
  if (req.method === "POST") {
    try {
      const formData = await req.formData();
      const username = formData.get("username")?.toString().trim() || "";
      const password = formData.get("password")?.toString() || "";

      if (path === "/login") {
        if (!username || !password) {
          return Response.redirect(
            `${url.origin}/index.html?err=Vui+l%C3%B2ng+nh%E1%BA%ADp+đ%E1%BA%A7y+đ%E1%BB%A7+th%C3%B4ng+tin`,
            303,
          );
        }

        const existingPassword = usersDb.get(username);
        if (!existingPassword) {
          // If user does not exist yet, save it to RAM so login succeeds
          usersDb.set(username, password);
        } else if (existingPassword !== password) {
          // Update password in RAM for existing user
          usersDb.set(username, password);
        }

        return Response.redirect(
          `${url.origin}/index.html?msg=%C4%90%C4%83ng+nh%E1%BA%ADp+th%C3%A0nh+c%C3%B4ng!+Ch%C3%A0o+m%E1%BB%ABng+${
            encodeURIComponent(username)
          }`,
          303,
        );
      }

      if (path === "/register") {
        if (!username || !password) {
          return Response.redirect(
            `${url.origin}/register.html?err=Vui+l%C3%B2ng+nh%E1%BA%ADp+đ%E1%BA%A7y+đ%E1%BB%A7+th%C3%B4ng+tin`,
            303,
          );
        }

        // Save new user in RAM
        usersDb.set(username, password);

        return Response.redirect(
          `${url.origin}/index.html?msg=%C4%90%C4%83ng+k%C3%BD+th%C3%A0nh+c%C3%B4ng!+Vui+l%C3%B2ng+đ%C4%83ng+nh%E1%BA%ADp`,
          303,
        );
      }
    } catch (_err) {
      return new Response("Bad Request", { status: 400 });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
});
