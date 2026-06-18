const PUBLIC_PATHS = new Set(["/login", "/login.html", "/css/style.css", "/favicon.ico"]);

async function sign(message, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function isAuthed(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/session=([^;]+)/);
  if (!match) return false;
  const [expiresStr, token] = match[1].split(".");
  const expires = Number(expiresStr);
  if (!expires || expires <= Date.now() || !token) return false;
  const expected = await sign(expiresStr, env.SESSION_SECRET);
  return expected === token;
}

async function handleLogin(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const drink = typeof body.drink === "string" ? body.drink : "";
  const book = typeof body.book === "string" ? body.book : "";
  const okDrink = drink === (env.LOGIN_DRINK || "").trim().toLowerCase();
  const okBook = book === (env.LOGIN_BOOK || "").trim().toLowerCase();

  if (!okDrink || !okBook) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const expires = Date.now() + 1000 * 60 * 60 * 24; // signature valid 24h, but cookie itself is session-only
  const token = await sign(`${expires}`, env.SESSION_SECRET);
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append(
    "Set-Cookie",
    `session=${expires}.${token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
  );
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/login" && request.method === "POST") {
      return handleLogin(request, env);
    }

    if (PUBLIC_PATHS.has(url.pathname)) {
      return env.ASSETS.fetch(request);
    }

    if (await isAuthed(request, env)) {
      return env.ASSETS.fetch(request);
    }

    return Response.redirect(new URL("/login", request.url), 302);
  },
};
