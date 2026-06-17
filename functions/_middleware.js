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

const PUBLIC_PATHS = new Set(["/login.html", "/api/login", "/css/style.css", "/favicon.ico"]);

export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  if (PUBLIC_PATHS.has(url.pathname)) return next();

  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/session=([^;]+)/);
  if (match) {
    const [expiresStr, token] = match[1].split(".");
    const expires = Number(expiresStr);
    if (expires && expires > Date.now() && token) {
      const expected = await sign(expiresStr, env.SESSION_SECRET);
      if (expected === token) return next();
    }
  }

  return Response.redirect(new URL("/login.html", request.url), 302);
}
